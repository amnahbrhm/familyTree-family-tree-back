import { Integer, Node, Relationship } from "neo4j-driver";

export type MaritalStatus = "single" | "married" | "widowed" | "divorced";

// The three roles stored in the `role` property. `member` is the default.
// (Kept as string values — these are persisted in Neo4j and used by the
// permission middleware in Phase 4.)
export type Role = "member" | "moderator" | "admin";

// Status stored on a marriage (husband/wife) relationship. "widowed" is NOT
// stored — it is derived when a spouse has a `deathDate` and the marriage is
// not divorced.
export type MarriageStatus = "married" | "divorced";

// Status stored on an EDITREQUEST node.
export type EditRequestStatus = "pending" | "approved" | "rejected";

export interface PersonProperties {
  name: string;
  birthDate: string;
  id: string;
  external: boolean;
  sex: "male" | "famale";
  maritalStatus: MaritalStatus;
  phoneNumber: string;
  role: Role;
  // Additive, nullable fields (backward compatible):
  deathDate?: string | null; // null = alive
  photoUrl?: string | null; // null = no photo
  updatedBy: string;
  createdBy: string;
}

export type CreatePersonProperties = Omit<PersonProperties, "id">;


export type Person = Node<Integer, PersonProperties>;

// Properties stored on the marriage (husband/wife) relationship.
export interface MarriageProperties {
  marriageDate?: string | null;
  divorceDate?: string | null; // null unless divorced
  status: MarriageStatus;
}

type MarriedTo = Relationship<Integer, MarriageProperties>;

interface PersonMarriedToPerson {
  h: Person;
  r: MarriedTo;
  w: Person;
}

// EDITREQUEST node — a pending proposed change to a FAMILYMEMPER.
// Related to its TARGET member and its SUBMITTED_BY member. (Used in Phase 4.)
export interface EditRequestProperties {
  id: string;
  proposedChanges: string; // JSON string of the changed fields
  status: EditRequestStatus;
  createdAt: string;
  decidedAt?: string | null;
  decidedBy?: string | null;
}

export type EditRequest = Node<Integer, EditRequestProperties>;


export type JwtPayload = PersonProperties & {
    exp: number;
    iat: number;
  }