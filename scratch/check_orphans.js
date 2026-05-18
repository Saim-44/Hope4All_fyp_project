import mongoose from 'mongoose';
import Orphan from '../model/orphan_model.js';
import dbconnection from '../Config/dbconnection.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkOrphans() {
  try {
    await dbconnection();
    const orphans = await Orphan.find();
    console.log(`Found ${orphans.length} orphans:`);
    orphans.forEach(o => console.log(`- ${o.name} (Age: ${o.age}, Location: ${o.location})`));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkOrphans();
