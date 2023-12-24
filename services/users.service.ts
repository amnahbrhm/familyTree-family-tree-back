// import NotFoundError from "../errors/not-found.error.js";
import { Person, PersonProperties } from "../models/users.js";
import { toNativeTypes } from "../utils.js";
import neo4j, { Driver, Record } from "neo4j-driver";
import cypher from '../cypher/index.ts'

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
          { s: neo4j.int(skip), l: neo4j.int(limit), order: `p.${order}` },
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
}
