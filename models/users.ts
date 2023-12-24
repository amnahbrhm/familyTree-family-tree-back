import { Integer, Node, Relationship } from "neo4j-driver";

enum maritalStatusEnum {
  single,
  married,
  widowed,
  divorced,
}

export interface PersonProperties {
  name: string;
  birthDate: string;
  id: string;
  external: boolean;
  sex: "male" | "famale";
  maritalStatus: maritalStatusEnum;
}

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
