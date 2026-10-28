import mongoose from "mongoose";

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB");
};

export default connectDB;
