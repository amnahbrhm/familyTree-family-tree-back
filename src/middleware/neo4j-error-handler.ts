import { Neo4jError } from "neo4j-driver";

const fun = (err: any, req: any, res: any, next: any) => {
  if (res.headersSent) {
    return next(err);
  }

  //   if (err instanceof Neo4jError) {
  //     if (err.message.includes("already exists with")) {
  //       const [_, property] = err.message.match(/`([a-z0-9]+)`/gi);
  //       let message = [`${property.replace(/`/g, "")} already taken`];

  //       return res.status(200).json({
  //         code: 400,
  //         error: "Bad Request",
  //         message,
  //         success: false,
  //       });
  //     }
  //     // Neo.ClientError.Schema.ConstraintValidationFailed
  //     // Node(54778) with label `Test` must have the property `mustExist`
  //     else if (err.message.includes("must have the property")) {
  //       const [_, property] = err.message.match(/`([a-z0-9]+)`/gi);
  //       let message = [`${property.replace(/`/g, "")} should not be empty`];

  //       return res.status(400).json({
  //         statusCode: 400,
  //         error: "Bad Request",
  //         message,
  //         success: false,
  //   });
  //     }
  //   }

  //   next(err);
};


export default fun