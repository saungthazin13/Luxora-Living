import { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback } from "multer";

const storageF = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/images"); //for location

    //other file
    // const type = file.mimetype.split("/")[0];
    // if (type === "image") {
    //   cb(null, "uploads/images");
    // } else {
    //   cb(null, "uploads/files");
    // }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storageF,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 2 }, // Testing for Maximum file size is 2MB.
});

// for image optimization library
export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 }, //Maximum file size is 10MB,so image opization
});

export default upload;
