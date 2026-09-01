const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    availability: {
      type: String,
      enum: ['Available', 'Busy', 'Offline'],
      default: 'Available',
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ['Bicycle', 'Motorcycle', 'Car', 'Van', 'On Foot', 'Other'],
      default: 'Motorcycle',
    },
    completedDeliveries: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Volunteer', volunteerSchema);
