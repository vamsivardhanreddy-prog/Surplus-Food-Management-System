
import { db } from "@workspace/db";
import { notificationsTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";

let io = null;
const userSockets = new Map();

export function initSocketServer(socketIo) {
  io = socketIo;

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("join", ({ userId }) => {
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
userId,
type,
title,
message,
donationId)
{
  const [notification] = await db.
  insert(notificationsTable).
  values({
    userId,
    type,
    title,
    message,
    donationId: donationId ?? null,
    isRead: false
  }).
  returning();

  if (io) {
    io.to(`user:${userId}`).emit("notification", notification);
  }

  return notification;
}

export async function notifyNearbyNgos(
donationId,
donationTitle,
lat,
lng,
radiusKm = 10)
{
  const R = 6371;
  const maxLat = lat + radiusKm / R * (180 / Math.PI);
  const minLat = lat - radiusKm / R * (180 / Math.PI);
  const maxLng = lng + radiusKm / (R * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);
  const minLng = lng - radiusKm / (R * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);

  const nearbyNgos = await db.
  select().
  from(usersTable).
  where(eq(usersTable.role, "ngo"));

  const filtered = nearbyNgos.filter((ngo) => {
    if (ngo.status !== "verified") return false;
    if (!ngo.latitude || !ngo.longitude) return false;

    const dLat = (ngo.latitude - lat) * Math.PI / 180;
    const dLng = (ngo.longitude - lng) * Math.PI / 180;
    const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat * Math.PI / 180) *
    Math.cos(ngo.latitude * Math.PI / 180) *
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