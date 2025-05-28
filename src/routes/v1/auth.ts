import express from "express";
import {
  register,
  verifyOtp,
  confirmPassword,
  login,
  logout,
  forgetPassword,
  verifyOtpForPassword,
  restPassword,
} from "../../controllers/authController";

const router = express.Router();

router.post("/register", register);
router.post("/verifyOtp", verifyOtp);
router.post("/confirmPassword", confirmPassword);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgetPassword", forgetPassword);
router.post("/verify", verifyOtpForPassword);
router.post("/restpassword", restPassword);

export default router;
