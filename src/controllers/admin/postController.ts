import express, { Request, Response, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import { errorCode } from "../../../errorCode";
import { checkUserIfNotExit } from "../../utils/auth";
import { getUserById, updateUser } from "../../services/authService";
import { checkUploadFile } from "../../utils/check";
import { createError } from "../../utils/error";
import { unlink } from "node:fs/promises"; //for image
import path from "path";
import sharp from "sharp"; //for image optimization
import { createOnePost, PostArgs } from "../../services/postService";

interface CustomRequest extends Request {
  userId?: number;
}
//create Post for CRUD
export const createPost = [
  body("title", "Title is required.").trim().notEmpty().escape(),
  body("content", "Content is required.").trim().notEmpty().escape(),
  body("body", "Body is required.").trim().notEmpty().escape(),
  body("category", "Category is required.").trim().notEmpty().escape(),
  body("type", "Type is required.").trim().notEmpty().escape(),
  body("tags", "Tags must be a comma-separated list.")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        return value
          .split(",")
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag !== "");
      }
      return value;
    }),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { title, content, body, category, type, tags } = req.body;
    const userId = req.userId;
    const image = req.file;
    const user = await getUserById(userId!);

    // 1. Validate user & file
    checkUserIfNotExit(user);
    if (!image) {
      return next(createError("Image is required", 400, errorCode.invalid));
    }

    // 2. Generate new filename (WEBP format)
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const optimizedImagePath = path.join(
      __dirname,
      "../../..",
      "uploads/images",
      fileName
    );

    // 3. Process image with Sharp (with proper error handling)
    try {
      await sharp(image.buffer)
        .resize(835, 577, { fit: "cover" }) // Ensures exact dimensions
        .webp({ quality: 80 }) // Lower quality for better performance
        .toFile(optimizedImagePath);
    } catch (error) {
      console.error("Sharp Error:", error);
      return next(
        createError("Failed to process image", 500, errorCode.invalid)
      );
    }

    // 4. Delete old user image (if exists)
    if (user?.image) {
      try {
        const oldImagePath = path.join(
          __dirname,
          "../../..",
          "uploads/images",
          user.image
        );
        await unlink(oldImagePath);
      } catch (error) {
        console.log("Failed to delete old image:", error);
      }
    }

    // 5. Update user with new image
    await updateUser(user?.id!, { image: fileName });

    // 6. Create post
    const postData: PostArgs = {
      title,
      content,
      body,
      image: fileName, // Use the new filename (not req.file.filename)
      authorId: user!.id,
      category,
      type,
      tags,
    };

    const post = await createOnePost(postData);

    res.status(200).json({
      message: "Post created successfully",
      post: post.id,
    });
  },
];

//update Post for CRUD
export const updatePost = [
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

//delete Post for CRUD
export const deletePost = [
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
