import express, { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { errorCode } from "../../../errorCode";
import { checkUserIfNotExit } from "../../utils/auth";
import { getUserById } from "../../services/authService";
import { createError } from "../../utils/error";
import path from "path";
import sharp from "sharp";
import { createOneProduct } from "../../services/productService";

interface CustomRequest extends Request {
  userId?: number;
}

// Create Product Handler
export const createProduct = [
  // Validation
  body("name", "Name is required.").trim().notEmpty().escape(),
  body("description", "Description is required.").trim().notEmpty().escape(),

  body("price", "Price must be a valid number greater than 0.1").isFloat({
    min: 0.1,
  }),
  body("discount", "Discount must be a valid number").isFloat({ min: 0 }),
  body("inventory", "Inventory must be a positive integer").isInt({ min: 1 }),
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

  // Controller
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req).array({ onlyFirstError: true });
      // console.log("Request Body:", req.body); //for console error
      if (errors.length > 0) {
        return next(createError(errors[0].msg, 400, errorCode.invalid));
      }

      const {
        name,
        description,
        price,
        discount,
        inventory,
        category,
        type,
        tags,
      } = req.body;

      const userId = req.userId;
      const images = req.files as Express.Multer.File[];

      if (!userId) {
        return next(
          createError("User not authenticated", 401, errorCode.unauthenticated)
        );
      }

      const user = await getUserById(userId);
      checkUserIfNotExit(user);

      if (!images || images.length === 0) {
        return next(
          createError("At least one image is required", 400, errorCode.invalid)
        );
      }

      const imageFilenames: string[] = [];

      for (const image of images) {
        const fileName = `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}.webp`;
        const optimizedImagePath = path.resolve("uploads/images", fileName);

        await sharp(image.buffer)
          .resize(835, 577, { fit: "cover" })
          .webp({ quality: 80 })
          .toFile(optimizedImagePath);

        imageFilenames.push(fileName);
      }

      // Create product entry
      const productData = {
        name,
        description,
        price: parseFloat(price),
        discount: parseFloat(discount),
        inventory: parseInt(inventory),
        category,
        type,
        tags,
        // imageFilenames: images,
        images: imageFilenames.map((fileName) => ({
          path: fileName,
        })),
      };

      const product = await createOneProduct(productData);

      res.status(201).json({
        message: "Product created successfully",
        product: product.id,
      });
    } catch (err) {
      console.error("Product creation error:", err);
      return next(
        createError("Failed to create product", 500, errorCode.invalid)
      );
    }
  },
];
