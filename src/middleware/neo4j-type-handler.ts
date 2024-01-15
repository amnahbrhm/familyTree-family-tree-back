import {
  isDuration,
  isLocalTime,
  isTime,
  isDate,
  isDateTime,
  isLocalDateTime,
  isInt,
  isPoint,
  types,
  isNode,
  isRelationship,
} from "neo4j-driver";

const { Result } = types;

const toNative = (
  value: any,
  showLabelsOrType = false,
  showIdentity = false
): any => {
  if (value === null) return null;
  else if (value === undefined) return null;
  else if (value instanceof Result || value.records) {
    return value.records.map((row: any) =>
      Object.fromEntries(
        row.keys.map((key: any) => [key, toNative(row.get(key))])
      )
    );
  } else if (Array.isArray(value))
    return value.map((value: any) => toNative(value));
  else if (isNode(value))
    return toNative({
      _id: showIdentity ? toNative(value.identity) : undefined,
      _labels: showLabelsOrType ? toNative(value.labels) : undefined,
      ...toNative(value.properties),
    });
  else if (isRelationship(value))
    return toNative({
      _id: showIdentity ? toNative(value.identity) : undefined,
      _type: showLabelsOrType ? toNative(value.type) : undefined,
      ...toNative(value.properties),
    });
  // Number
  else if (isInt(value)) return value.toNumber();
  // Temporal
  else if (
    isDuration(value) ||
    isLocalTime(value) ||
    isTime(value) ||
    isDate(value) ||
    isDateTime(value) ||
    isLocalDateTime(value)
  ) {
    return value.toString();
  }

  // Spatial
  if (isPoint(value)) {
    switch (value.srid.toNumber()) {
      case 4326:
        return { longitude: value.y, latitude: value.x };

      case 4979:
        return { longitude: value.y, latitude: value.x, height: value.z };

      default:
        return toNative({ x: value.x, y: value.y, z: value.z });
    }
  }

  // Object
  else if (typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).map((key) => [
        key,
        toNative(value[key], showLabelsOrType, showIdentity),
      ])
    );
  }

  return value;
};

const fun = (req: any, res: any, next: any) => {
  const json = res.json;

  res.json = function (value: any) {
    json.call(this, toNative(value));
  };

  next();
};

export default fun;
