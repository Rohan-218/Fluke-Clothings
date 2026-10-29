import newsletterModel from "../models/newsletter.model.js";
import { sendNewsletterWelcomeEmail } from "../services/email.service.js";

const subscribeNewsletterController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let subscriber = await newsletterModel.findOne({
      email: normalizedEmail,
    });

    if (subscriber?.isSubscribed) {
      return res.status(200).json({
        success: true,
        message: "You are already subscribed to our newsletter.",
      });
    }

    if (subscriber) {
      subscriber.isSubscribed = true;
      subscriber.subscribedAt = new Date();
      subscriber.unsubscribedAt = null;
      await subscriber.save();
    } else {
      subscriber = await newsletterModel.create({
        email: normalizedEmail,
      });
    }


    try {
      await sendNewsletterWelcomeEmail(subscriber.email);
    } catch (emailError) {
      console.error(
        "Newsletter welcome email failed:",
        emailError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Successfully subscribed to the Fluke newsletter!",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "You are already subscribed to our newsletter.",
      });
    }

    console.error("Newsletter subscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to subscribe right now. Please try again.",
    });
  }
};

export { subscribeNewsletterController };