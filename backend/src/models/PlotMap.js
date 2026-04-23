import mongoose from "mongoose";

const PlotMapSchema = new mongoose.Schema({
  projectId: { 
    type: Number, 
    required: true,
    index: true 
  },
  plotId: { 
    type: String, 
    required: true 
  },
  x: { 
    type: Number, 
    required: true 
  },
  y: { 
    type: Number, 
    required: true 
  },
  width: { 
    type: Number, 
    required: true 
  },
  height: { 
    type: Number, 
    required: true 
  },
  customer: { 
    type: String, 
    default: "" 
  },
}, { timestamps: true });

export default mongoose.model("PlotMap", PlotMapSchema);
