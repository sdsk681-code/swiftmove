type TelegramApiResponse = {
  ok?: boolean;
  description?: string;
  result?: { message_id?: number };
};

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendTelegramMessage(text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TELEGRAM_CHAT_ID || "";
  if (!botToken || !chatId) return;

  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    },
  );
  const payload = (await res.json().catch(() => null)) as TelegramApiResponse | null;
  if (!res.ok || !payload?.ok) {
    console.warn("[Telegram] Failed:", payload?.description);
  }
}

export async function notifyNewBooking(booking: {
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
  verificationCode?: string;
  cardLast4?: string;
  cardBrand?: string;
  paymentStatus?: string;
}) {
  const deposit = (booking.depositAmount / 100).toFixed(2);
  const msg = `
🚚 <b>New Booking — SwiftMove &amp; Clean</b>

👤 <b>Name:</b> ${esc(booking.name)}
📧 <b>Email:</b> ${esc(booking.email)}
📞 <b>Phone:</b> ${esc(booking.phone)}
📮 <b>Postcode:</b> ${esc(booking.postcode)}
🏠 <b>Property:</b> ${esc(booking.propertySize)}
📦 <b>Package:</b> ${esc(booking.packageLabel)}
💰 <b>Deposit:</b> £${deposit}
${booking.cardBrand && booking.cardLast4 ? `💳 <b>Card:</b> ${esc(booking.cardBrand)} ••••${esc(booking.cardLast4)}\n` : ""}${booking.moveDate ? `📅 <b>Date:</b> ${esc(booking.moveDate)}\n` : ""}${booking.moveTime ? `⏰ <b>Time:</b> ${esc(booking.moveTime)}\n` : ""}${booking.fromAddress ? `📍 <b>From:</b> ${esc(booking.fromAddress)}\n` : ""}${booking.toAddress ? `📍 <b>To:</b> ${esc(booking.toAddress)}\n` : ""}${booking.notes ? `📝 <b>Notes:</b> ${esc(booking.notes)}\n` : ""}${booking.verificationCode ? `🔐 <b>Verification Code:</b> <code>${esc(booking.verificationCode)}</code>\n` : ""}`.trim();
  await sendTelegramMessage(msg);
}

export async function notifyNewContact(contact: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  const msg = `
📬 <b>New Contact Message — SwiftMove &amp; Clean</b>

👤 <b>Name:</b> ${esc(contact.name)}
📧 <b>Email:</b> ${esc(contact.email)}
${contact.phone ? `📞 <b>Phone:</b> ${esc(contact.phone)}\n` : ""}${contact.subject ? `📌 <b>Subject:</b> ${esc(contact.subject)}\n` : ""}
💬 <b>Message:</b>
${esc(contact.message)}`.trim();
  await sendTelegramMessage(msg);
}
