import express, { Request, Response, NextFunction } from "express";
import { query, validationResult } from "express-validator";
import { errorCode } from "../../../errorCode";
import { checkUserIfNotExit } from "../../utils/auth";
import { getUserById } from "../../services/authService";
import { checkUploadFile } from "../../utils/check";
interface CustomRequest extends Request {
  userId?: number;
  file?: any;
}

export const changeLanguage = [
  query("lng", "Invalid Language code.")
    .trim()
    .notEmpty()
    .matches("^[a-z]+$") //fpr language to api
    .isLength({ min: 2, max: 3 }), //example for en (or ) mm

  (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(req.t("wrong"));
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    } //for error validation

    const { lng } = req.query;
    res.cookie("i18next", lng);
    res.status(200).json({ message: req.t("changeLan", { lang: lng }) });
  },
];

export const uploadProfile = [
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const image = req.file;
    const user = await getUserById(userId!);
    checkUserIfNotExit(user);
    checkUploadFile(image);

    res.status(200).json({ message: "Profle picture uploaded successfully!" });
  },
];
