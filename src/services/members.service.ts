import { Driver } from "neo4j-driver";
import cypher from "../cypher/index";
import { toNativeTypes } from "../../utils.js";

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

// The "basics" shape returned for the person and every relative.
function basics(node: any): any {
  const p = nativeProps(node);
  if (!p) return null;
  return {
    id: p.id,
    name: p.name ?? null,
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