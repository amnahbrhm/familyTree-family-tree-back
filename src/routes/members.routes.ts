import { Router } from "express";
import passport from "passport";
import { getDriver } from "../../neo4j";
import MembersService from "../services/members.service";
import { assertCanWrite, isInScope } from "../middleware/auth-roles";

const router: Router = Router();

// All member routes require a valid JWT (matches the existing route conventions).
router.use(passport.authenticate("jwt", { session: false }));

const service = () => new MembersService(getDriver());

/**
 * @GET /api/members/:id
 *
 * Full profile payload: the person's basics + derived age, parents, spouses
 * (each with marriage info and that spouse's children with this person), and
 * children whose mother is not in the DB.
 */
router.get("/:id", async (req, res, next) => {
  try {
    const profile = await service().getMemberProfile(req.params.id);
    if (!profile) {
      return res.status(404).send({ success: false, message: "Member not found" });
    }
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

/**
 * @POST /api/members
 *
 * Create a new profile and optionally link it (fatherId / motherId / spouseId /
 * childId). admin: anywhere. moderator: the new person must attach to their
 * branch (at least one link target must be in scope). member: 403.
 */
router.post("/", async (req, res, next) => {
  try {
    const role = (req.user as any)?.role || "member";
    if (role !== "admin" && role !== "moderator") {
      return res.status(403).send({ success: false, message: "غير مصرح: يتطلب صلاحية مشرف" });
    }
    const { name, sex, external, birthDate, deathDate, photoUrl, phoneNumber,
            maritalStatus, fatherId, motherId, spouseId, childId } = req.body || {};
    if (!name || !sex) {
      return res.status(400).send({ success: false, message: "الاسم والجنس مطلوبان" });
    }
    const links = { fatherId, motherId, spouseId, childId };

    const svc = service();
    // Validate any referenced link targets exist.
    for (const id of [fatherId, motherId, spouseId, childId]) {
      if (id && !(await svc.exists(id))) {
        return res.status(404).send({ success: false, message: `المعرّف غير موجود: ${id}` });
      }
    }

    // Moderator: at least one provided link target must be inside their scope.
    if (role === "moderator") {
      const targets = [fatherId, motherId, spouseId, childId].filter(Boolean);
      const callerId = (req.user as any).id;
      const checks = await Promise.all(targets.map((t) => isInScope(callerId, t)));
      if (targets.length === 0 || !checks.some(Boolean)) {
        return res.status(403).send({
          success: false,
          message: "غير مصرح: يجب ربط العضو الجديد داخل نطاق إشرافك",
        });
      }
    }

    const created = await svc.createMember(
      { name, sex, external, birthDate, deathDate, photoUrl, phoneNumber, maritalStatus },
      links
    );
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

/**
 * @PATCH /api/members/:id  — edit scalar fields. admin or moderator-in-scope.
 */
router.patch("/:id", async (req, res, next) => {
  try {
    const svc = service();
    if (!(await svc.exists(req.params.id))) {
      return res.status(404).send({ success: false, message: "Member not found" });
    }
    if (!(await assertCanWrite(req, res, req.params.id))) return;
    const updated = await svc.updateMember(req.params.id, req.body || {});
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

/**
 * @PUT /api/members/:id/mother  — set/replace the mother of :id.
 * @PUT /api/members/:id/father  — set/replace the father of :id.
 * Body: { parentId }. Gated on the child (:id).
 */
function setParentRoute(kind: "mother" | "father") {
  return async (req: any, res: any, next: any) => {
    try {
      const childId = req.params.id;
      const parentId = req.body?.parentId;
      const svc = service();
      if (!parentId) {
        return res.status(400).send({ success: false, message: "parentId مطلوب" });
      }
      if (!(await svc.exists(childId)) || !(await svc.exists(parentId))) {
        return res.status(404).send({ success: false, message: "Member not found" });
      }
      if (!(await assertCanWrite(req, res, childId))) return;
      const result = await svc.setParent(childId, parentId, kind);
      res.json(result);
    } catch (e) {
      next(e);
    }
  };
}
router.put("/:id/mother", setParentRoute("mother"));
router.put("/:id/father", setParentRoute("father"));

/**
 * @POST /api/members/:id/spouse   — marry :id to { spouseId }.
 */
router.post("/:id/spouse", async (req, res, next) => {
  try {
    const aId = req.params.id;
    const bId = req.body?.spouseId;
    const svc = service();
    if (!bId) return res.status(400).send({ success: false, message: "spouseId مطلوب" });
    if (!(await svc.exists(aId)) || !(await svc.exists(bId))) {
      return res.status(404).send({ success: false, message: "Member not found" });
    }
    if (!(await assertCanWrite(req, res, aId))) return;
    const result = await svc.addSpouse(aId, bId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @POST /api/members/:id/children  — add { childId } as a child of :id.
 */
router.post("/:id/children", async (req, res, next) => {
  try {
    const parentId = req.params.id;
    const childId = req.body?.childId;
    const svc = service();
    if (!childId) return res.status(400).send({ success: false, message: "childId مطلوب" });
    if (!(await svc.exists(parentId)) || !(await svc.exists(childId))) {
      return res.status(404).send({ success: false, message: "Member not found" });
    }
    if (!(await assertCanWrite(req, res, parentId))) return;
    const result = await svc.addChild(parentId, childId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @DELETE /api/members/:id/mother  — unlink the mother of :id.
 * @DELETE /api/members/:id/father  — unlink the father of :id.
 */
function removeParentRoute(kind: "mother" | "father") {
  return async (req: any, res: any, next: any) => {
    try {
      const svc = service();
      if (!(await svc.exists(req.params.id))) {
        return res.status(404).send({ success: false, message: "Member not found" });
      }
      if (!(await assertCanWrite(req, res, req.params.id))) return;
      const result = await svc.removeParent(req.params.id, kind);
      res.json(result);
    } catch (e) {
      next(e);
    }
  };
}
router.delete("/:id/mother", removeParentRoute("mother"));
router.delete("/:id/father", removeParentRoute("father"));

/**
 * @DELETE /api/members/:id/spouse/:spouseId  — remove the marriage.
 */
router.delete("/:id/spouse/:spouseId", async (req, res, next) => {
  try {
    const svc = service();
    if (!(await svc.exists(req.params.id)) || !(await svc.exists(req.params.spouseId))) {
      return res.status(404).send({ success: false, message: "Member not found" });
    }
    if (!(await assertCanWrite(req, res, req.params.id))) return;
    const result = await svc.removeSpouse(req.params.id, req.params.spouseId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @DELETE /api/members/:id/children/:childId  — unlink a child from :id.
 */
router.delete("/:id/children/:childId", async (req, res, next) => {
  try {
    const svc = service();
    if (!(await svc.exists(req.params.id)) || !(await svc.exists(req.params.childId))) {
      return res.status(404).send({ success: false, message: "Member not found" });
    }
    if (!(await assertCanWrite(req, res, req.params.id))) return;
    const result = await svc.removeChild(req.params.id, req.params.childId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;