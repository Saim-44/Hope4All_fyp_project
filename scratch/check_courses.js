import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../model/course_model.js';
import User from '../model/user_model.js';
import dbconnection from '../Config/dbconnection.js';

dotenv.config();

async function checkCourses() {
  try {
    await dbconnection();
    console.log("Connected to DB.");

    const courses = await Course.find();
    console.log(`Found ${courses.length} courses:`);
    console.log(JSON.stringify(courses, null, 2));

    const users = await User.find({ role: { $in: ['admin', 'donor'] } }, 'username role email');
    console.log("\nUsers (admin/donor):");
    console.log(JSON.stringify(users, null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkCourses();
