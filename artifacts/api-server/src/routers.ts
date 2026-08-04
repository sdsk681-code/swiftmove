import { router, publicProcedure } from "./trpc";
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

    list: publicProcedure.query(() => getBookings()),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getBookingById(input.id)),

    updatePayment: publicProcedure
      .input(
        z.object({
          bookingId: z.number(),
          paymentIntentId: z.string(),
          paymentStatus: z.enum(["pending", "succeeded", "failed", "refunded"]),
        }),
      )
      .mutation(async ({ input }) => {
        await updateBookingPayment(
          input.bookingId,
          input.paymentIntentId,
          input.paymentStatus,
        );
        return { success: true };
      }),

    updateStatus: publicProcedure
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
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(stripeKey);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: input.amount,
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

    list: publicProcedure.query(() => getContacts()),

    markRead: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markContactRead(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
