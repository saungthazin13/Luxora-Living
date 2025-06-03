import express from "express";
import {
  changeLanguage,
  uploadProfile,
  uploadProfileMultiple,
} from "../../../controllers/api/profileController";
import { auth } from "../../../middlewares/auth";
import upload from "../../../middlewares/uploadFile";
const router = express.Router();

router.post("/change-language", changeLanguage);
router.patch("/profile/upload", auth, upload.single("avatar"), uploadProfile);
router.patch(
  "/profile/upload/multiple",
  auth,
  upload.array("avatar"),
  uploadProfileMultiple
);

export default router;
