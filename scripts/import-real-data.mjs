// Import real family data from CSV into Neo4j.
//
// Reads two CSVs (default: ../../data/people.csv and ../../data/relationships.csv)
// and loads them into the existing schema:
//   - FAMILYMEMPER nodes with { id, name, sex, external, role, maritalStatus,
//     phoneNumber? }  (additive nullable fields deathDate/photoUrl are left unset)
//   - edges: (parent)-[:father|mother]->(child), (child)-[:child]->(parent),
//     (husband)-[:husband]->(wife), (wife)-[:wife]->(husband)
//
// CSV relationship-row conventions (decoded from the data):
//   father row:  from = CHILD,    to = FATHER
//   mother row:  from = MOTHER,   to = CHILD
//   child  row:  from = FATHER,   to = CHILD     (redundant with father rows)
//   wife   row:  from = HUSBAND,  to = WIFE
//   husband row: from = WIFE,     to = HUSBAND   (reciprocal of wife rows)
//
// WARNING: this WIPES the database (DETACH DELETE) before loading. Run with
//   node scripts/import-real-data.mjs
// from the backend directory (so .env + node_modules resolve).

import neo4j from "neo4j-driver";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.IMPORT_DATA_DIR || path.resolve(__dirname, "../../data");
const PEOPLE_CSV = path.join(DATA_DIR, "people.csv");
const REL_CSV = path.join(DATA_DIR, "relationships.csv");

// The authenticated admin user (set role=admin + login phone).
const ADMIN_ID = "15-3-1-1-1-1-1";
const ADMIN_PHONE = "966556004181";

const clean = (s) => (s || "").replace(/['"]/g, "").trim();

// Minimal CSV reader: strips BOM + CR, splits on commas. Our data has no
// quoted/embedded commas (verified), so a plain split is safe.
function readCsv(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

function main() {
  const people = readCsv(PEOPLE_CSV);
  const rels = readCsv(REL_CSV);

  const byId = new Map();
  for (const p of people) {
    byId.set(p.id, {
      id: p.id,
      name: p.name,
      sex: p.sex, // 'male' | 'famale' (existing spelling preserved)
      external: String(p.external).toLowerCase() === "true",
    });
  }

  // Derive parent maps + marriages from the relationship rows.
  const fatherOf = new Map(); // childId -> fatherId
  const motherOf = new Map(); // childId -> motherId
  const marriages = new Map(); // `${husband}|${wife}` -> { husband, wife }

  for (const r of rels) {
    const from = r.from_id;
    const to = r.to_id;
    switch (r.type) {
      case "father": // from = child, to = father
        fatherOf.set(from, to);
        break;
      case "mother": // from = mother, to = child
        motherOf.set(to, from);
        break;
      case "wife": // from = husband, to = wife
        marriages.set(`${from}|${to}`, { husband: from, wife: to });
        break;
      case "child": // from = father, to = child  (redundant; covered by father)
      case "husband": // reciprocal of wife (covered)
        break;
      default:
        console.warn("Unknown relationship type:", r.type);
    }
  }

  // --- validation -----------------------------------------------------------
  const warnings = [];
  const married = new Set();
  for (const { husband, wife } of marriages.values()) {
    married.add(husband);
    married.add(wife);
    if (byId.get(husband)?.sex !== "male")
      warnings.push(`husband not male: ${husband} (${byId.get(husband)?.name})`);
    if (byId.get(wife)?.sex !== "famale")
      warnings.push(`wife not famale: ${wife} (${byId.get(wife)?.name})`);
  }
  for (const [child, father] of fatherOf) {
    if (byId.get(father)?.sex !== "male")
      warnings.push(`father not male: ${father} of ${child}`);
  }
  for (const [child, mother] of motherOf) {
    if (byId.get(mother)?.sex !== "famale")
      warnings.push(`mother not famale: ${mother} of ${child}`);
  }

  // Build node params with derived role + maritalStatus.
  const nodeParams = [...byId.values()].map((p) => ({
    id: p.id,
    name: p.name,
    sex: p.sex,
    external: p.external,
    role: p.id === ADMIN_ID ? "admin" : "member",
    maritalStatus: married.has(p.id) ? "married" : "single",
    phoneNumber: p.id === ADMIN_ID ? ADMIN_PHONE : null,
  }));

  // Parent edges (both directions per existing schema).
  const fatherEdges = [...fatherOf].map(([child, father]) => ({ parent: father, child }));
  const motherEdges = [...motherOf].map(([child, mother]) => ({ parent: mother, child }));
  const marriageEdges = [...marriages.values()];

  return {
    nodeParams,
    fatherEdges,
    motherEdges,
    marriageEdges,
    warnings,
    counts: {
      people: nodeParams.length,
      fathers: fatherEdges.length,
      mothers: motherEdges.length,
      marriages: marriageEdges.length,
      adminFound: nodeParams.some((n) => n.id === ADMIN_ID),
    },
  };
}

async function load(plan) {
  const driver = neo4j.driver(
    clean(process.env.NEO4J_URI),
    neo4j.auth.basic(clean(process.env.NEO4J_USERNAME), clean(process.env.NEO4J_PASSWORD))
  );
  const session = driver.session();
  try {
    console.log("Wiping database (DETACH DELETE)...");
    await session.run("MATCH (n) DETACH DELETE n");

    console.log(`Creating ${plan.nodeParams.length} people...`);
    await session.run(
      `UNWIND $rows AS row
       CREATE (p:FAMILYMEMPER {
         id: row.id, name: row.name, sex: row.sex, external: row.external,
         role: row.role, maritalStatus: row.maritalStatus
       })
       FOREACH (_ IN CASE WHEN row.phoneNumber IS NULL THEN [] ELSE [1] END |
         SET p.phoneNumber = row.phoneNumber)`,
      { rows: plan.nodeParams }
    );

    console.log(`Linking ${plan.fatherEdges.length} father edges...`);
    await session.run(
      `UNWIND $rows AS row
       MATCH (f:FAMILYMEMPER {id: row.parent}), (c:FAMILYMEMPER {id: row.child})
       MERGE (f)-[:father]->(c)
       MERGE (c)-[:child]->(f)`,
      { rows: plan.fatherEdges }
    );

    console.log(`Linking ${plan.motherEdges.length} mother edges...`);
    await session.run(
      `UNWIND $rows AS row
       MATCH (m:FAMILYMEMPER {id: row.parent}), (c:FAMILYMEMPER {id: row.child})
       MERGE (m)-[:mother]->(c)
       MERGE (c)-[:child]->(m)`,
      { rows: plan.motherEdges }
    );

    console.log(`Linking ${plan.marriageEdges.length} marriages...`);
    await session.run(
      `UNWIND $rows AS row
       MATCH (h:FAMILYMEMPER {id: row.husband}), (w:FAMILYMEMPER {id: row.wife})
       MERGE (h)-[hm:husband]->(w)
         ON CREATE SET hm.status = 'married'
       MERGE (w)-[:wife]->(h)`,
      { rows: plan.marriageEdges }
    );

    // Post-load counts.
    const c = await session.run(`
      MATCH (p:FAMILYMEMPER) WITH count(p) AS people
      MATCH (:FAMILYMEMPER)-[f:father]->() WITH people, count(f) AS fathers
      MATCH (:FAMILYMEMPER)-[m:mother]->() WITH people, fathers, count(m) AS mothers
      MATCH (:FAMILYMEMPER)-[h:husband]->() RETURN people, fathers, mothers, count(h) AS marriages
    `);
    const row = c.records[0];
    console.log("\nLoaded in DB:", {
      people: row.get("people").toNumber(),
      fathers: row.get("fathers").toNumber(),
      mothers: row.get("mothers").toNumber(),
      marriages: row.get("marriages").toNumber(),
    });
    const admin = await session.run(
      `MATCH (p:FAMILYMEMPER {id: $id}) RETURN p.name AS name, p.role AS role, p.phoneNumber AS phone`,
      { id: ADMIN_ID }
    );
    if (admin.records.length) {
      const a = admin.records[0];
      console.log("Admin:", a.get("name"), "| role:", a.get("role"), "| phone:", a.get("phone"));
    }
  } finally {
    await session.close();
    await driver.close();
  }
}

const plan = main();
console.log("Plan counts:", plan.counts);
if (plan.warnings.length) {
  console.log(`\n${plan.warnings.length} gender-consistency warnings (first 10):`);
  plan.warnings.slice(0, 10).forEach((w) => console.log("  -", w));
}
await load(plan);
console.log("\nDone.");