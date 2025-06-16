import { title } from "process";
import { PrismaClient } from "../generated/prisma";
import { body } from "express-validator";
import { connect } from "http2";
// const prisma = new PrismaClient();
const prisma = new PrismaClient().$extends({
  result: {
    user: {
      fullName: {
        needs: {
          firstName: true,
          lastName: true,
        },
        compute(user) {
          return `${user.firstName} ${user.lastName}`;
        },
      },
    },
    post: {
      image: {
        needs: {
          image: true,
        },
        compute(post) {
          return post.image || null;
        },
      },
      updatedAt: {
        needs: {
          updatedAt: true,
        },
        compute(post) {
          return post.updatedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        },
      },
    },
  },
});

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

//for prisma-relation for post
export const getPostWithRelation = async (id: number) => {
  return prisma.post.findUnique({
    where: { id },
    // omit: { createdAt: true }, // not include remove
    select: {
      title: true,
      content: true,
      body: true,
      image: true,
      updatedAt: true,

      author: {
        select: {
          firstName: true,
          lastName: true,
          // fullName: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
      type: {
        select: {
          name: true,
        },
      },
      tags: {
        select: {
          name: true,
        },
      },
    }, //see for post
  });
};

//for offset pagination
export const getPostList = async (options: any) => {
  return prisma.post.findMany(options);
};
