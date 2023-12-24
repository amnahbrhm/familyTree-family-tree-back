import { Router } from "express";
// import passport from "passport";
import { getDriver } from "../neo4j.ts";
import UsersService from "../services/users.service.ts";
import { getPagination, getUserId, MOVIE_SORT, PEOPLE_SORT } from "../utils.ts";

const router: Router = Router();

// router.use(passport.authenticate(["jwt", "anonymous"], { session: false }));

/**
 * @GET /people/
 *
 * This route should return a paginated list of People from the database
 */
router.get("/", async (req, res, next) => {
    console.log('here')
  try {
    const { q, sort, order, limit, skip } = getPagination(req, PEOPLE_SORT);
    const driver = getDriver();

    const usersService = new UsersService(driver);
    const users = await usersService.getAll(q, sort, order, limit, skip);

    res.json(users);
  } catch (e) {
    next(e);
  }
});

export default router;
