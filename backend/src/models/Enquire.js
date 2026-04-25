import mongoose from "mongoose";

const enquireSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String }, // Make address optional since Career might not have it
    email: { type: String },
    message: { type: String },
    source: { type: String, default: 'Unknown' }, // e.g. 'Contact Page', 'Career Page', 'Popup'
}, { timestamps: true });

const Enquire = mongoose.model('Enquire', enquireSchema);
export default Enquire;