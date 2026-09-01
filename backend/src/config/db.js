const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers([
  '1.1.1.1',
  '8.8.8.8'
]);

function connectDB() {
    mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
        process.exit(1); 
    });
}

module.exports = connectDB;