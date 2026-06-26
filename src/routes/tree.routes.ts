import { Router } from "express";
import passport from "passport";
import { getDriver } from "../../neo4j";
import MembersService from "../services/members.service";

const router: Router = Router();

// JWT-protected, matching the existing route conventions.
router.use(passport.authenticate("jwt", { session: false }));

/**
 * @GET /api/tree
 *
 * The whole graph for the home view:
 *   nodes: [{ id, name, sex, photoUrl, deceased }]
 *   edges: [{ from, to, type }]  // type: 'parent' | 'marriage'
 */
router.get("/", async (req, res, next) => {
  try {
    const membersService = new MembersService(getDriver());
    const tree = await membersService.getTree();
    res.json(tree);
  } catch (e) {
    next(e);
  }
});

export default router;