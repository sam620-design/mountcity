import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  pan:{type: String,default:'Not Provided'},
  aadhar:{type: String,default:'Not Provided' },
  address: { type: String, default: 'Not Provided' },
  profilePhoto: { type: String, default: '' },
  role: { type: String, required: true },
  password: { type: String, required: true },
  passwordPlain: { type: String, default: '' }, // Stored by superadmin override only
  date: { type: Date, default: Date.now },
  leads: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  incentives: { type: Number, default: 0 },
  badge: { type: String, default: 'Bronze' },
  verified: { type: Boolean, default: false }, 
  advisorId: { type: String, unique: true, sparse: true },
  dob: { type: Date },
 
  customers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }],

  connectedAdvisors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Advisor' }], // Child advisors
  parentAdvisor: { type: mongoose.Schema.Types.ObjectId, ref: 'Advisor' },
  
  // New Lead Flow & Reward System fields
  referralCode: { type: String, unique: true },
  totalBusiness: { type: Number, default: 0 },
  selfBusiness: { type: Number, default: 0 },
  teamBusiness: { type: Number, default: 0 },
  currentSlab: { type: Number, default: 0 }, // 1 to 10 based on business plan
  rewardAchieved: { type: Boolean, default: false },
  
  // New Commission Fields
  totalCommissionEarned: { type: Number, default: 0 },
  totalCommissionReleased: { type: Number, default: 0 },
}); 

userSchema.pre('save', async function(next) {
  // Generate a referral code if it doesn't exist
  if (!this.referralCode) {
    this.referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
}); 

const Advisor = mongoose.model('Advisor', userSchema);


export default Advisor;  
