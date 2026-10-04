const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    foodName: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      maxlength: [200, 'Food name cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Cooked Food', 'Raw Vegetables', 'Fruits', 'Packaged Food', 'Bakery', 'Dairy', 'Beverages', 'Other'],
    },
    quantity: {
      type: String,
      required: [true, 'Quantity is required'],
      trim: true,
    },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    preparationDate: {
      type: Date,
      required: [true, 'Preparation date is required'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    pickupAddress: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true,
    },
    pickupCoordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: [
        'Available',
        'Accepted',
        'Pickup Assigned',
        'Picked Up',
        'Delivered',
        'Completed',
        'Cancelled',
      ],
      default: 'Available',
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        message: { type: String, default: '' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        role: { type: String, default: '' },
      },
    ],
    qrDonationId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    qrCreatedAt: {
      type: Date,
      default: Date.now,
    },
    // Pickup OTP Handover Fields
    pickupOtpHash: { type: String, default: null },
    pickupOtpExpiresAt: { type: Date, default: null },
    pickupOtpAttempts: { type: Number, default: 0 },
    pickupOtpVerifiedAt: { type: Date, default: null },
    pickupOtpUsed: { type: Boolean, default: false },
    // Delivery OTP Handover Fields
    deliveryOtpHash: { type: String, default: null },
    deliveryOtpExpiresAt: { type: Date, default: null },
    deliveryOtpAttempts: { type: Number, default: 0 },
    deliveryOtpVerifiedAt: { type: Date, default: null },
    deliveryOtpUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
