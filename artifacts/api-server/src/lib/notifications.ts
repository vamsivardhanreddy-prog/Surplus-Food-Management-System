import { Server as SocketServer } from "socket.io";
import { db } from "@workspace/db";
import { notificationsTable, usersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";

let io: SocketServer | null = null;
const userSockets = new Map<number, string[]>();

export function initSocketServer(socketIo: SocketServer) {
  io = socketIo;

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("join", ({ userId }: { userId: number }) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
      logger.info({ socketId: socket.id, userId }, "User joined room");

      const existing = userSockets.get(userId) ?? [];
      userSockets.set(userId, [...existing, socket.id]);
    });

    socket.on("disconnect", () => {
      userSockets.forEach((sockets, userId) => {
        const filtered = sockets.filter((s) => s !== socket.id);
        if (filtered.length === 0) {
          userSockets.delete(userId);
        } else {
          userSockets.set(userId, filtered);
        }
      });
    });
  });
}

export async function sendNotificationToUser(
  userId: number,
  type: typeof notificationsTable.$inferInsert["type"],
  title: string,
  message: string,
  donationId?: number
) {
  const [notification] = await db
    .insert(notificationsTable)
    .values({
      userId,
      type,
      title,
      message,
      donationId: donationId ?? null,
      isRead: false,
    })
    .returning();

  if (io) {
    io.to(`user:${userId}`).emit("notification", notification);
  }

  return notification;
}

export async function notifyNearbyNgos(
  donationId: number,
  donationTitle: string,
  lat: number,
  lng: number,
  radiusKm = 10
) {
  const R = 6371;
  const maxLat = lat + (radiusKm / R) * (180 / Math.PI);
  const minLat = lat - (radiusKm / R) * (180 / Math.PI);
  const maxLng = lng + (radiusKm / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
  const minLng = lng - (radiusKm / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);

  const nearbyNgos = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "ngo"));

  const filtered = nearbyNgos.filter((ngo) => {
    if (ngo.status !== "verified") return false;
    if (!ngo.latitude || !ngo.longitude) return false;

    const dLat = ((ngo.latitude - lat) * Math.PI) / 180;
    const dLng = ((ngo.longitude - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((ngo.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusKm;
  });

  logger.info({ count: filtered.length, donationId }, "Notifying nearby NGOs");

  for (const ngo of filtered) {
    await sendNotificationToUser(
      ngo.id,
      "donation_nearby",
      "New Donation Nearby!",
      `A new food donation "${donationTitle}" is available near you. Act fast!`,
      donationId
    );
  }

  return filtered.length;
}
