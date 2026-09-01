require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Donation = require('../models/Donation');
const NGO = require('../models/NGO');
const Volunteer = require('../models/Volunteer');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URL, { dbName: 'smart_food_redistribution' });
  console.log('✅ Connected to MongoDB');
};

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Donation.deleteMany({});
  await NGO.deleteMany({});
  await Volunteer.deleteMany({});
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
  });

  const donor2 = await User.create({
    name: 'Sri Lakshmi Marriage Hall',
    email: 'srilakshmi.hall@gmail.com',
    password: 'Donor@123',
    phone: '9876543211',
    role: 'donor',
    address: '45, T. Nagar, Chennai, Tamil Nadu',
  });

  // Create NGO Users
  const ngoUser1 = await User.create({
    name: 'HelpHands NGO',
    email: 'helphands@gmail.com',
    password: 'NGO@123',
    phone: '9123456789',
    role: 'ngo',
    address: '23, Velachery, Chennai, Tamil Nadu',
  });

  const ngoUser2 = await User.create({
    name: 'FeedIndia Foundation',
    email: 'feedindia@gmail.com',
    password: 'NGO@123',
    phone: '9123456788',
    role: 'ngo',
    address: '78, Tambaram, Chennai, Tamil Nadu',
  });

  // Create NGO Profiles
  await NGO.create({
    userId: ngoUser1._id,
    organizationName: 'HelpHands NGO',
    contactPerson: 'Yasotha',
    phone: '9123456789',
    address: '23, Velachery, Chennai, Tamil Nadu',
    description: 'We work to eliminate hunger by redistributing surplus food to street children and homeless communities.',
    registrationNumber: 'NGO-TN-2019-4521',
  });

  await NGO.create({
    userId: ngoUser2._id,
    organizationName: 'FeedIndia Foundation',
    contactPerson: 'Arathi',
    phone: '9123456788',
    address: '78, Tambaram, Chennai, Tamil Nadu',
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
  });

  const volUser2 = await User.create({
    name: 'Divya',
    email: 'divya.volunteer@gmail.com',
    password: 'Vol@123',
    phone: '9988776644',
    role: 'volunteer',
    address: '34, Mylapore, Chennai, Tamil Nadu',
  });

  // Create Volunteer Profiles
  await Volunteer.create({
    userId: volUser1._id,
    phone: '9988776655',
    address: '15, Adyar, Chennai, Tamil Nadu',
    vehicleType: 'Motorcycle',
    availability: 'Available',
    completedDeliveries: 12,
  });

  await Volunteer.create({
    userId: volUser2._id,
    phone: '9988776644',
    address: '34, Mylapore, Chennai, Tamil Nadu',
    vehicleType: 'Car',
    availability: 'Available',
    completedDeliveries: 7,
  });

  // Donation dates helper
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(now); dayAfter.setDate(dayAfter.getDate() + 2);
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);

  // Donation 1 - Available
  await Donation.create({
    donorId: donor1._id,
    foodName: 'Rice and Sambar',
    category: 'Cooked Food',
    quantity: '50 portions',
    image: { url: '/rice-sambar.jpg', publicId: 'local_rice_sambar' },
    preparationDate: now,
    expiryDate: tomorrow,
    pickupAddress: '12, Anna Nagar, Chennai, Tamil Nadu',
    description: 'Freshly prepared rice, sambar and vegetables. Available for immediate pickup.',
    status: 'Available',
  });

  // Donation 2 - Available
  await Donation.create({
    donorId: donor1._id,
    foodName: 'Idli and Chutney',
    category: 'Cooked Food',
    quantity: '80 pieces',
    image: { url: '/idli-chutney.jpg', publicId: 'local_idli_chutney' },
    preparationDate: now,
    expiryDate: tomorrow,
    pickupAddress: '12, Anna Nagar, Chennai, Tamil Nadu',
    description: 'Morning breakfast idlis with coconut chutney.',
    status: 'Available',
  });

  // Donation 3 - Accepted by NGO1
  const d3 = await Donation.create({
    donorId: donor2._id,
    foodName: 'Biriyani',
    category: 'Cooked Food',
    quantity: '100 plates',
    image: { url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/food/fish-vegetables.jpg', publicId: 'sample3' },
    preparationDate: yesterday,
    expiryDate: now,
    pickupAddress: '45, T. Nagar, Chennai, Tamil Nadu',
    description: 'Wedding ceremony surplus biriyani. Must be picked up within 2 hours.',
    status: 'Accepted',
    acceptedBy: ngoUser1._id,
  });

  // Donation 4 - Pickup Assigned (volunteer1)
  await Donation.create({
    donorId: donor2._id,
    foodName: 'Fruit Salad',
    category: 'Fruits',
    quantity: '30 kg',
    image: { url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/food/fish-vegetables.jpg', publicId: 'sample4' },
    preparationDate: yesterday,
    expiryDate: tomorrow,
    pickupAddress: '45, T. Nagar, Chennai, Tamil Nadu',
    description: 'Assorted fresh fruits from the wedding ceremony.',
    status: 'Pickup Assigned',
    acceptedBy: ngoUser2._id,
    volunteerId: volUser1._id,
  });

  // Donation 5 - Picked Up
  await Donation.create({
    donorId: donor1._id,
    foodName: 'Bread and Jam',
    category: 'Bakery',
    quantity: '60 packs',
    image: { url: '/bread-jam.jpg', publicId: 'local_bread_jam' },
    preparationDate: yesterday,
    expiryDate: dayAfter,
    pickupAddress: '12, Anna Nagar, Chennai, Tamil Nadu',
    description: 'Factory surplus bread packs.',
    status: 'Picked Up',
    acceptedBy: ngoUser1._id,
    volunteerId: volUser2._id,
  });

  // Donation 6 - Completed
  await Donation.create({
    donorId: donor2._id,
    foodName: 'Vegetables Mix',
    category: 'Raw Vegetables',
    quantity: '25 kg',
    image: { url: 'https://res.cloudinary.com/demo/image/upload/v1/samples/food/fish-vegetables.jpg', publicId: 'sample6' },
    preparationDate: yesterday,
    expiryDate: dayAfter,
    pickupAddress: '45, T. Nagar, Chennai, Tamil Nadu',
    description: 'Fresh mixed vegetables - carrots, beans, and potatoes.',
    status: 'Completed',
    acceptedBy: ngoUser2._id,
    volunteerId: volUser1._id,
  });

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
