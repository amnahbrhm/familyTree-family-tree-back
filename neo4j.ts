// TODO: Import the neo4j-driver dependency
import neo4j, { Driver } from "neo4j-driver";

/**
 * A singleton instance of the Neo4j Driver to be used across the app
 *
 * @type {Driver}
 */
// tag::driver[]
let driver: Driver;
// end::driver[]

/**
 * Initiate the Neo4j Driver
 *
 * @param {string} uri   The neo4j URI, eg. `neo4j://localhost:7687`
 * @param {string} username   The username to connect to Neo4j with, eg `neo4j`
 * @param {string} password   The password for the user
 * @returns {Promise<Driver>}
 */
// tag::initDriver[]
export async function initDriver(
  uri: string,
  username: string,
  password: string
) {
  // TODO: Create an instance of the driver here
  console.log(uri, username, password);
  
  driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  // Don't let a failed initial connection crash the process (neo4j-driver 6
  // surfaces this as an unhandled rejection). Log and let routes retry lazily.
  driver
    .verifyConnectivity()
    .then(() => console.log("Connected to Neo4j"))
    .catch((err) =>
      console.error(`Could not connect to Neo4j: ${err.message}`)
    );
}
// end::initDriver[]

/**
 * Get the instance of the Neo4j Driver created in the
 * `initDriver` function
 *
 * @param {string} uri   The neo4j URI, eg. `neo4j://localhost:7687`
 * @param {string} username   The username to connect to Neo4j with, eg `neo4j`
 * @param {string} password   The password for the user
 * @returns {neo4jDriver.neo4j.Driver}
 */
// tag::getDriver[]
export function getDriver() {
  return driver;
}
// end::getDriver[]

/**
 * If the driver has been instantiated, close it and all
 * remaining open sessions
 *
 * @returns {void}
 */
// tag::closeDriver[]
export async function closeDriver() {
  if (driver) {
    await driver.close();
  }
}
// end::closeDriver[]
