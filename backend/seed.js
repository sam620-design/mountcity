import mongoose from 'mongoose';
import Advisor from './src/models/Advisor.js';

import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    let admin = await Advisor.findOne({ email: 'admin@test.com' });
    if (!admin) {
      admin = await Advisor.create({
        name: 'Admin User',
        email: 'admin@test.com',
        phoneNumber: '0000000000',
        role: 'admin',
        password: 'password123',
        verified: true
      });
      console.log('Created admin@test.com with password: password123');
    } else {
      admin.verified = true;
      await admin.save();
      console.log('User admin@test.com already exists and is now verified. Password is password123 (if not changed).');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
