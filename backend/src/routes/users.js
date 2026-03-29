import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, donationsTable } from "@workspace/db/schema";
import { eq, count, and } from "drizzle-orm";
import { authenticate, requireRole } from "../lib/auth.js";
import { sendNotificationToUser } from "../lib/notifications.js";

const router = Router();

router.use(authenticate);

router.get("/stats", requireRole("admin"), async (_req, res) => {
  const [totalUsers] = await db.select({ count: count() }).from(usersTable);
  const [totalDonators] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "donator"));
  const [totalNgos] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "ngo"));
  const [pendingVerifications] = await db.select({ count: count() }).from(usersTable).where(and(eq(usersTable.role, "ngo"), eq(usersTable.status, "pending_verification")));
  const [totalDonations] = await db.select({ count: count() }).from(donationsTable);
  const [availableDonations] = await db.select({ count: count() }).from(donationsTable).where(eq(donationsTable.status, "available"));
  const [claimedDonations] = await db.select({ count: count() }).from(donationsTable).where(eq(donationsTable.status, "claimed"));
  const [completedDonations] = await db.select({ count: count() }).from(donationsTable).where(eq(donationsTable.status, "completed"));

  res.json({
    totalUsers: totalUsers.count,
    totalDonators: totalDonators.count,
    totalNgos: totalNgos.count,
    pendingVerifications: pendingVerifications.count,
    totalDonations: totalDonations.count,
    availableDonations: availableDonations.count,
    claimedDonations: claimedDonations.count,
    completedDonations: completedDonations.count
  });
});

router.get("/ngos/pending", requireRole("admin"), async (_req, res) => {
  const users = await db.
  select().
  from(usersTable).
  where(and(eq(usersTable.role, "ngo"), eq(usersTable.status, "pending_verification")));

  const safe = users.map(({ passwordHash: _, ...u }) => u);
  res.json(safe);
});

router.get("/", requireRole("admin"), async (req, res) => {
  const { role, status } = req.query;

  let query = db.select().from(usersTable);

  const conditions = [];
  if (role && typeof role === "string") {
    conditions.push(eq(usersTable.role, role));
  }
  if (status && typeof status === "string") {
    conditions.push(eq(usersTable.status, status));
  }

  const users = conditions.length > 0 ?
  await db.select().from(usersTable).where(and(...conditions)) :
  await db.select().from(usersTable);

  const safe = users.map(({ passwordHash: _, ...u }) => u);
  res.json(safe);
});

router.patch("/:id/verify", requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  if (!["verified", "rejected"].includes(status)) {
    res.status(400).json({ error: "Status must be verified or rejected" });
    return;
  }

  const [user] = await db.
  update(usersTable).
  set({ status }).
  where(and(eq(usersTable.id, id), eq(usersTable.role, "ngo"))).
  returning();

  if (!user) {
    res.status(404).json({ error: "NGO not found" });
    return;
  }

  const notificationType = status === "verified" ? "ngo_verified" : "ngo_rejected";
  const notificationTitle = status === "verified" ? "Account Verified!" : "Account Rejected";
  const notificationMessage =
  status === "verified" ?
  "Your NGO account has been verified. You can now view and claim food donations near you." :
  "Your NGO registration has been rejected. Please contact support for more information.";

  await sendNotificationToUser(user.id, notificationType, notificationTitle, notificationMessage);

  const { passwordHash: _, ...userSafe } = user;
  res.json(userSafe);
});

export default router;