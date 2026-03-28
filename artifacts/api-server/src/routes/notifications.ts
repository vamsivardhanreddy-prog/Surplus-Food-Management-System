import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.use(authenticate);

router.get("/", async (req: AuthRequest, res) => {
  const user = req.user!;

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, user.id));

  res.json(notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
});

router.patch("/read-all", async (req: AuthRequest, res) => {
  const user = req.user!;

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.isRead, false)));

  res.json({ success: true, message: "All notifications marked as read" });
});

router.patch("/:id/read", async (req: AuthRequest, res) => {
  const user = req.user!;
  const id = parseInt(req.params.id);

  const [notification] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, user.id)))
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(notification);
});

export default router;
