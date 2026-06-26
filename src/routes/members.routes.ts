import { Router } from "express";
import passport from "passport";
import { getDriver } from "../../neo4j";
import MembersService from "../services/members.service";

const router: Router = Router();

// All member routes require a valid JWT (matches the existing route conventions).
router.use(passport.authenticate("jwt", { session: false }));

/**
 * @GET /api/members/:id
 *
 * Full profile payload: the person's basics + derived age, parents, spouses
 * (each with marriage info and that spouse's children with this person), and
 * children whose mother is not in the DB.
 */
router.get("/:id", async (req, res, next) => {
  try {
    const membersService = new MembersService(getDriver());
    const profile = await membersService.getMemberProfile(req.params.id);

    if (!profile) {
      return res.status(404).send({ success: false, message: "Member not found" });
    }

    res.json(profile);
  } catch (e) {
    next(e);
  }
});

export default router;