import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { donationsTable, usersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticate, requireRole, type AuthRequest } from "../lib/auth";
import { notifyNearbyNgos, sendNotificationToUser } from "../lib/notifications";

const router: IRouter = Router();

router.use(authenticate);

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function enrichDonation(donation: typeof donationsTable.$inferSelect, ngoLat?: number, ngoLng?: number) {
  const [donator] = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, phone: usersTable.phone, organizationName: usersTable.organizationName })
    .from(usersTable)
    .where(eq(usersTable.id, donation.donatorId))
    .limit(1);

  let claimedByNgo = null;
  if (donation.claimedByNgoId) {
    const [ngo] = await db
      .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, phone: usersTable.phone, organizationName: usersTable.organizationName })
      .from(usersTable)
      .where(eq(usersTable.id, donation.claimedByNgoId))
      .limit(1);
    claimedByNgo = ngo ?? null;
  }

  const distanceKm =
    ngoLat && ngoLng ? haversineKm(ngoLat, ngoLng, donation.latitude, donation.longitude) : null;

  return { ...donation, donator, claimedByNgo, distanceKm };
}

router.get("/nearby", requireRole("ngo"), async (req: AuthRequest, res) => {
  const user = req.user!;

  if (user.status !== "verified") {
    res.status(403).json({ error: "Your NGO account must be verified to view nearby donations" });
    return;
  }

  const radiusKm = parseFloat((req.query.radiusKm as string) ?? "10") || 10;

  if (!user.latitude || !user.longitude) {
    res.status(400).json({ error: "Your NGO profile must have a location set" });
    return;
  }

  const now = new Date();
  const allAvailable = await db
    .select()
    .from(donationsTable)
    .where(eq(donationsTable.status, "available"));

  // Filter: Only non-expired donations within location radius
  const nearby = allAvailable.filter((d) => {
    // Check if donation has not expired
    const hasNotExpired = new Date(d.expiryTime) > now;
    if (!hasNotExpired) return false;
    
    // Check if donation is within radius (default 15km, but NGOs can only claim within their registered area)
    const dist = haversineKm(user.latitude!, user.longitude!, d.latitude, d.longitude);
    return dist <= radiusKm;
  });

  const enriched = await Promise.all(nearby.map((d) => enrichDonation(d, user.latitude!, user.longitude!)));
  enriched.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  res.json(enriched);
});

router.get("/", async (req: AuthRequest, res) => {
  const user = req.user!;
  const { status, myDonations } = req.query;

  let donations: typeof donationsTable.$inferSelect[];

  if (user.role === "admin") {
    const conditions = [];
    if (status && typeof status === "string") {
      conditions.push(eq(donationsTable.status, status as any));
    }
    donations = conditions.length > 0
      ? await db.select().from(donationsTable).where(and(...conditions))
      : await db.select().from(donationsTable);
  } else if (user.role === "donator") {
    const conditions = [eq(donationsTable.donatorId, user.id)];
    if (status && typeof status === "string") {
      conditions.push(eq(donationsTable.status, status as any));
    }
    donations = await db.select().from(donationsTable).where(and(...conditions));
  } else if (user.role === "ngo") {
    if (user.status !== "verified") {
      res.json([]);
      return;
    }
    if (myDonations === "true") {
      donations = await db
        .select()
        .from(donationsTable)
        .where(eq(donationsTable.claimedByNgoId, user.id));
    } else {
      donations = await db
        .select()
        .from(donationsTable)
        .where(eq(donationsTable.status, "available"));
    }
  } else {
    donations = [];
  }

  const enriched = await Promise.all(
    donations.map((d) =>
      enrichDonation(d, user.role === "ngo" ? user.latitude ?? undefined : undefined, user.role === "ngo" ? user.longitude ?? undefined : undefined)
    )
  );
  res.json(enriched);
});

router.post("/", requireRole("donator"), async (req: AuthRequest, res) => {
  const user = req.user!;
  const {
    title,
    foodItems,
    servesCount,
    expiryTime,
    dietaryType,
    specialInstructions,
    pickupAddress,
    latitude,
    longitude,
    pickupInstructions,
  } = req.body;

  if (!title || !foodItems || !servesCount || !expiryTime || !dietaryType || !pickupAddress || !latitude || !longitude) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [donation] = await db
    .insert(donationsTable)
    .values({
      title,
      foodItems,
      servesCount: parseInt(servesCount),
      expiryTime: new Date(expiryTime),
      dietaryType,
      specialInstructions: specialInstructions ?? null,
      pickupAddress,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      pickupInstructions: pickupInstructions ?? null,
      donatorId: user.id,
      status: "available",
    })
    .returning();

  // Notify all NGOs within 5km that new food is available
  notifyNearbyNgos(donation.id, donation.title, donation.latitude, donation.longitude, 5).catch(() => {});

  const enriched = await enrichDonation(donation);
  res.status(201).json(enriched);
});

router.get("/:id", async (req: AuthRequest, res) => {
  const user = req.user!;
  const id = parseInt(req.params.id);

  const [donation] = await db.select().from(donationsTable).where(eq(donationsTable.id, id)).limit(1);
  if (!donation) {
    res.status(404).json({ error: "Donation not found" });
    return;
  }

  const enriched = await enrichDonation(donation, user.latitude ?? undefined, user.longitude ?? undefined);
  res.json(enriched);
});

router.post("/:id/claim", requireRole("ngo"), async (req: AuthRequest, res) => {
  const user = req.user!;

  if (user.status !== "verified") {
    res.status(403).json({ error: "Your NGO must be verified to claim donations" });
    return;
  }

  const id = parseInt(req.params.id);

  const [donation] = await db.select().from(donationsTable).where(eq(donationsTable.id, id)).limit(1);
  if (!donation) {
    res.status(404).json({ error: "Donation not found" });
    return;
  }

  if (donation.status !== "available") {
    res.status(400).json({ error: "Donation is no longer available" });
    return;
  }

  // Check if donation has expired
  const now = new Date();
  if (new Date(donation.expiryTime) <= now) {
    res.status(400).json({ error: "This food donation has already expired" });
    return;
  }

  // Check if donation location is within NGO's registered area (0.5km radius)
  if (user.latitude && user.longitude) {
    const dist = haversineKm(user.latitude, user.longitude, donation.latitude, donation.longitude);
    const maxDistanceKm = 0.5; // NGO can only claim food at their registered location
    if (dist > maxDistanceKm) {
      res.status(403).json({ 
        error: `You can only claim food within 0.5km of your registered location. This donation is ${dist.toFixed(1)}km away.` 
      });
      return;
    }
  }

  const [updated] = await db
    .update(donationsTable)
    .set({ status: "claimed", claimedByNgoId: user.id })
    .where(and(eq(donationsTable.id, id), eq(donationsTable.status, "available")))
    .returning();

  if (!updated) {
    res.status(400).json({ error: "Donation was already claimed" });
    return;
  }

  const ngoName = user.organizationName ?? user.name;
  await sendNotificationToUser(
    donation.donatorId,
    "donation_claimed",
    "Your Donation Has Been Claimed!",
    `"${donation.title}" has been claimed by ${ngoName}. They will pick it up soon.`,
    donation.id
  );

  const enriched = await enrichDonation(updated);
  res.json(enriched);
});

router.post("/:id/complete", async (req: AuthRequest, res) => {
  const user = req.user!;
  const id = parseInt(req.params.id);

  const [donation] = await db.select().from(donationsTable).where(eq(donationsTable.id, id)).limit(1);
  if (!donation) {
    res.status(404).json({ error: "Donation not found" });
    return;
  }

  if (user.role === "donator" && donation.donatorId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (user.role === "ngo" && donation.claimedByNgoId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db
    .update(donationsTable)
    .set({ status: "completed" })
    .where(eq(donationsTable.id, id))
    .returning();

  if (donation.claimedByNgoId) {
    await sendNotificationToUser(
      donation.claimedByNgoId,
      "donation_completed",
      "Donation Completed",
      `The donation "${donation.title}" has been marked as completed. Thank you!`,
      donation.id
    );
  }

  const enriched = await enrichDonation(updated!);
  res.json(enriched);
});

export default router;
