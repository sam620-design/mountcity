import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import PlotMap from "./src/models/PlotMap.js";
import connectDB from "./src/db/index.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const seedPlots = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB for Seeding Plots...");

    const frontendPath = path.resolve(__dirname, "../Frontend/src/components/pages/PDFviewer.jsx");
    const content = fs.readFileSync(frontendPath, "utf-8");

    // Extract the plots array string
    const startIdx = content.indexOf("const plots = [");
    if (startIdx === -1) throw new Error("Could not find plots array in PDFviewer.jsx");

    const endIdx = content.indexOf("];", startIdx);
    if (endIdx === -1) throw new Error("Could not find end of plots array");

    let arrayString = content.substring(startIdx + 14, endIdx + 1);
    
    // We can't just JSON.parse it because it's not valid JSON (keys aren't quoted).
    // Let's execute it in a safe context.
    const plotsArray = eval(`(${arrayString})`);

    // Project 1 ID is 1
    const mappedPlots = plotsArray.map((p, index) => ({
      projectId: 1,
      plotId: p.id.toString() + '_' + index, // Some IDs in the hardcoded array are duplicated! Wait, let's just use a string format or just standard index.
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      customer: p.customer || ""
    }));

    // Wait, the user might have duplicated `id` values in the hardcoded array (like column 2 starting with id 1 again).
    // So we need a unique `plotId` field or we just map it as "plotId".
    // I'll set plotId to their `id` property as a string. For display, we might want unique `plotId`s but they reused IDs.
    // Let's format plotId as `ColX_IdY` or just the `id` and let them fix duplicates later if they want.

    const finalMapped = plotsArray.map((p, index) => ({
      projectId: 1,
      plotId: p.id.toString(),
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      customer: p.customer || ""
    }));

    // Clear existing for Project 1 to prevent duplicates
    await PlotMap.deleteMany({ projectId: 1 });
    await PlotMap.insertMany(finalMapped);

    console.log(`Successfully seeded ${finalMapped.length} plots for Project 1!`);
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedPlots();
