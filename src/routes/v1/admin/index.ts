import express from "express";
import { getAllUser } from "../../../controllers/admin/userController";
import { authorise } from "../../../middlewares/authorise";
import { setMaintenance } from "../../../controllers/admin/systemController";
const router = express.Router();

// router.get("/user", getAllUser);
router.get("/user", authorise(true, "ADMIN"), getAllUser);
router.post("/maintenance", setMaintenance);

export default router;
