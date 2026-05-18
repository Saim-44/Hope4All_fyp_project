import mongoose from "mongoose";


const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

const dbConnection = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error(" MONGO_URI is not defined");
    process.exit(1);
  }

  // Log masked URI for debugging
  const maskedURI = mongoURI.replace(/^(mongodb[^\/]+:\/\/)([^:]+:)[^@]+@/, `$1***:***@`);
  console.log("Attempting connection to (masked):", maskedURI);

  let attempts = 0;

  const connect = async () => {
    try {
      attempts++;

      console.log(` Connecting to MongoDB (Attempt ${attempts}/${MAX_RETRIES})...`);

      await mongoose.connect(mongoURI, {
        dbName: 'Hope4AllDB',
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        w: 'majority',
      });

      console.log(" MongoDB connected");
      console.log(" Database:", mongoose.connection.name);

    } catch (error) {
    console.error(" MongoDB connection failed:", error.message);
    console.error("Full error:", error);

      if (attempts >= MAX_RETRIES) {
        console.error(" Max retries reached. Exiting app.");
        process.exit(1);
      }

      console.log(` Retrying in ${RETRY_DELAY / 1000}s...`);
      setTimeout(connect, RETRY_DELAY);
    }
  };

  // Connection events (minimal & useful)
  mongoose.connection.on("connected", () => {
    console.log(" Mongoose connected");
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Reconnecting...");
    connect();
  });

  mongoose.connection.on("error", (err) => {
    console.error(" Mongoose error:", err.message);
  });

  await connect();
};

export default dbConnection;
