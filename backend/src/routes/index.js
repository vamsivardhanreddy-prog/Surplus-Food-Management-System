import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import donationsRouter from "./donations.js";
import notificationsRouter from "./notifications.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/donations", donationsRouter);
router.use("/notifications", notificationsRouter);

export default router;