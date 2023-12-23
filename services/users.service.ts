// import NotFoundError from "../errors/not-found.error.js";
// import { pacino, people } from "../../test/fixtures/people.js";
import { toNativeTypes } from "../utils.js";
import neo4j, { Driver, Record } from "neo4j-driver";

// TODO: Import the `int` function from neo4j-driver

export default class PeopleService {
  /**
   * @type {neo4j.Driver}
   */
  driver;
  session;

  /**
   * The constructor expects an instance of the Neo4j Driver, which will be
   * used to interact with Neo4j.
   *
   * @param {neo4j.Driver} driver
   */
  constructor(driver: Driver) {
    this.driver = driver;
    this.session = driver.session();
  }

  /**
   * @public
   * This method should return a paginated list of People (actors or directors),
   * with an optional filter on the person's name based on the `q` parameter.
   *
   * Results should be ordered by the `sort` parameter and limited to the
   * number passed as `limit`.  The `skip` variable should be used to skip a
   * certain number of rows.
   *
   * @param {string|undefined} q    Used to filter on the person's name
   * @param {string} sort        Field in which to order the records
   * @param {string} order          Direction for the order (ASC/DESC)
   * @param {number} limit          The total number of records to return
   * @param {number} skip           The number of records to skip
   * @returns {Promise<Record<string, any>[]>}
   */
  // tag::all[]
  async all(q: any, sort = "name", order = "ASC", limit = 6, skip = 0) {
    // TODO: Get a list of people from the database
    let people: any[];
    try {
      const res = await this.session.run(
        `
        MATCH (p:FAMILYMEMPER) RETURN p ORDER BY p.name
        SKIP $skip
        LIMIT $limit`, // (1)
        { skip, limit, order, sort },
        { timeout: 3000 } // (3)
      );
      people = res.records.map((record: Record) => {
        // e.g. record.get('key')
        return record.get('p')
      });
    } finally {
      // Close the session
      await this.session.close();
    }
    return people.slice(skip, skip + limit);
  }
  // end::all[]

  /**
   * @public
   * Find a user by their ID.
   *
   * If no user is found, a NotFoundError should be thrown.
   *
   * @param {string} id   The tmdbId for the user
   * @returns {Promise<Record<string, any>>}
   */
  // tag::findById[]

  //   async findById(id) {
  //     // TODO: Find a user by their ID

  //     return pacino;
  //   }
  //   // end::findById[]

  //   /**
  //    * @public
  //    * Get a list of similar people to a Person, ordered by their similarity score
  //    * in descending order.
  //    *
  //    * @param {string} id     The ID of the user
  //    * @param {number} limit  The total number of records to return
  //    * @param {number} skip   The number of records to skip
  //    * @returns {Promise<Record<string, any>[]>}
  //    */
  //   // tag::getSimilarPeople[]
  //   async getSimilarPeople(id, limit = 6, skip = 0) {
  //     // TODO: Get a list of similar people to the person by their id

  //     return people.slice(skip, skip + limit);
  //   }
  //   // end::getSimilarPeople[]
}
