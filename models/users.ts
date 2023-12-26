import { Integer, Node, Relationship } from "neo4j-driver";

enum MaritalStatusEnum {
  single,
  married,
  widowed,
  divorced,
}

enum RolesEnum {
  person,
  admin,
  root
}

export interface PersonProperties {
  name: string;
  birthDate: string;
  id: string;
  external: boolean;
  sex: "male" | "famale";
  maritalStatus: MaritalStatusEnum;
  phoneNumber: string;
  role: RolesEnum;
  deathDate?: string,
  updatedBy: string,
  createdBy: string
}

export type CreatePersonProperties = Omit<PersonProperties, "id">


export type Person = Node<Integer, PersonProperties>;

type MarriedTo = Relationship<
  Integer,
  {
    start: string;
    end: string;
  }
>;

interface PersonMarriedToPerson {
  h: Person;
  r: MarriedTo;
  w: Person;
}


export type JwtPayload = PersonProperties & {
    exp: number;
    iat: number;
  }