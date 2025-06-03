import express, { Request, Response, NextFunction } from "express";
import { query, validationResult } from "express-validator";
import { errorCode } from "../../../errorCode";
import { checkUserIfNotExit } from "../../utils/auth";
import { getUserById, updateUser } from "../../services/authService";
import { checkUploadFile } from "../../utils/check";
import { unlink } from "node:fs/promises"; //for image
import path from "path";
import { createError } from "../../utils/error";
import fs from "fs";

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

// export const uploadProfile = [
//   async (req: CustomRequest, res: Response, next: NextFunction) => {
//     const userId = req.userId;
//     const image = req.file;

//     const user = await getUserById(userId!);
//     checkUserIfNotExit(user);
//     checkUploadFile(image);

//     const fileName = image.filename;
//     //filepath
//     // const filePath = image.path;
//     // const filePath = image.path.replace("\\", "/");

//     //delete for db (or) last photo show
//     if (user?.image) {
//       const filePath = path.join(
//         __dirname,
//         "../../..",
//         "/uploads/images",
//         user.image
//       );
//       try {
//         await unlink(filePath);
//       } catch (error) {
//         console.warn("Old image deletion failed:", error);
//       }
//     }
//     const userData = {
//       image: fileName,
//     };
//     await updateUser(user?.id!, userData);
//     res.status(200).json({
//       message: "Profle picture uploaded successfully!",
//       image: fileName,
//     });
//   },
// ];
//for single file upload
export const uploadProfile = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId;
  const image = req.file;
  const user = await getUserById(userId!);
  checkUserIfNotExit(user);
  checkUploadFile(image);

  //  console.log("Image -----", image);
  const fileName = image!.filename;
  // const filePath = image!.path;
  // const filePath = image!.path.replace("\\", "/");

  if (user?.image) {
    try {
      const filePath = path.join(
        __dirname,
        "../../..",
        "/uploads/images",
        user!.image!
      );
      await unlink(filePath);
    } catch (error) {
      console.log(error);
    }
  }

  const userData = {
    image: fileName,
  };
  await updateUser(user?.id!, userData);

  res.status(200).json({
    message: "Profile picture uploaded successfully.",
    image: fileName,
  });
};
//for Mulitiple File upload
export const uploadProfileMultiple = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  res.status(200).json({
    message: " Multiple Profile picture uploaded successfully.",
  });
};
