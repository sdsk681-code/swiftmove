type TelegramApiResponse = {
  ok?: boolean;
  description?: string;
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

export async function notifyNewBooking(data: {
  name: string;
  email: string;
  phone: string;
  postcode: string;
  propertySize: string;
  packageLabel: string;
  depositAmount: number;
  moveDate?: string;
  moveTime?: string;
  paymentStatus?: string;
  verificationCode?: string;
}) {
  const text = [
    "📦 <b>New SwiftMove Booking</b>",
    `👤 ${esc(data.name)}`,
    `📧 ${esc(data.email)}`,
    `📞 ${esc(data.phone)}`,
    `📍 ${esc(data.postcode)}`,
    `🏠 ${esc(data.propertySize)}`,
    `📋 ${esc(data.packageLabel)}`,
    data.moveDate ? `📅 ${esc(data.moveDate)} ${data.moveTime ?? ""}`.trim() : "",
    `💷 Deposit: £${(data.depositAmount / 100).toFixed(2)}`,
    data.verificationCode ? `🔑 Code: ${esc(data.verificationCode)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  await sendTelegramMessage(text);
}

export async function notifyNewContact(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  const text = [
    "✉️ <b>New SwiftMove Contact</b>",
    `👤 ${esc(data.name)}`,
    `📧 ${esc(data.email)}`,
    data.phone ? `📞 ${esc(data.phone)}` : "",
    data.subject ? `📌 ${esc(data.subject)}` : "",
    `💬 ${esc(data.message.slice(0, 300))}`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendTelegramMessage(text);
}
