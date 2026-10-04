const mongoose = require('mongoose');

const proofOfDeliverySchema = new mongoose.Schema(
  {
    podId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
      unique: true,
    },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deliveredAt: {
      type: Date,
      default: Date.now,
    },
    receiverName: {
      type: String,
      trim: true,
      default: '',
    },
    deliveryPhoto: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    deliveryLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      address: { type: String, default: '' },
    },
    volunteerConfirmed: {
      type: Boolean,
      default: true,
    },
    ngoConfirmed: {
      type: Boolean,
      default: false,
    },
    ngoConfirmedAt: {
      type: Date,
      default: null,
    },
    ngoConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['Submitted', 'Confirmed'],
      default: 'Submitted',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProofOfDelivery', proofOfDeliverySchema);
