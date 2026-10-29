import resend from "../config/email.js";

const sendEmail = async ({ to, subject, html, text }) => {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error("Failed to send email");
  }

  return data;
};

export const sendWelcomeEmail = (email, name) =>
  sendEmail({
    to: email,
    subject: "Welcome to Fluke!",
    text: `Hi ${name}, welcome to Fluke. Happy shopping!`,
    html: `
      <h2>Welcome to Fluke, ${name}!</h2>
      <p>Thank you for creating an account.</p>
      <p>Happy shopping!</p>
    `,
  });

export const sendPasswordResetEmail = (email, resetUrl) =>
  sendEmail({
    to: email,
    subject: "Reset your Fluke password",
    text: `Reset your password using this link: ${resetUrl}`,
    html: `
      <h2>Password reset</h2>
      <p>Click below to reset your password.</p>
      <a href="${resetUrl}">Reset password</a>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });

export const sendNewsletterWelcomeEmail = (email) =>
  sendEmail({
    to: email,
    subject: "Welcome to the Fluke newsletter!",
    text: "Thanks for subscribing to Fluke updates.",
    html: `
      <h2>Welcome to the Fluke newsletter!</h2>
      <p>Thank you for subscribing.</p>
    `,
  });

export default sendEmail;