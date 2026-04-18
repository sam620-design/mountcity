import mongoose  from "mongoose";

const enquireSchema=new mongoose.Schema({
    name:{type:String, required:true},
    phoneNumber:{type:String,required:true},
    address:{type:String,required:true},

})

const Enquire=mongoose.model('Enquire',enquireSchema);
export default Enquire;