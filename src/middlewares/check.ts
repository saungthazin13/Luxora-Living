import { Request, Response, NextFunction } from "express";

interface CustomRequst extends Request {
  userId?: number;
}

export const check = (req: CustomRequst, res: Response, next: NextFunction) => {
  req.userId = 12345;
  next();
};
