import express, { Request, Response, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import { errorCode } from "../../../errorCode";
import { checkUserIfNotExit } from "../../utils/auth";
import { getUserById, updateUser } from "../../services/authService";
import { checkUploadFile } from "../../utils/check";
import { createError } from "../../utils/error";

interface CustomRequest extends Request {
  userId?: number;
  file?: any;
}
//create Post for CRUD
export const getPost = [
  body("phone", "Invalid phone Number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    } //for error validation

    const { phone, password, token } = req.body;
    res.status(200).json({ message: "OK" });
  },
];

//update Post for CRUD
export const getPostsByPagination = [
  body("phone", "Invalid phone Number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 }),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    } //for error validation

    const { phone, password, token } = req.body;
    res.status(200).json({ message: "OK" });
  },
];
