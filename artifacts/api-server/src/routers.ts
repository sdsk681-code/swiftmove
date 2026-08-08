import { router, publicProcedure, adminProcedure } from "./trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingPayment,
  updateBookingStatus,
  verifyBookingCode,
  createContact,
  getContacts,
  markContactRead,
} from "./db";
import { notifyNewBooking, notifyNewContact } from "./telegram";

export const appRouter = router({
  bookings: router({
    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          phone: z.string().min(1),
          postcode: z.string().min(1),
          moveDate: z.string().optional(),
          moveTime: z.string().optional(),
          propertySize: z.string().min(1),
          packageLabel: z.string().min(1),
          fromAddress: z.string().optional(),
          toAddress: z.string().optional(),
          notes: z.string().optional(),
          depositAmount: z.number().int().positive(),
          cardLast4: z.string().optional(),
          cardBrand: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const booking = await createBooking({
          ...input,
          paymentIntentId: null,
          paymentStatus: "pending",
          status: "new",
        });
        await notifyNewBooking({
          ...input,
          paymentStatus: "pending",
          verificationCode: booking.verificationCode ?? undefined,
        }).catch(() => {});
        return booking;
      }),

    list: adminProcedure.query(() => getBookings()),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getBookingById(input.id)),

    // Public: called by the visitor after paying. The client-supplied status is
    // never trusted — when Stripe is configured the real status is fetched from
    // Stripe and the payment intent must belong to this booking. "refunded" can
    // only be set by an admin (via Stripe dashboard / adminProcedure elsewhere).
    updatePayment: publicProcedure
      .input(
        z.object({
          bookingId: z.number(),
          paymentIntentId: z.string(),
          paymentStatus: z.enum(["pending", "succeeded", "failed"]),
        }),
      )
      .mutation(async ({ input }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
        }
        if (booking.paymentStatus === "succeeded" || booking.paymentStatus === "refunded") {
          // Payment state is final for public callers.
          return { success: true };
        }

        let status: "pending" | "succeeded" | "failed";
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (stripeKey) {
          // Stripe mode: the client-supplied status is NEVER used. The payment
          // intent must exist, belong to this booking, and match the booking's
          // deposit amount; the status is derived from Stripe alone.
          if (!input.paymentIntentId.startsWith("pi_")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "A valid Stripe payment intent ID is required",
            });
          }
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(stripeKey);
          const intent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
          if (
            intent.metadata?.booking_id !== String(input.bookingId) ||
            intent.amount !== booking.depositAmount
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Payment intent does not match this booking",
            });
          }
          status =
            intent.status === "succeeded"
              ? "succeeded"
              : intent.status === "canceled"
                ? "failed"
                : "pending";
        } else {
          // Fallback mode (no Stripe configured): no external source of truth
          // exists, so only allow the pending → succeeded/failed transition
          // guarded above.
          status = input.paymentStatus;
        }

        await updateBookingPayment(input.bookingId, input.paymentIntentId, status);
        return { success: true };
      }),

    updateStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        await updateBookingStatus(input.id, input.status);
        return { success: true };
      }),

    verifyCode: publicProcedure
      .input(z.object({ bookingId: z.number(), code: z.string() }))
      .mutation(({ input }) => verifyBookingCode(input.bookingId, input.code)),

    getStripeConfig: publicProcedure.query(() => {
      const publishableKey =
        process.env.VITE_STRIPE_PUBLISHABLE_KEY ||
        process.env.STRIPE_PUBLISHABLE_KEY ||
        "";
      return { publishableKey };
    }),

    createPaymentIntent: publicProcedure
      .input(
        z.object({
          amount: z.number().int().positive(),
          service: z.string(),
          bookingId: z.number().int().positive(),
        }),
      )
      .mutation(async ({ input }) => {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) throw new Error("Stripe not configured");
        // Amount is bound to the booking's server-side deposit amount — the
        // client-supplied amount is only sanity-checked, never trusted.
        const booking = await getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
        }
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(stripeKey);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: booking.depositAmount,
          currency: "gbp",
          metadata: {
            service: input.service,
            booking_id: String(input.bookingId),
          },
          automatic_payment_methods: { enabled: true },
        });
        return { clientSecret: paymentIntent.client_secret };
      }),
  }),

  contacts: router({
    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          phone: z.string().optional(),
          subject: z.string().optional(),
          message: z.string().min(1),
        }),
      )
      .mutation(async ({ input }) => {
        const contact = await createContact(input);
        await notifyNewContact(input).catch(() => {});
        return contact;
      }),

    list: adminProcedure.query(() => getContacts()),

    markRead: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markContactRead(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
