import mongoose from "mongoose";
import validator from "validator";

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      validate: {
            validator: (value) => validator.isEmail(value),
            message: "Please enter a valid email address",
        }
    },
    isSubscribed: {
      type: Boolean,
      default: true
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    },
    unsubscribedAt: {
      type: Date,
      default: null
    },
  },
  { timestamps: true }
);

const newsletterModel = mongoose.model("newsletter",newsletterSchema);

export default newsletterModel;