import { pgTable, serial, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["admin", "donator", "ngo"]);
export const userStatusEnum = pgEnum("user_status", [
  "active",
  "pending_verification",
  "verified",
  "rejected",
]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("donator"),
  status: userStatusEnum("status").notNull().default("active"),
  organizationName: text("organization_name"),
  registrationNumber: text("registration_number"),
  phone: text("phone"),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
