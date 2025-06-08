import { title } from "process";
import { PrismaClient } from "../generated/prisma";
import { body } from "express-validator";
import { connect } from "http2";

const prisma = new PrismaClient();
export type PostArgs = {
  title: string;
  content: string;
  body: string;
  image: string;
  authorId: number;
  category: string;
  type: string;
  tags: string[];
};
export const createOnePost = async (postData: PostArgs) => {
  const data: any = {
    title: postData.title,
    content: postData.content,
    body: postData.body,
    image: postData.image,
    author: {
      connect: {
        id: postData.authorId,
      },
    },
    category: {
      connectOrCreate: {
        where: { name: postData.category },
        create: {
          name: postData.category,
        },
      },
    },
    type: {
      connectOrCreate: {
        where: { name: postData.type },
        create: {
          name: postData.type,
        },
      },
    },
  };

  if (postData.tags && postData.tags.length > 0) {
    data.tags = {
      connectOrCreate: postData.tags.map((tagName) => ({
        where: { name: tagName },
        create: {
          name: tagName,
        },
      })),
    };
  }

  return prisma.post.create({ data });
}; //for existing account

//for update post for postId
export const getPostById = async (id: number) => {
  return prisma.post.findUnique({
    where: { id },
  });
};

//for update one post
export const updateOnePost = async (postId: number, postData: PostArgs) => {
  const data: any = {
    title: postData.title,
    content: postData.content,
    body: postData.body,

    category: {
      connectOrCreate: {
        where: { name: postData.category },
        create: {
          name: postData.category,
        },
      },
    },
    type: {
      connectOrCreate: {
        where: { name: postData.type },
        create: {
          name: postData.type,
        },
      },
    },
  };

  //for image
  if (postData.image) {
    data.image = postData.image;
  }

  //for tag
  if (postData.tags && postData.tags.length > 0) {
    data.tags = {
      connectOrCreate: postData.tags.map((tagName) => ({
        where: { name: tagName },
        create: {
          name: tagName,
        },
      })),
    };
  }

  return prisma.post.update({
    where: { id: postId },
    data,
  });
};

// for delete post
export const deleteOnePost = async (id: number) => {
  return prisma.post.delete({
    where: { id },
  });
};
