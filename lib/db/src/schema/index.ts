import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "new",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  postcode: varchar("postcode", { length: 20 }).notNull(),
  moveDate: varchar("move_date", { length: 20 }),
  moveTime: varchar("move_time", { length: 20 }),
  propertySize: varchar("property_size", { length: 100 }).notNull(),
  packageLabel: varchar("package_label", { length: 100 }).notNull(),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  notes: text("notes"),
  depositAmount: integer("deposit_amount").notNull(),
  paymentIntentId: varchar("payment_intent_id", { length: 255 }),
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  cardLast4: varchar("card_last4", { length: 4 }),
  cardBrand: varchar("card_brand", { length: 50 }),
  verificationCode: varchar("verification_code", { length: 10 }),
  verificationCodeExpires: timestamp("verification_code_expires"),
  isVerified: boolean("is_verified").default(false).notNull(),
  status: bookingStatusEnum("status").default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contactsTable = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Booking = typeof bookingsTable.$inferSelect;
export type InsertBooking = typeof bookingsTable.$inferInsert;
export type Contact = typeof contactsTable.$inferSelect;
export type InsertContact = typeof contactsTable.$inferInsert;
