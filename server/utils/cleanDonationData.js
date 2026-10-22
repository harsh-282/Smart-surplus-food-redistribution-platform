const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const User = require('../models/User');
const NGO = require('../models/NGO');
const Volunteer = require('../models/Volunteer');
const Donation = require('../models/Donation');
const DeliveryTracking = require('../models/DeliveryTracking');
const ProofOfDelivery = require('../models/ProofOfDelivery');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');

async function cleanDonations() {
  try {
    await connectDB();
    console.log('🔄 Cleaning donation and accepted donation databases...');

    // 1. Delete all donations
    const donationRes = await Donation.deleteMany({});
    console.log(`✅ Deleted ${donationRes.deletedCount} donation records.`);

    // 2. Delete all delivery trackings
    const trackingRes = await DeliveryTracking.deleteMany({});
    console.log(`✅ Deleted ${trackingRes.deletedCount} delivery tracking records.`);

    // 3. Delete all proof of deliveries
    const podRes = await ProofOfDelivery.deleteMany({});
    console.log(`✅ Deleted ${podRes.deletedCount} proof of delivery records.`);

    // 4. Delete all feedback / ratings
    const feedbackRes = await Feedback.deleteMany({});
    console.log(`✅ Deleted ${feedbackRes.deletedCount} feedback records.`);

    // 5. Delete all donation-related notifications
    const notifRes = await Notification.deleteMany({});
    console.log(`✅ Deleted ${notifRes.deletedCount} notification records.`);

    // 6. Reset volunteer delivery counts to 0 (preserving volunteer details)
    const volRes = await Volunteer.updateMany({}, { $set: { completedDeliveries: 0 } });
    console.log(`✅ Reset completed deliveries count for ${volRes.modifiedCount} volunteers.`);

    // 7. Verify users and profiles are completely intact
    const userCount = await User.countDocuments();
    const ngoCount = await NGO.countDocuments();
    const volCount = await Volunteer.countDocuments();
    const donCount = await Donation.countDocuments();

    console.log('\n--- Post-Clean Verification ---');
    console.log(`👥 Users preserved: ${userCount}`);
    console.log(`🏢 NGOs preserved: ${ngoCount}`);
    console.log(`🚴 Volunteers preserved: ${volCount}`);
    console.log(`📦 Active Donations remaining: ${donCount}`);
    console.log('-------------------------------\n');
    console.log('🎉 Successfully cleared all donation records while preserving all user accounts!');

  } catch (err) {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

cleanDonations();
