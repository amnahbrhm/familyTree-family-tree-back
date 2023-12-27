// const fs = require("fs");
import fs from "fs";

const readFile = (file: any) => {
  const buffer = fs.readFileSync(`${__dirname}/${file}.cypher`);
  return buffer.toString();
};



export default readFile