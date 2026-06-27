import { Driver } from "neo4j-driver";
import cypher from "../cypher/index";
import { toNativeTypes } from "../../utils.js";
import { v4 as uuidv4 } from "uuid";

// Scalar fields a moderator/admin may edit directly. Deliberately excludes
// `id` and `role` (role changes go through the moderator-assignment flow).
export const EDITABLE_FIELDS = [
  "name",
  "sex",
  "external",
  "birthDate",
  "deathDate",
  "photoUrl",
  "maritalStatus",
  "phoneNumber",
] as const;

// Convert a Neo4j node (or null) into a plain props object.
function nativeProps(node: any): any {
  return node ? toNativeTypes(node.properties) : null;
}

// Whole years between birthDate and (deathDate or today). null if no birthDate.
function computeAge(
  birthDate?: string | null,
  deathDate?: string | null
): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const end = deathDate ? new Date(deathDate) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
  return age;
}

// First word of a name (the person's own given name).
function firstWord(name?: string | null): string {
  return (name || "").trim().split(/\s+/)[0] || "";
}

// The "basics" shape returned for the person and every relative.
function basics(node: any): any {
  const p = nativeProps(node);
  if (!p) return null;
  return {
    id: p.id,
    name: p.name ?? null,
    firstname: p.firstname ?? firstWord(p.name),
    fullname: p.fullname ?? p.name ?? null,
    sex: p.sex ?? null,
    birthDate: p.birthDate ?? null,
    deathDate: p.deathDate ?? null,
    photoUrl: p.photoUrl ?? null,
    role: p.role ?? null,
    external: p.external ?? null,
    deceased: !!p.deathDate,
    age: computeAge(p.birthDate, p.deathDate),
  };
}

export default class MembersService {
  driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // GET /api/members/:id — full profile payload.
  async getMemberProfile(id: string): Promise<any | null> {
    const session = this.driver.session();
    try {
      const res = await session.executeRead((tx) =>
        tx.run(cypher("get-member-profile"), { id })
      );
      if (res.records.length === 0) return null;
      const record = res.records[0];

      const person = basics(record.get("p"));
      const father = basics(record.get("father"));
      const mother = basics(record.get("mother"));

      const spouses = (record.get("spouses") as any[])
        .filter((s) => s && s.spouse) // OPTIONAL MATCH yields one null row when no spouse
        .map((s) => {
          const marriage = s.marriage ? toNativeTypes(s.marriage.properties) : {};
          return {
            ...basics(s.spouse),
            marriageDate: marriage.marriageDate ?? null,
            divorceDate: marriage.divorceDate ?? null,
            status: marriage.status ?? "married",
            children: (s.children as any[]).map(basics),
          };
        });

      const childrenWithUnknownMother = (
        record.get("childrenWithUnknownMother") as any[]
      ).map(basics);

      return {
        ...person,
        parents: { father, mother },
        spouses,
        childrenWithUnknownMother,
      };
    } finally {
      await session.close();
    }
  }

  // Recompute and store firstname/fullname for everyone. Cheap on this graph
  // size; called after any name or relationship change to avoid stale values.
  async recomputeAllNames(): Promise<void> {
    const session = this.driver.session();
    try {
      await session.executeWrite((tx) => tx.run(cypher("recompute-names")));
    } finally {
      await session.close();
    }
  }

  async exists(id: string): Promise<boolean> {
    const session = this.driver.session();
    try {
      const res = await session.run(
        `MATCH (p:FAMILYMEMPER {id: $id}) RETURN p.id AS id`,
        { id }
      );
      return res.records.length > 0;
    } finally {
      await session.close();
    }
  }

  // Edit scalar fields on a member. Only whitelisted keys present in `fields`
  // are applied. Returns the updated profile payload (or null if not found).
  async updateMember(id: string, fields: Record<string, any>): Promise<any | null> {
    const sets: Record<string, any> = {};
    for (const key of EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        sets[key] = fields[key] === "" ? null : fields[key];
      }
    }
    if (Object.keys(sets).length === 0) {
      return this.getMemberProfile(id);
    }
    const setClause = Object.keys(sets)
      .map((k) => `p.${k} = $sets.${k}`)
      .join(", ");

    const session = this.driver.session();
    try {
      const res = await session.executeWrite((tx) =>
        tx.run(
          `MATCH (p:FAMILYMEMPER {id: $id}) SET ${setClause} RETURN p.id AS id`,
          { id, sets }
        )
      );
      if (res.records.length === 0) return null;
    } finally {
      await session.close();
    }
    // A name edit changes firstname/fullname (and descendants' fullname).
    if (Object.prototype.hasOwnProperty.call(sets, "name")) {
      await this.recomputeAllNames();
    }
    return this.getMemberProfile(id);
  }

  // Create a new member, then optionally link it into the tree.
  // links: { fatherId?, motherId?, spouseId?, childId? }
  async createMember(
    props: Record<string, any>,
    links: { fatherId?: string; motherId?: string; spouseId?: string; childId?: string }
  ): Promise<any> {
    const id = uuidv4();
    const base = {
      id,
      name: props.name ?? "",
      sex: props.sex === "famale" ? "famale" : "male",
      external: !!props.external,
      role: "member",
      maritalStatus: props.maritalStatus ?? "single",
    };
    const optional: Record<string, any> = {};
    for (const k of ["birthDate", "deathDate", "photoUrl", "phoneNumber"]) {
      if (props[k]) optional[k] = props[k];
    }

    const session = this.driver.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `CREATE (p:FAMILYMEMPER {
             id: $base.id, name: $base.name, sex: $base.sex,
             external: $base.external, role: $base.role,
             maritalStatus: $base.maritalStatus
           })
           SET p += $optional`,
          { base, optional }
        )
      );
    } finally {
      await session.close();
    }

    if (links.fatherId) await this.setParent(id, links.fatherId, "father");
    if (links.motherId) await this.setParent(id, links.motherId, "mother");
    if (links.spouseId) await this.addSpouse(id, links.spouseId);
    if (links.childId) await this.addChild(id, links.childId);

    await this.recomputeAllNames();
    return this.getMemberProfile(id);
  }

  // If a child has BOTH a father and a mother, ensure those co-parents are
  // married (husband/wife). Two people who share a child are spouses — so
  // setting a child's second parent also links the parents together.
  // Idempotent; supports polygamy (the father may already have other wives).
  async marryCoParents(childId: string): Promise<void> {
    const session = this.driver.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `MATCH (f:FAMILYMEMPER)-[:father]->(c:FAMILYMEMPER {id: $childId})
           MATCH (m:FAMILYMEMPER)-[:mother]->(c)
           MERGE (f)-[hm:husband]->(m) ON CREATE SET hm.status = 'married'
           MERGE (m)-[:wife]->(f)`,
          { childId }
        )
      );
    } finally {
      await session.close();
    }
  }

  // Set (or replace) the mother/father of a child. Removes any existing edge
  // of that kind first, so fixing a wrong/missing parent is a single call.
  // Also marries the two co-parents if the child now has both.
  async setParent(
    childId: string,
    parentId: string,
    kind: "mother" | "father"
  ): Promise<any | null> {
    const session = this.driver.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `MATCH (c:FAMILYMEMPER {id: $childId})
           OPTIONAL MATCH (oldP)-[r:${kind}]->(c)
           OPTIONAL MATCH (c)-[rc:child]->(oldP)
           DELETE r, rc
           WITH c
           MATCH (p:FAMILYMEMPER {id: $parentId})
           MERGE (p)-[:${kind}]->(c)
           MERGE (c)-[:child]->(p)`,
          { childId, parentId }
        )
      );
    } finally {
      await session.close();
    }
    await this.marryCoParents(childId);
    await this.recomputeAllNames();
    return this.getMemberProfile(childId);
  }

  // Marry two people. Husband = the male, wife = the female (opposite sexes
  // assumed). Idempotent.
  async addSpouse(aId: string, bId: string): Promise<any> {
    const session = this.driver.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `MATCH (a:FAMILYMEMPER {id: $aId}), (b:FAMILYMEMPER {id: $bId})
           WITH CASE WHEN a.sex = 'male' THEN a ELSE b END AS h,
                CASE WHEN a.sex = 'male' THEN b ELSE a END AS w
           MERGE (h)-[hm:husband]->(w) ON CREATE SET hm.status = 'married'
           MERGE (w)-[:wife]->(h)`,
          { aId, bId }
        )
      );
    } finally {
      await session.close();
    }
    return this.getMemberProfile(aId);
  }

  // Remove the mother/father link of a child (deletes the parent edge of that
  // kind and the matching child edge).
  async removeParent(childId: string, kind: "mother" | "father"): Promise<any | null> {
    const session = this.driver.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `MATCH (c:FAMILYMEMPER {id: $childId})
           OPTIONAL MATCH (p)-[r:${kind}]->(c)
           OPTIONAL MATCH (c)-[rc:child]->(p)
           DELETE r, rc`,
          { childId }
        )
      );
    } finally {
      await session.close();
    }
    await this.recomputeAllNames();
    return this.getMemberProfile(childId);
  }

  // Remove the marriage between two people (both husband and wife edges).
  async removeSpouse(aId: string, bId: string): Promise<any> {
    const session = this.driver.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `MATCH (a:FAMILYMEMPER {id: $aId}), (b:FAMILYMEMPER {id: $bId})
           OPTIONAL MATCH (a)-[r1:husband|wife]->(b)
           OPTIONAL MATCH (b)-[r2:husband|wife]->(a)
           DELETE r1, r2`,
          { aId, bId }
        )
      );
    } finally {
      await session.close();
    }
    return this.getMemberProfile(aId);
  }

  // Remove a parent->child link (deletes the father/mother edge and the
  // matching child edge).
  async removeChild(parentId: string, childId: string): Promise<any> {
    const session = this.driver.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `MATCH (p:FAMILYMEMPER {id: $parentId}), (c:FAMILYMEMPER {id: $childId})
           OPTIONAL MATCH (p)-[r:father|mother]->(c)
           OPTIONAL MATCH (c)-[rc:child]->(p)
           DELETE r, rc`,
          { parentId, childId }
        )
      );
    } finally {
      await session.close();
    }
    return this.getMemberProfile(parentId);
  }

  // Add an existing person as a child of a parent (parent links via father if
  // male, mother if female).
  async addChild(parentId: string, childId: string): Promise<any> {
    const session = this.driver.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `MATCH (p:FAMILYMEMPER {id: $parentId}), (c:FAMILYMEMPER {id: $childId})
           FOREACH (_ IN CASE WHEN p.sex = 'male' THEN [1] ELSE [] END |
             MERGE (p)-[:father]->(c) MERGE (c)-[:child]->(p))
           FOREACH (_ IN CASE WHEN p.sex = 'famale' THEN [1] ELSE [] END |
             MERGE (p)-[:mother]->(c) MERGE (c)-[:child]->(p))`,
          { parentId, childId }
        )
      );
    } finally {
      await session.close();
    }
    // If the child now has both parents, marry the co-parents.
    await this.marryCoParents(childId);
    await this.recomputeAllNames();
    return this.getMemberProfile(parentId);
  }

  // GET /api/tree — whole graph for the home view.
  async getTree(): Promise<{ nodes: any[]; edges: any[] }> {
    const session = this.driver.session();
    try {
      const res = await session.executeRead((tx) =>
        tx.run(cypher("get-tree"))
      );
      if (res.records.length === 0) return { nodes: [], edges: [] };
      const record = res.records[0];
      return {
        nodes: record.get("nodes"),
        edges: record.get("edges"),
      };
    } finally {
      await session.close();
    }
  }
}