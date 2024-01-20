import { Router } from "express";
// import passport from "passport";
import { getDriver } from "../../neo4j";
import UsersService from "../services/users.service";
import { getPagination, getUserId, MOVIE_SORT, PEOPLE_SORT } from "../../utils";
import passport from "passport";

const router: Router = Router();

router.use(passport.authenticate("jwt", { session: false }));

/**
 * @GET /people/
 *
 * This route should return a paginated list of People from the database
 */
router.get("/", async (req, res, next) => {
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

router.post("/", async (req, res, next) => {
  try {
    const driver = getDriver();

    const usersService = new UsersService(driver);
    const user = await usersService.createUser({...req.body, createdBy: req.user!.id, updatedBy: null});
    console.log(user);
    
    res.json(user);
  } catch (e) {
    next(e);
  }
});

export default router;
