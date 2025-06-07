import express from "express";
import {
  changeLanguage,
  uploadProfile,
  uploadProfileMultiple,
  uploadProfileOptimize,
} from "../../../controllers/api/profileController";
import { auth } from "../../../middlewares/auth";
import upload, { uploadMemory } from "../../../middlewares/uploadFile";
import {
  getPost,
  getPostsByPagination,
} from "../../../controllers/api/postController";
const router = express.Router();

router.post("/change-language", changeLanguage);
//for profile
router.patch("/profile/upload", auth, upload.single("avatar"), uploadProfile);
router.patch(
  "/profile/upload/optimize",
  auth,
  uploadMemory.single("avatar"),
  uploadProfileOptimize
);
router.patch(
  "/profile/upload/multiple",
  auth,
  upload.array("avatar"),
  uploadProfileMultiple
);
//CRUD for post for user
router.get("/posts", auth, getPostsByPagination);
router.get("/posts/:id", auth, getPost);
//

export default router;
