const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Donation = require('../models/Donation');
const NGO = require('../models/NGO');
const Volunteer = require('../models/Volunteer');
const Notification = require('../models/Notification');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_food_redistribution';
  await mongoose.connect(mongoUri, { dbName: 'smart_food_redistribution' });
  console.log('✅ Connected to MongoDB');
};

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Donation.deleteMany({});
  await NGO.deleteMany({});
  await Volunteer.deleteMany({});
  await Notification.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // Create Admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@foodshare.com',
    password: 'Admin@123',
    phone: '9000000001',
    role: 'admin',
    address: 'Admin Office, Chennai, Tamil Nadu',
  });

  // Create Donors
  const donor1 = await User.create({
    name: "Anand's restaurant",
    email: 'anand.restaurant@gmail.com',
    password: 'Donor@123',
    phone: '9876543210',
    role: 'donor',
    address: '12, Anna Nagar, Chennai, Tamil Nadu',
    locationCoordinates: { lat: 13.0878, lng: 80.2170 },
  });

  const donor2 = await User.create({
    name: 'Sri Lakshmi Marriage Hall',
    email: 'srilakshmi.hall@gmail.com',
    password: 'Donor@123',
    phone: '9876543211',
    role: 'donor',
    address: '45, T. Nagar, Chennai, Tamil Nadu',
    locationCoordinates: { lat: 13.0418, lng: 80.2341 },
  });

  // Create NGO Users
  const ngoUser1 = await User.create({
    name: 'HelpHands NGO',
    email: 'helphands@gmail.com',
    password: 'NGO@123',
    phone: '9123456789',
    role: 'ngo',
    address: '23, Velachery, Chennai, Tamil Nadu',
    locationCoordinates: { lat: 12.9759, lng: 80.2212 },
    verificationStatus: 'Verified',
  });

  const ngoUser2 = await User.create({
    name: 'FeedIndia Foundation',
    email: 'feedindia@gmail.com',
    password: 'NGO@123',
    phone: '9123456788',
    role: 'ngo',
    address: '78, Tambaram, Chennai, Tamil Nadu',
    locationCoordinates: { lat: 12.9249, lng: 80.1000 },
    verificationStatus: 'Verified',
  });

  // Create NGO Profiles
  await NGO.create({
    userId: ngoUser1._id,
    organizationName: 'HelpHands NGO',
    contactPerson: 'Yasotha',
    phone: '9123456789',
    address: '23, Velachery, Chennai, Tamil Nadu',
    locationCoordinates: { lat: 12.9759, lng: 80.2212 },
    description: 'We work to eliminate hunger by redistributing surplus food to street children and homeless communities.',
    registrationNumber: 'NGO-TN-2019-4521',
  });

  await NGO.create({
    userId: ngoUser2._id,
    organizationName: 'FeedIndia Foundation',
    contactPerson: 'Arathi',
    phone: '9123456788',
    address: '78, Tambaram, Chennai, Tamil Nadu',
    locationCoordinates: { lat: 12.9249, lng: 80.1000 },
    description: 'A grassroots organization dedicated to fighting food insecurity across Tamil Nadu.',
    registrationNumber: 'NGO-TN-2020-7832',
  });

  // Create Volunteer Users
  const volUser1 = await User.create({
    name: 'Arjun',
    email: 'arjun.volunteer@gmail.com',
    password: 'Vol@123',
    phone: '9988776655',
    role: 'volunteer',
    address: '15, Adyar, Chennai, Tamil Nadu',
    locationCoordinates: { lat: 13.0012, lng: 80.2565 },
    verificationStatus: 'Verified',
  });

  const volUser2 = await User.create({
    name: 'Divya',
    email: 'divya.volunteer@gmail.com',
    password: 'Vol@123',
    phone: '9988776644',
    role: 'volunteer',
    address: '34, Mylapore, Chennai, Tamil Nadu',
    locationCoordinates: { lat: 13.0339, lng: 80.2676 },
    verificationStatus: 'Verified',
  });

  // Create Volunteer Profiles
  await Volunteer.create({
    userId: volUser1._id,
    phone: '9988776655',
    address: '15, Adyar, Chennai, Tamil Nadu',
    locationCoordinates: { lat: 13.0012, lng: 80.2565 },
    vehicleType: 'Motorcycle',
    availability: 'Available',
    completedDeliveries: 12,
  });

  await Volunteer.create({
    userId: volUser2._id,
    phone: '9988776644',
    address: '34, Mylapore, Chennai, Tamil Nadu',
    locationCoordinates: { lat: 13.0339, lng: 80.2676 },
    vehicleType: 'Car',
    availability: 'Available',
    completedDeliveries: 7,
  });

  // Donation dates helper
  const now = new Date();
  const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in5Hours = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const in12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // 1. Fresh Food - Available (Expiry > 24h away)
  await Donation.create({
    donorId: donor1._id,
    foodName: 'Rice and Sambar',
    category: 'Cooked Food',
    quantity: '50 portions',
    image: { url: '/rice-sambar.jpg', publicId: 'local_rice_sambar' },
    preparationDate: now,
    expiryDate: twoDaysLater,
    pickupAddress: '12, Anna Nagar, Chennai, Tamil Nadu',
    pickupCoordinates: { lat: 13.0878, lng: 80.2170 },
    description: 'Freshly prepared rice, sambar and vegetables. Stored safely.',
    status: 'Available',
  });

  // 2. Expiring Soon Food - Available (Expiry in 5 hours) -> Highlighted in NGO view!
  await Donation.create({
    donorId: donor1._id,
    foodName: 'Idli and Chutney',
    category: 'Cooked Food',
    quantity: '80 pieces',
    image: { url: '/idli-chutney.jpg', publicId: 'local_idli_chutney' },
    preparationDate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    expiryDate: in5Hours,
    pickupAddress: '12, Anna Nagar, Chennai, Tamil Nadu',
    pickupCoordinates: { lat: 13.0878, lng: 80.2170 },
    description: 'Fresh breakfast idlis with coconut chutney. Best consumed within 5 hours.',
    status: 'Available',
  });

  // 3. Expiring Soon Food - Available (Expiry in 12 hours)
  await Donation.create({
    donorId: donor2._id,
    foodName: 'Vegetable Biryani & Raita',
    category: 'Cooked Food',
    quantity: '60 plates',
    image: { url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/food/fish-vegetables.jpg', publicId: 'sample_biryani' },
    preparationDate: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    expiryDate: in12Hours,
    pickupAddress: '45, T. Nagar, Chennai, Tamil Nadu',
    pickupCoordinates: { lat: 13.0418, lng: 80.2341 },
    description: 'Wedding buffet surplus biryani with cooling raita.',
    status: 'Available',
  });

  // 4. Expired Food - Available in records (Expiry 3 hours ago) -> Hidden from NGO available, visible to Donor/Admin
  await Donation.create({
    donorId: donor1._id,
    foodName: 'Cut Fruit Platter',
    category: 'Fruits',
    quantity: '20 boxes',
    image: { url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/food/fish-vegetables.jpg', publicId: 'sample_fruits' },
    preparationDate: yesterday,
    expiryDate: threeHoursAgo,
    pickupAddress: '12, Anna Nagar, Chennai, Tamil Nadu',
    pickupCoordinates: { lat: 13.0878, lng: 80.2170 },
    description: 'Surplus morning fruit salads and slices.',
    status: 'Available',
  });

  // 5. Accepted by NGO1 (Expiring Soon - needs urgent pickup)
  await Donation.create({
    donorId: donor2._id,
    foodName: 'Wedding Meal Surplus',
    category: 'Cooked Food',
    quantity: '100 plates',
    image: { url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/food/fish-vegetables.jpg', publicId: 'sample3' },
    preparationDate: yesterday,
    expiryDate: in5Hours,
    pickupAddress: '45, T. Nagar, Chennai, Tamil Nadu',
    pickupCoordinates: { lat: 13.0418, lng: 80.2341 },
    description: 'Wedding ceremony surplus. Must be picked up promptly.',
    status: 'Accepted',
    acceptedBy: ngoUser1._id,
  });

  // 6. Pickup Assigned (volunteer1) - Fresh
  await Donation.create({
    donorId: donor2._id,
    foodName: 'Assorted Bakery Bread & Rolls',
    category: 'Bakery',
    quantity: '40 packs',
    image: { url: '/bread-jam.jpg', publicId: 'local_bread_jam' },
    preparationDate: yesterday,
    expiryDate: threeDaysLater,
    pickupAddress: '45, T. Nagar, Chennai, Tamil Nadu',
    pickupCoordinates: { lat: 13.0418, lng: 80.2341 },
    description: 'Packaged whole wheat bread and bakery buns.',
    status: 'Pickup Assigned',
    acceptedBy: ngoUser2._id,
    volunteerId: volUser1._id,
  });

  // 7. Completed - Delivered earlier
  const d7 = await Donation.create({
    donorId: donor2._id,
    foodName: 'Vegetables Mix',
    category: 'Raw Vegetables',
    quantity: '25 kg',
    image: { url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/food/fish-vegetables.jpg', publicId: 'sample6' },
    preparationDate: twoDaysAgo,
    expiryDate: yesterday,
    pickupAddress: '45, T. Nagar, Chennai, Tamil Nadu',
    pickupCoordinates: { lat: 13.0418, lng: 80.2341 },
    description: 'Fresh mixed vegetables - carrots, beans, and potatoes.',
    status: 'Completed',
    acceptedBy: ngoUser2._id,
    volunteerId: volUser1._id,
  });

  // Seed Notifications for Demo Users
  await Notification.create([
    {
      recipient: donor1._id,
      title: 'Food Expiring Soon ⚡',
      message: 'Urgent: Your donation "Idli and Chutney" (80 pieces) will expire soon. Please coordinate pickup.',
      type: 'EXPIRY_WARNING',
      isRead: false,
    },
    {
      recipient: donor1._id,
      title: 'Donation Listed Successfully 🌿',
      message: 'Your food donation "Rice and Sambar" (50 portions) is now live and visible to verified NGOs.',
      type: 'DONATION_CREATED',
      isRead: true,
    },
    {
      recipient: donor2._id,
      sender: ngoUser1._id,
      title: 'Donation Accepted 🎉',
      message: 'HelpHands NGO has accepted your donation "Wedding Meal Surplus". Volunteer pickup scheduled.',
      type: 'DONATION_ACCEPTED',
      isRead: false,
    },
    {
      recipient: volUser1._id,
      sender: ngoUser2._id,
      title: 'New Pickup Assigned 🚴',
      message: 'You have been assigned to pick up "Assorted Bakery Bread & Rolls" (40 packs) at 45, T. Nagar.',
      type: 'VOLUNTEER_ASSIGNED',
      isRead: false,
    },
    {
      recipient: ngoUser1._id,
      sender: donor1._id,
      title: 'New Surplus Food Available 🌿',
      message: 'New donation: "Rice and Sambar" (50 portions) is available in Anna Nagar, Chennai.',
      type: 'DONATION_CREATED',
      isRead: false,
    },
    {
      recipient: admin._id,
      title: 'System Activity Alert 📊',
      message: 'Active surplus food distribution running across Chennai. 7 donations currently logged.',
      type: 'GENERAL',
      isRead: false,
    },
  ]);

  console.log('\n🎉 Demo data seeded successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 LOGIN CREDENTIALS FOR DEMO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 ADMIN:     admin@foodshare.com     | Admin@123');
  console.log('🍽️  DONOR 1:  anand.restaurant@gmail.com | Donor@123');
  console.log('🍽️  DONOR 2:  srilakshmi.hall@gmail.com  | Donor@123');
  console.log('🏢 NGO 1:    helphands@gmail.com        | NGO@123');
  console.log('🏢 NGO 2:    feedindia@gmail.com         | NGO@123');
  console.log('🚴 VOL 1:    arjun.volunteer@gmail.com   | Vol@123');
  console.log('🚴 VOL 2:    divya.volunteer@gmail.com   | Vol@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
};

seedData().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
