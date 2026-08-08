import { eq, desc } from "drizzle-orm";
import { db, bookingsTable, contactsTable } from "@workspace/db";

function generateVerificationCode(): string {
  return Math.random().toString().slice(2, 8);
}

export async function createBooking(data: {
  name: string;
  email: string;
  phone: string;
  postcode: string;
  moveDate?: string;
  moveTime?: string;
  propertySize: string;
  packageLabel: string;
  fromAddress?: string;
  toAddress?: string;
  notes?: string;
  depositAmount: number;
  paymentIntentId?: string | null;
  paymentStatus?: "pending" | "succeeded" | "failed" | "refunded";
  status?: "new" | "confirmed" | "in_progress" | "completed" | "cancelled";
  cardLast4?: string;
  cardBrand?: string;
}) {
  const verificationCode = generateVerificationCode();
  const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      name: data.name,
      email: data.email,
      phone: data.phone,
      postcode: data.postcode,
      moveDate: data.moveDate ?? null,
      moveTime: data.moveTime ?? null,
      propertySize: data.propertySize,
      packageLabel: data.packageLabel,
      fromAddress: data.fromAddress ?? null,
      toAddress: data.toAddress ?? null,
      notes: data.notes ?? null,
      depositAmount: data.depositAmount,
      paymentIntentId: data.paymentIntentId ?? null,
      paymentStatus: data.paymentStatus ?? "pending",
      status: data.status ?? "new",
      cardLast4: data.cardLast4 ?? null,
      cardBrand: data.cardBrand ?? null,
      verificationCode,
      verificationCodeExpires,
      isVerified: false,
    })
    .returning();

  return booking;
}

export async function getBookings() {
  return db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt));
}

export async function getBookingById(id: number) {
  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, id))
    .limit(1);
  return booking ?? null;
}

export async function updateBookingPayment(
  bookingId: number,
  paymentIntentId: string,
  paymentStatus: "pending" | "succeeded" | "failed" | "refunded",
) {
  await db
    .update(bookingsTable)
    .set({ paymentIntentId, paymentStatus, updatedAt: new Date() })
    .where(eq(bookingsTable.id, bookingId));
}

export async function updateBookingStatus(id: number, status: string) {
  await db
    .update(bookingsTable)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(bookingsTable.id, id));
}

export async function verifyBookingCode(bookingId: number, code: string) {
  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (!booking) return { success: false, error: "Booking not found" };
  if (!booking.verificationCode) return { success: false, error: "No verification code" };
  if (booking.verificationCodeExpires && booking.verificationCodeExpires < new Date()) {
    return { success: false, error: "Verification code expired" };
  }
  if (booking.verificationCode !== code) {
    return { success: false, error: "Invalid verification code" };
  }

  await db
    .update(bookingsTable)
    .set({ isVerified: true })
    .where(eq(bookingsTable.id, bookingId));

  return { success: true, message: "Booking verified successfully" };
}

export async function createContact(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  const [contact] = await db
    .insert(contactsTable)
    .values({
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      subject: data.subject ?? null,
      message: data.message,
      isRead: false,
    })
    .returning();
  return contact;
}

export async function getContacts() {
  return db.select().from(contactsTable).orderBy(desc(contactsTable.createdAt));
}

export async function markContactRead(id: number) {
  await db.update(contactsTable).set({ isRead: true }).where(eq(contactsTable.id, id));
}
