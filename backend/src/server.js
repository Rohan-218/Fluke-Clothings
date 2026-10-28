import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    connectCloudinary();

    app.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on port: ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();