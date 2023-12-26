import {
  isInt,
  isDate,
  isDateTime,
  isTime,
  isLocalDateTime,
  isLocalTime,
  isDuration,
} from "neo4j-driver";

// Valid Order directions
const ORDER_ASC = "ASC";
const ORDER_DESC = "DESC";
const ORDERS = [ORDER_ASC, ORDER_DESC];

export const MOVIE_SORT = ["title", "released", "imdbRating"];
export const PEOPLE_SORT = ["name", "sex"];
export const RATING_SORT = ["rating", "timestamp"];

/**
 * Extract commonly used pagination variables from the request query string
 *
 * @param {express.Request} req
 * @param {string[]} validSort
 * @returns {Record<string, any>}
 */
export function getPagination(req: any, validSort: any[]) {
  let { q, pageSize, pageNumber, sort, order } = req.query;

  // Only accept valid orderby fields
  if (sort !== undefined && !validSort.includes(sort)) {
    sort = undefined;
  }

  // // Only accept ASC/DESC values
  // if (order === undefined || !ORDERS.includes(order.toUpperCase())) {
  //   order = ORDER_ASC;
  // }

  const skip = (parseInt(pageNumber || 0) - 1) * parseInt(pageSize || 6);
  return {
    q,
    sort,
    order,
    limit: parseInt(pageSize || 6),
    skip,
  };
}

/**
 * Attempt to extract the current User's ID from the request
 * (as defined by the JwtStrategy in src/passport/jwt.strategy.js)
 *
 * @param {express.Request} req
 * @returns {string | undefined}
 */
export function getUserId(req: any) {
  return req.user ? req.user.userId : undefined;
}

// tag::toNativeTypes[]
/**
 * Convert Neo4j Properties back into JavaScript types
 *
 * @param {Record<string, any>} properties
 * @return {Record<string, any>}
 */
export function toNativeTypes(properties: any) {
  return Object.fromEntries(
    Object.keys(properties).map((key) => {
      let value = valueToNativeType(properties[key]);

      return [key, value];
    })
  );
}

/**
 * Convert an individual value to its JavaScript equivalent
 *
 * @param {any} value
 * @returns {any}
 */
function valueToNativeType(value: any) {
  if (Array.isArray(value)) {
    value = value.map((innerValue) => valueToNativeType(innerValue));
  } else if (isInt(value)) {
    value = value.toNumber();
  } else if (
    isDate(value) ||
    isDateTime(value) ||
    isTime(value) ||
    isLocalDateTime(value) ||
    isLocalTime(value) ||
    isDuration(value)
  ) {
    value = value.toString();
  } else if (
    typeof value === "object" &&
    value !== undefined &&
    value !== null
  ) {
    value = toNativeTypes(value);
  }

  return value;
}
// end::toNativeTypes[]
