const mongoose = require('mongoose');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://harshinit2812_db_user:wWsiRgL164iEEW4x@ac-gicrpst-shard-00-00.zyxx4fg.mongodb.net:27017,ac-gicrpst-shard-00-01.zyxx4fg.mongodb.net:27017,ac-gicrpst-shard-00-02.zyxx4fg.mongodb.net:27017/?ssl=true&replicaSet=atlas-tddvw0-shard-0&authSource=admin&appName=Cluster1';

const connectDB = async () => {
  // If already connected, do not reconnect (important for serverless)
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URL, {
      dbName: 'smart_food_redistribution',
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
