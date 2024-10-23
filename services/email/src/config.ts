import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: String(process.env.SMTP_HOST) ?? "smtp.mailtrap.io",
  port: Number(process.env.SMTP_PORT) ?? 2525,
});

export const defaultSender =
  String(process.env.DEFAULT_SENDER_EMAIL) ?? "admin@example.com";
