import express from "express";
import { check } from "../../middlewares/check";
import { healthcheck } from "../../controllers/healthcontroller";
const router = express.Router();

export default router.get("/health", check, healthcheck);
