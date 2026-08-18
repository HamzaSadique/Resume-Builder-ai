import nodemailer from "nodemailer";
import ApiError from "./ApiError.js";

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async ({ email, subject, message, html }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Resume Builder"}" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      text: message,
      html: html || `<p>${message.replace(/\n/g, "<br>")}</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Nodemailer Service Error:", error);
    throw new ApiError(500, "Email delivery failed. Please try again later.");
  }
};