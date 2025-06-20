import express from "express";
import { getAllUser } from "../../../controllers/admin/userController";
import { authorise } from "../../../middlewares/authorise";
import { setMaintenance } from "../../../controllers/admin/systemController";
import upload from "../../../middlewares/uploadFile";
import {
  createPost,
  updatePost,
  deletePost,
} from "../../../controllers/admin/postController";
import {
  createProduct,
  // updateProduct,
  // deleteProduct,
} from "../../../controllers/admin/productController";
import { auth } from "../../../middlewares/auth";
import { uploadMemory } from "../../../middlewares/uploadFile";

const router = express.Router();

// router.get("/user", getAllUser);
router.get("/user", authorise(true, "ADMIN"), getAllUser);
router.post("/maintenance", setMaintenance);

//CRUD for post for admin
router.post("/posts", uploadMemory.single("image"), createPost);
router.patch("/posts", upload.single("image"), updatePost);
router.delete("/posts", deletePost);

//CRUD for product for admin
router.post("/products", uploadMemory.array("images", 4), createProduct);
// router.patch("/products", upload.array("images",4), updateProduct);
// router.delete("/products", deleteProduct);

export default router;
