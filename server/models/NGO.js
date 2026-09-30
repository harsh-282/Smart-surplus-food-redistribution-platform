const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    organizationName: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    // Enhanced Fields for Smart Matching
    acceptedCategories: {
      type: [String],
      default: ['All'],
    },
    servingCapacity: {
      type: Number,
      default: 100, // Estimated max portions/kg the NGO can handle per batch
    },
    serviceArea: {
      type: String,
      trim: true,
      default: '',
    },
    locationCoordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NGO', ngoSchema);
