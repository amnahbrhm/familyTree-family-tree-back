// import NotFoundError from "../errors/not-found.error.js";
import {
  CreatePersonProperties,
  Person,
  PersonProperties,
} from "../models/users.js";
import { toNativeTypes } from "../utils.js";
import neo4j, { Driver, Record } from "neo4j-driver";
import cypher from "../cypher/index.ts";
import { v4 as uuidv4 } from "uuid";

export default class PeopleService {
  driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async getAll(q: any, sort = "name", order = "ASC", limit = 6, skip = 0) {
    // TODO: Get a list of people from the database
    let users: PersonProperties[] = [];
    const session = this.driver.session();
    let count;
    try {
      const res = await session.executeRead((tx) =>
        tx.run<Person>(
          cypher("get-familymember"),
          { s: neo4j.int(skip), l: neo4j.int(limit), order: `p.${order}` }
          // { timeout: 3000 }
        )
      );
      users = res.records.map((record: Record) => {
        return record.get("p").properties;
      });
      const res2 = await session.run(
        `MATCH (p:FAMILYMEMPER)
        RETURN count(p) as count`
      );
      count = res2.records[0].get("count").low;
    } finally {
      await session.close();
    }

    return { items: users, count };
  }
  // end::all[]

  async findById(id: string): Promise<PersonProperties> {
    const session = this.driver.session();
    let user: PersonProperties[];
    try {
      const res = await session.executeRead((tx) =>
        tx.run<Person>(cypher("get-user-by-id"), { id })
      );
      user = res.records.map((record: Record) => {
        return record.get("p").properties;
      });
    } finally {
      await session.close();
    }

    return user[0];
  }

  async findByPhone(phone: string): Promise<PersonProperties> {
    const session = this.driver.session();
    let user: PersonProperties[];
    try {
      const res = await session.executeRead((tx) =>
        tx.run<Person>(cypher("get-user-by-phone"), { phone })
      );
      // console.log(res.records[0].get('properties'));

      user = res.records.map((record: Record) => {
        return record.get("p").properties;
      });
    } finally {
      await session.close();
    }

    return user[0];
  }

  async createUser(person: CreatePersonProperties): Promise<PersonProperties> {
    console.log(person);
    
    const session = this.driver.session();
    (person as PersonProperties) = { ...person, id: uuidv4() };

    try {
      const res = await session.executeWrite((tx) =>
        tx.run<any>(cypher("create-user"), { ...person })
      );
      person = res.records[0].get("p");
    } finally {
      await session.close();
    }

    return person as PersonProperties;
  }
}
