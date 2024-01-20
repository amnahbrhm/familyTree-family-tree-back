import express, { Application, Request, Response } from "express";
import neo4j from "neo4j-driver";
import {
  API_PREFIX,
  JWT_SECRET,
  NEO4J_PASSWORD,
  NEO4J_URI,
  NEO4J_USERNAME,
} from "./constants";
import { initDriver } from "./neo4j";
import cors from "cors";
import routes from "./src/routes/index";
import bodyParser from "body-parser";
import * as passport from "./src/services/passport";
import typeHandler from "./src/middleware/neo4j-type-handler";

declare global {
  interface Error {
    statusCode: number;
  }
  namespace Express {
    interface User {
      id: string;
      role: string;
    }
  }
}
const app: Application = express();
// Body parsing Middleware
app.use(cors());
app.use(typeHandler);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
passport.init();

initDriver(NEO4J_URI!, NEO4J_USERNAME!, NEO4J_PASSWORD!);
// Register API Route Handlers
app.use(bodyParser.json());

app.use(API_PREFIX, routes);
app.get("/test", async (req, res) => {
  res.send("worked");
 });
export default app;

// const connectDB = async () => {
//     await (await driver).verifyConnectivity();
// };
// connectDB();
// const session2 = driver.session();
// const session3 = driver.session();

// const findSiblingByname = async (name: string) => {
//   let id;
//   const fndD = await session1.run(
//     `
//         MATCH (p:FAMILYMEMPER{name: '${name}'}) RETURN p`, // (1)

//     { title: "Family" }, // (2)
//     { timeout: 3000 } // (3)
//   );
//   fndD.records.map((record: any) => {
//     id = record._fields[0].identity.low;
//   });
//   console.log(`sibling names for ${name}:`);

//   const res = await session1.run(
//     `
//           MATCH (s:FAMILYMEMPER WHERE ID(s) = ${id})-[:child]-> (n) MATCH (n:FAMILYMEMPER) -[:father]-> (c) RETURN c`, // (1)

//     { title: "Family" }, // (2)
//     { timeout: 3000 } // (3)
//   );
//   res.records.forEach((record: any) => {
//     if (record._fields[0].properties.name !== name) {
//       console.log(record._fields[0].properties.name);
//     }
//   });
// };

// const findMotherAndFather = async (name: string, type: "mother" | "father") => {
//   let id;
//   const fndD = await session2.run(
//     `
//           MATCH (p:FAMILYMEMPER{name: '${name}'}) RETURN p`, // (1)

//     { title: "Family" }, // (2)
//     { timeout: 3000 } // (3)
//   );
//   fndD.records.map((record: any) => {
//     id = record._fields[0].identity.low;
//   });
//   let sex = type === "father" ? "male" : "famale";
//   const res = await session2.run(
//     `
//             MATCH (s:FAMILYMEMPER WHERE ID(s) = ${id})-[:child]-> (b:FAMILYMEMPER{sex: '${sex}'}) RETURN b`, // (1)

//     { title: "Family" }, // (2)
//     { timeout: 3000 } // (3)
//   );
//   res.records.forEach((record: any) => {
//     console.log(`${type} of ${name}: ${record._fields[0].properties.name} `);
//   });
// };
// const addChild = async (
//   motherID: number,
//   fatherID: number,
//   input: { name: string; sex: "famale" | "male"; external: boolean }
// ) => {
//   let childID;
//   const create = await session3.run(
//     `CREATE
//         (${input.name}:FAMILYMEMPER{name:"${input.name}", sex: '${input.sex}', external: ${input.external}}) RETURN ${input.name}`
//   );
//   create.records.map((record: any) => {
//     childID = record._fields[0].identity.low;
//   });

//   const addRelation = await session3.run(
//     `
//     MATCH (m:FAMILYMEMPER WHERE ID(m) = ${motherID})
//     MATCH (f:FAMILYMEMPER WHERE ID(f) = ${fatherID})
//     MATCH (c:FAMILYMEMPER WHERE ID(c) = ${childID})
//         MERGE (m) - [:mother] - > (c)
//         MERGE (f) - [:father] - > (c)
//         MERGE (c) - [:child] - > (m)
//         MERGE (c) - [:child] - > (f)
//     `
//   );
//   addRelation.records.forEach((record: any) => {
//     console.log(record);
//   });
// };

// const addHusWIfe = async (
//   id: number,
//   input: { name: string; sex: "famale" | "male"; external: boolean }
// ) => {
//   let newID;
//   const create = await session3.run(
//     `CREATE
//           (${input.name}:FAMILYMEMPER{name:"${input.name}", sex: '${input.sex}', external: ${input.external}}) RETURN ${input.name}`
//   );
//   // console.log(create);

//   create.records.map((record: any) => {
//     newID = record._fields[0].identity.low;
//   });

//   // console.log(new);

//   const addRelation = await session3.run(
//     `
//       MATCH (w:FAMILYMEMPER WHERE ID(w) = ${id})
//       MATCH (h:FAMILYMEMPER WHERE ID(h) = ${newID})
//           MERGE (h) - [:husband] - > (w)
//           MERGE (w) - [:wife] - > (h)
//       `
//   );
//   addRelation.records.forEach((record: any) => {
//     console.log(record);
//   });
// };

// const deleteRelation = async (id: number, name: string) => {
//   await session3.run(
//     `
//             MATCH (p:FAMILYMEMPER WHERE ID(p) = ${id}) -[r:${name}]->() DELETE r
//         `
//   );
// };
// const deleteNode = async (id: number) => {
//   await session3.run(
//     `
//             MATCH (p:FAMILYMEMPER WHERE ID(p) = ${id}) DELETE p
//         `
//   );
// };
// findSiblingByname("Saleh");
// findMotherAndFather("amnah", 'father');
// findMotherAndFather("amnah", "mother");
// addHusWIfe(8, {name: "Moha", sex: "male", external: true });
// addChild(8, 18, {name: "yasin", sex: "male", external: true})
// deleteNode(14)
