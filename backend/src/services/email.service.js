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

export const sendResetPasswordEmail = (email, name, resetUrl) =>
  sendEmail({
    to: email,
    subject: "Reset your Fluke password",
    text: `Hi ${name}, use this link to reset your Fluke password: ${resetUrl}. This link expires in 15 minutes. If you did not request this, you can ignore this email.`,
    html: `
      <h2>Reset your Fluke password</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password.</p>
      <p>
        <a href="${resetUrl}">Reset my password</a>
      </p>
      <p>This link expires in 15 minutes.</p>
      <p>If you did not request a password reset, you can ignore this email.</p>
      <p>Team Fluke</p>
    `,
  });

export const sendNewsletterWelcomeEmail = (email) =>
  sendEmail({
    to: email,
    subject: "Welcome to the Fluke Newsletter!",
    text: "Thanks for subscribing to the Fluke newsletter. You'll receive updates about new arrivals, collections, and offers.",
    html: `
      <h2>Welcome to Fluke!</h2>
      <p>Thank you for subscribing to our newsletter.</p>
      <p>You'll receive updates about new arrivals, collections, and special offers.</p>
      <p>Happy shopping!</p>
      <p>Team Fluke</p>
    `,
  });

export default sendEmail;