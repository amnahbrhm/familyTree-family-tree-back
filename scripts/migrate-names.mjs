// One-off migration: compute and STORE `firstname` and `fullname` on every
// FAMILYMEMPER node.
//
//   firstname = first word of `name` (everyone)
//   fullname  = - external members: the whole `name` (their lineage isn't in
//                 our tree, so keep their full given name as-is)
//               - internal members: firstname + father's firstname +
//                 grandfather's firstname (lineage walked up the father chain)
//
// The original `name` is left untouched. This same query is re-run by the API
// after any name/relationship change to keep the stored values fresh.
import neo4j from "neo4j-driver";
import { config } from "dotenv";
config({ quiet: true });

const clean = (s) => (s || "").replace(/['" ]/g, "");

export const RECOMPUTE_NAMES_CYPHER = `
MATCH (n:FAMILYMEMPER)
WITH n, head(split(trim(n.name), ' ')) AS fw
SET n.firstname = fw,
    n.fullname = CASE WHEN coalesce(n.external, false)
      THEN n.name
      ELSE fw
        + coalesce(' ' + head([ (f:FAMILYMEMPER)-[:father]->(n) | head(split(trim(f.name), ' ')) ]), '')
        + coalesce(' ' + head([ (g:FAMILYMEMPER)-[:father]->(:FAMILYMEMPER)-[:father]->(n) | head(split(trim(g.name), ' ')) ]), '')
      END
`;

async function main() {
  const driver = neo4j.driver(
    clean(process.env.NEO4J_URI),
    neo4j.auth.basic(clean(process.env.NEO4J_USERNAME), clean(process.env.NEO4J_PASSWORD))
  );
  const session = driver.session();
  try {
    await session.run(RECOMPUTE_NAMES_CYPHER);
    const sample = await session.run(
      `MATCH (n:FAMILYMEMPER)
       RETURN n.external AS ext, n.name AS name, n.firstname AS firstname, n.fullname AS fullname
       ORDER BY n.external DESC LIMIT 6`
    );
    console.log("Migrated. Samples:");
    sample.records.forEach((r) =>
      console.log(
        `  [${r.get("ext") ? "external" : "internal"}] name="${r.get("name")}" -> firstname="${r.get(
          "firstname"
        )}" | fullname="${r.get("fullname")}"`
      )
    );
    const c = await session.run(
      `MATCH (n:FAMILYMEMPER) WHERE n.firstname IS NULL OR n.fullname IS NULL RETURN count(n) AS c`
    );
    console.log("Nodes missing firstname/fullname:", c.records[0].get("c").toNumber());
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((e) => {
  console.error("ERR", e);
  process.exit(1);
});
