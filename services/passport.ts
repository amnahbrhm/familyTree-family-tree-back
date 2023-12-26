import { JwtPayload } from './../models/users';
import passport from "passport";
import util from "util";
import { Strategy, ExtractJwt } from "passport-jwt";

import { JWT_SECRET } from ".././constants.ts";
import UsersService from "./users.service.ts";
import { getDriver } from '../neo4j.ts';

export function init() {
  const secret = JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is undefined");
  }
  const jwtOpts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
    //issuer: 'my.site.com',
    //audience: 'my.site.com'
  };

  const strategy = new Strategy(
    jwtOpts,
    async (payload: JwtPayload, done: any) => {
        const driver = getDriver();
        const usersService = new UsersService(driver);
        const user = await usersService.findById(payload.id);
        if (!user) return done(new Error("User not found"));
        return done(null, user);
    }
  );
  passport.use(strategy);
}
