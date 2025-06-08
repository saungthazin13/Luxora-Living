import express, { Request, Response, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import { errorCode } from "../../../errorCode";
import { checkUserIfNotExit } from "../../utils/auth";
import { getUserById, updateUser } from "../../services/authService";
import { checkModelIfExit, checkUploadFile } from "../../utils/check";
import { createError } from "../../utils/error";
import { unlink } from "node:fs/promises"; //for image
import path from "path";
import sharp from "sharp"; //for image optimization
import {
  createOnePost,
  deleteOnePost,
  getPostById,
  PostArgs,
  updateOnePost,
} from "../../services/postService";
import sanitizeHtml from "sanitize-html";

interface CustomRequest extends Request {
  userId?: number;
}

//create Post for CRUD
export const createPost = [
  body("title", "Title is required.").trim().notEmpty().escape(),
  body("content", "Content is required.").trim().notEmpty().escape(),
  body("body", "Body is required.")
    .trim()
    .notEmpty()
    .customSanitizer((value) => sanitizeHtml(value))
    .notEmpty(),
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
  body("postId", "PostId  is required.").trim().notEmpty().isInt({ min: 1 }),
  body("title", "Title is required.").trim().notEmpty().escape(),
  body("content", "Content is required.").trim().notEmpty().escape(),
  body("body", "Body is required.")
    .trim()
    .notEmpty()
    .customSanitizer((value) => sanitizeHtml(value))
    .notEmpty(),
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

    const { postId, title, content, body, category, type, tags } = req.body;
    const userId = req.userId;
    const user = await getUserById(userId!);
    if (!user) {
      return next(
        createError(
          "This user has not registered!",
          401,
          errorCode.unauthenticated
        )
      );
    }

    const post = await getPostById(+postId); //error for user add for postId string :so: +postId
    if (!post) {
      return next(
        createError(
          "This  post does not exit for database!",
          401,
          errorCode.invalid
        )
      );
    }

    //Admin A ==> postA ==>update,delete,
    //Admin B ==>postA ==>not update,delete
    const image = req.file;
    if (user.id !== post.authorId) {
      if (!image) {
        return next(
          createError("This action is not allowed", 403, errorCode.invalid)
        );
      }
    }

    const postData: any = {
      title,
      content,
      body,
      authorId: user!.id,
      category,
      type,
      tags,
    };

    // 4. Delete old user image (if exists)
    if (post?.image) {
      try {
        const oldImagePath = path.join(
          __dirname,
          "../../..",
          "uploads/images",
          post.image
        );
        await unlink(oldImagePath);
      } catch (error) {
        console.log("Failed to delete old image:", error);
      }
    }

    const postUpdated = await updateOnePost(post.id, postData);
    res
      .status(200)
      .json({ message: "Successfully updated the post ", postId: postUpdated });
  },
];

//delete Post for CRUD
export const deletePost = [
  body("postId", "PostId  is required.").trim().notEmpty().isInt({ min: 1 }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    } //for error validation

    const { postId } = req.body;

    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExit(user);

    const post = await getPostById(+postId);
    checkModelIfExit(post);

    if (user!.id !== post!.authorId) {
      return next(
        createError("This action is not allowed", 403, errorCode.invalid)
      );
    }
    const postDeleted = await deleteOnePost(post!.id);
    res.status(200).json({ message: "Successfully deleted Post" });
  },
];
