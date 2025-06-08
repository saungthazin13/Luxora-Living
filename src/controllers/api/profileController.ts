import express, { Request, Response, NextFunction } from "express";
import { query, validationResult } from "express-validator";
import { errorCode } from "../../../errorCode";
import { checkUserIfNotExit } from "../../utils/auth";
import { getUserById, updateUser } from "../../services/authService";
import { checkUploadFile } from "../../utils/check";
import { unlink } from "node:fs/promises"; //for image
import path from "path";
import { createError } from "../../utils/error";
import sharp from "sharp"; //for image optimization

interface CustomRequest extends Request {
  userId?: number;
  file?: any;
}
// for change language for eng to myanmar 0r other language
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

  // console.log("Image -----", image);
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
  console.log("req.files -------", req.files);

  res.status(200).json({
    message: "Multiple Profile pictures uploaded successfully.",
  });
};

//for optimization in image
export const uploadProfileOptimize = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId;
  const image = req.file;
  const user = await getUserById(userId!);
  checkUserIfNotExit(user);
  checkUploadFile(image);

  const fileName =
    Date.now() + "-" + ` ${Math.round(Math.random() * 1e9)}.webp`;

  try {
    const optimizedImagePath = path.join(
      __dirname,
      "../../..",
      "/uploads/images",
      fileName
    );
    await sharp(req.file?.buffer)
      .resize(200, 200)
      .webp({ quality: 50 })
      .toFile(optimizedImagePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error optimize message" });
    return; //call for res have return
  }

  //Optimized image have save for uploads file
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
    message: "Ok",
  });
};
