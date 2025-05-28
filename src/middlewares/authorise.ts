import { Request, Response, NextFunction } from "express";
import { getUserById } from "../services/authService";
import { errorCode } from "../../errorCode";
import { createError } from "../utils/error";
interface CustomRequst extends Request {
  userId?: number;
  user?: any;
}
// authorise(true,"ADMIN" ,"AUTHOR") // deny - "USER"
//authorise(false,"USER") // allow - "ADMIN","AUTHOR"

export const authorise = (permission: boolean, ...roles: string[]) => {
  return async (
    //for declare async  user for await
    req: CustomRequst,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.userId;
    const user = await getUserById(userId!);
    if (!user) {
      const error: any = new Error(req.t("wrong"));
      error.status = 401;
      error.code = errorCode.unauthenticated;
      return next();
    }
    const result = roles.includes(user.role);
    if (permission && !result) {
      const error: any = new Error(req.t("permission"));
      error.status = 403;
      error.code = errorCode.unauthorise;
      return next(error);
    }

    if (!permission && result) {
      const error: any = new Error(req.t("permission"));
      error.status = 403;
      error.code = errorCode.unauthorise;
      return next(error);
    }
    req.user = user;
    next(); //for this code include full complete for middleware
  };
};
