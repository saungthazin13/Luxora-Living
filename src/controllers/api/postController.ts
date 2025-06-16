import express, { Request, Response, NextFunction } from "express";
import { body, query, param, validationResult } from "express-validator";
import { errorCode } from "../../../errorCode";
import { checkUserIfNotExit } from "../../utils/auth";
import { getUserById, updateUser } from "../../services/authService";
import { checkUploadFile } from "../../utils/check";
import { createError } from "../../utils/error";
import {
  getPostById,
  getPostList,
  getPostWithRelation,
} from "../../services/postService";
import { title } from "node:process";
import { skip } from "node:test";

interface CustomRequest extends Request {
  userId?: number;
  file?: any;
}
//create Post for CRUD
export const getPost = [
  param("id", "Post Id is required!").isInt({ gt: 0 }), //gt for greater than zero
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    } //for error validation

    const postId = req.params.id;
    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExit(user);
    const post = await getPostWithRelation(+postId); //getpost

    //post modify
    // const modifyPost = {
    //   title: post?.title,
    //   content: post?.content,
    //   body: post?.body,
    //   image: post?.image,
    //   updatedAt: post?.updatedAt,
    //   fullName:
    //     (post?.author.firstName ?? "") + " " + (post?.author.lastName ?? ""),
    //   category: post?.category,
    //   type: post?.type,

    //   tags:
    //     post?.tags && post.tags.length > 0
    //       ? post.tags.map((i) => i.name)
    //       : null,
    // };
    res.status(200).json({ message: `This is a Post ${postId}`, post }); //for original post
    // res.status(200).json({ message: `This is a Post ${postId}`, modifyPost }); //for modify post
  },
];

//update Post for CRUD  in offset pagination
export const getPostsByPagination = [
  query("page", "Page number must be unsign integer.")
    .isInt({ gt: 0 })
    .optional(),
  query("limit", "Limit number must be unsigned integer")
    .isInt({ gt: 4 })
    .optional(),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    } //for error validation

    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExit(user);

    const skip = (+page - 1) * +limit; //for skip formula (+ for convert to integer)
    const options = {
      skip,
      take: +limit + 1,
      select: {
        title: true,
        content: true,
        body: true,
        image: true,
        updatedAt: true,
        author: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    };
    const post = await getPostList(options);

    const hasNextPage = post.length > +limit; // 4> 3.....
    let nextPage = null;
    if (hasNextPage) {
      post.pop(); //for respon for page
      nextPage = +page + 1;
    }
    res.status(200).json({
      message: "Get All Post",
      currentPage: page,
      hasNextPage,
      nextPage,
    });
  },
];

//Cursor pagination
export const getInfinitePostsByPagination = [
  query("Cursor", "Cursor must be Post 10").isInt({ gt: 0 }).optional(),
  query("Limit", "Limit number must be unsigned integer")
    .isInt({ gt: 4 })
    .optional(),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    } //for error validation

    const lastCursor = req.query.cursor; //unknow for id so condition
    const Limit = req.query.limit || 5;
    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExit(user);

    const options = {
      take: +Limit + 1,
      skip: lastCursor ? 1 : 0,
      cursor: lastCursor ? { id: +lastCursor } : undefined,
      select: {
        title: true,
        content: true,
        body: true,
        image: true,
        updatedAt: true,
        author: {
          select: {
            fullName: true,
          },
        },
      },

      //cursor base have for sorting
      orderBy: {
        id: "asc",
      },
    };
    const posts = await getPostList(options);
    const hasNextPage = posts.length > +Limit; //6 > 5
    if (hasNextPage) {
      posts.pop();
    }
    const newCursor = posts.length > 0 ? posts[posts.length - 1].id : null;
    res.status(200).json({
      message: "Get All infinate posts",
      hasNextPage,
      newCursor,
      posts,
    });
  },
];
