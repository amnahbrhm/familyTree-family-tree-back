// Role + scope enforcement for write endpoints.
//
// Roles live on the FAMILYMEMPER `role` property and are loaded into req.user
// by the Passport JWT strategy. NEVER trust the client — every write endpoint
// re-checks the caller's role here, and for moderators, that the target member
// is within their MODERATES branch.
import { Request, Response, NextFunction } from "express";
import { getDriver } from "../../neo4j";
import cypher from "../cypher/index";

type Role = "member" | "moderator" | "admin";

function callerRole(req: Request): Role {
  return ((req.user as any)?.role as Role) || "member";
}

// moderator-or-admin gate (role only; scope is checked per-target below).
export function requireModerator(req: Request, res: Response, next: NextFunction) {
  const role = callerRole(req);
  if (role === "admin" || role === "moderator") return next();
  return res.status(403).send({ success: false, message: "غير مصرح: يتطلب صلاحية مشرف" });
}

// admin-only gate.
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (callerRole(req) === "admin") return next();
  return res.status(403).send({ success: false, message: "غير مصرح: يتطلب صلاحية مسؤول" });
}

// Is the caller allowed to write to `targetId`?
// admin -> always; moderator -> only if target is in their MODERATES scope;
// member -> never.
export async function isInScope(callerId: string, targetId: string): Promise<boolean> {
  const session = getDriver().session();
  try {
    const res = await session.executeRead((tx) =>
      tx.run(cypher("is-in-scope"), { callerId, targetId })
    );
    return res.records.length > 0 && res.records[0].get("inScope") === true;
  } finally {
    await session.close();
  }
}

// Throwing guard for route handlers. Returns true if allowed; otherwise sends
// 403 and returns false (handler should stop).
export async function assertCanWrite(
  req: Request,
  res: Response,
  targetId: string
): Promise<boolean> {
  const role = callerRole(req);
  if (role === "admin") return true;
  if (role === "moderator") {
    const ok = await isInScope((req.user as any).id, targetId);
    if (ok) return true;
    res.status(403).send({ success: false, message: "غير مصرح: العضو خارج نطاق إشرافك" });
    return false;
  }
  res.status(403).send({ success: false, message: "غير مصرح: يتطلب صلاحية مشرف" });
  return false;
}