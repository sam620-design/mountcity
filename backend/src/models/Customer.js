
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fatherName: { type: String, default: '' },
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true }, // Added email
  aadhar:{type:String,required:true},

  address: { type: String, required: true }, // Added customer address
  plotNumber: { type: String, required: true }, // Added purchased plot
  projectName: { type: String, required: true }, // Added project name
  plotSize:{type:String,required:true},
  dob: { type: Date },
  siteVisited: { type: String, enum: ['Yes', 'No'], default: 'No' },
  isFullyPaid: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['WAITING', 'BOOKED', 'REGISTERED', 'booked', 'not-confirmed', 'confirmed','waiting', 'PENDING_REGISTRATION'],
    default: 'WAITING',
  },
  block: { type: String }, // A, B, C, D
  price: { type: Number },
  extraCharges: { type: Number, default: 0 },
  baseAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, default: 0 },
  bookingAmount: { type: Number, default: 0 },
  paymentMode: { type: String }, // Full Payment or EMI
  tenure: { type: Number }, // in months for EMI
  emi: { type: Number }, 
  purchaseAmount: { type: Number, default: 0 },
  advisor: { type: mongoose.Schema.Types.ObjectId, ref: 'Advisor', required: true },
  bookingDate: { type: Date },
  registrationDate: { type: Date },
  actualDate: { type: Date, default: Date.now },
  bookingTime: { type: String },

  // New Payment Tracking
  amountPaid: { type: Number, default: 0 },
  payments: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: '' }
  }],

  // New Commission Distribution per sale
  commissionDistribution: [{
    advisor: { type: mongoose.Schema.Types.ObjectId, ref: 'Advisor' },
    percent: { type: Number, required: true },
    earnedAmount: { type: Number, default: 0 },
    releasedAmount: { type: Number, default: 0 },
    eligible: { type: Boolean, default: true }, // Frozen at time of commission lock
    isDirectSale: { type: Boolean, default: false } // True if this advisor is the direct seller
  }],
  companySharePercent: { type: Number },
  companyShareAmount: { type: Number },

  // Actual commission disbursements paid out by company to advisor (recorded by /dev)
  // Commission Released (system calc) - advisorPayouts total = Balance Still Owed
  advisorPayouts: [{
    advisor: { type: mongoose.Schema.Types.ObjectId, ref: 'Advisor', required: true },
    amount:  { type: Number, required: true },
    date:    { type: Date,   default: Date.now },
    note:    { type: String, default: '' }
  }],
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
 