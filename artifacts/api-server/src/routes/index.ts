import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import marketRouter from "./market";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import webhookRouter from "./webhook";
import cronRouter from "./cron";
import clerkProxyRouter from "./clerkProxy";

const router: IRouter = Router();

router.use(clerkProxyRouter);
router.use(healthRouter);
router.use(contactRouter);
router.use(marketRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(webhookRouter);
router.use(cronRouter);

export default router;
