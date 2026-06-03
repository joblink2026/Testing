import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/productRoutes.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());
app.use("/api", router);

const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    console.log(`App is connected to the database.`);
  } catch (error) {
    console.warn(`DB connection unavailable, continuing without MongoDB: ${error.message}`);
  }
};

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`App is listening on port ${PORT}`);
  });
};
startServer();
