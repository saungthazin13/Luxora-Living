import express from "express";
import { auth } from "../../middlewares/auth";
import { authorise } from "../../middlewares/authorise";
import { maintenance } from "../../middlewares/maintenance";
import authRouter from "./auth";
import adminRouth from "./admin";
import userRouth from "./api/";

const router = express.Router();

router.use(authRouter);
router.use("/user", userRouth);
router.use("/admin", auth, authorise(true, "ADMIN"), adminRouth);

// router.use(maintenance, authRouter);
// router.use("/user", maintenance, userRouth);
// router.use("/admin", maintenance, auth, authorise(true, "ADMIN"), adminRouth);

export default router;
