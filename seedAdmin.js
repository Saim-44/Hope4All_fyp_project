import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './model/user_model.js';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Use URI from .env only
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error(" Error: MONGO_URI not found in .env file!");
  process.exit(1);
}

async function seedAdmin() {
  try {
    await mongoose.connect(uri, { dbName: 'Hope4AllDB' });
    console.log("Connected to DB.");

    const email = 'nasirzia171@gmail.com';
    const password = 'Lakki123,.';

    let adminUser = await User.findOne({ email });

    if (adminUser) {
      console.log("User already exists. Updating role to admin and resetting password...");
      adminUser.role = 'admin';
      adminUser.status = 'verified';

      const salt = await bcrypt.genSalt(10);
      adminUser.password = await bcrypt.hash(password, salt);

      await adminUser.save();
      console.log("\x1b[32m%s\x1b[0m", " Admin account updated successfully!");
    } else {
      console.log("Creating new admin user...");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      adminUser = new User({
        username: 'Admin Nasir',
        email: email,
        password: hashedPassword,
        role: 'admin',
        status: 'verified'
      });

      await adminUser.save();
      console.log("\x1b[32m%s\x1b[0m", " Admin account created successfully!");
    }

    console.log("");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("");

  } catch (error) {
    console.error("Error seeding admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from DB.");
  }
}

seedAdmin();
