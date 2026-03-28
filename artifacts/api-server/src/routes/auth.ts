import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { signToken, authenticate, type AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.post("/register", async (req, res) => {
  const { name, email, password, role, organizationName, registrationNumber, phone, address, latitude, longitude } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "Name, email, password, and role are required" });
    return;
  }

  if (!["donator", "ngo"].includes(role)) {
    res.status(400).json({ error: "Role must be donator or ngo" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const status = role === "ngo" ? "pending_verification" : "active";

  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email,
      passwordHash,
      role,
      status,
      organizationName: organizationName ?? null,
      registrationNumber: registrationNumber ?? null,
      phone: phone ?? null,
      address: address ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    })
    .returning();

  const token = signToken({ userId: user.id, role: user.role });
  const { passwordHash: _, ...userSafe } = user;
  res.status(201).json({ token, user: userSafe });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role });
  const { passwordHash: _, ...userSafe } = user;
  res.json({ token, user: userSafe });
});

router.get("/me", authenticate, async (req: AuthRequest, res) => {
  const user = req.user!;
  const { passwordHash: _, ...userSafe } = user;
  res.json(userSafe);
});

export default router;
