import { pgTable, serial, text, integer, real, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { relations } from "drizzle-orm";

export const donationStatusEnum = pgEnum("donation_status", [
  "available",
  "claimed",
  "completed",
]);

export const dietaryTypeEnum = pgEnum("dietary_type", ["veg", "non-veg", "both"]);

export const donationsTable = pgTable("donations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  foodItems: jsonb("food_items").notNull().$type<Array<{ name: string; quantity: string }>>(),
  servesCount: integer("serves_count").notNull(),
  expiryTime: timestamp("expiry_time").notNull(),
  dietaryType: dietaryTypeEnum("dietary_type").notNull(),
  specialInstructions: text("special_instructions"),
  pickupAddress: text("pickup_address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  pickupInstructions: text("pickup_instructions"),
  status: donationStatusEnum("status").notNull().default("available"),
  donatorId: integer("donator_id")
    .notNull()
    .references(() => usersTable.id),
  claimedByNgoId: integer("claimed_by_ngo_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const donationsRelations = relations(donationsTable, ({ one }) => ({
  donator: one(usersTable, {
    fields: [donationsTable.donatorId],
    references: [usersTable.id],
    relationName: "donator",
  }),
  claimedByNgo: one(usersTable, {
    fields: [donationsTable.claimedByNgoId],
    references: [usersTable.id],
    relationName: "claimedByNgo",
  }),
}));

export const insertDonationSchema = createInsertSchema(donationsTable).omit({
  id: true,
  createdAt: true,
  status: true,
  claimedByNgoId: true,
});

export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donationsTable.$inferSelect;
