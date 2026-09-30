const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: [true, 'Donation ID is required'],
      index: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer ID is required'],
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default: '',
    },
    reviewerRole: {
      type: String,
      enum: ['donor', 'ngo', 'volunteer'],
      required: [true, 'Reviewer role is required'],
    },
  },
  { timestamps: true }
);

// Prevent duplicate feedback from the same reviewer for the same target user on the same donation transaction
feedbackSchema.index({ donationId: 1, reviewerId: 1, targetUserId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
