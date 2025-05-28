import express, { Request, Response, NextFunction } from "express";

interface CustomRequest extends Request {
  userId?: number;
}

export const healthcheck = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  res.status(200).json({
    message: "Hello, we are ready for response..",
    userId: req.userId,
  });
};
