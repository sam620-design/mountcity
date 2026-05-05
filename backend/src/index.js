import 'dotenv/config'; // Load env vars before anything else
import app from './app.js';
import connectDB from './db/index.js';  // Your DB connection

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start the server 
// const server = http.createServer(app); 

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`); 
});
