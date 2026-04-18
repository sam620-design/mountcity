import mongoose from "mongoose";

const applySchema=new mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true},
    phoneNumber:{type:String,required:true},
    cv:{type:String,required:true},
    message:{type:String,required:true},
    date:{type:String,required:true}
})


const apply=mongoose.model('Apply',applySchema);
export default apply;