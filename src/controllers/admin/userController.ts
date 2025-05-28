import express, { Request, Response, NextFunction } from "express";

interface CustomRequest extends Request {
  user?: any;
}
export const getAllUser = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  res.status(200).json({
    message: req.t("welcome"),
    currentuserRole: user.role,
  });
};
