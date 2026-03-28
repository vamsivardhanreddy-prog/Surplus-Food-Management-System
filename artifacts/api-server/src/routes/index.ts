import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import donationsRouter from "./donations";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/donations", donationsRouter);
router.use("/notifications", notificationsRouter);

export default router;
