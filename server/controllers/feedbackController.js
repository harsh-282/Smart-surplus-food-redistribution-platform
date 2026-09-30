const Feedback = require('../models/Feedback');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Submit rating and feedback for a completed donation
// @route   POST /api/feedback
// @access  Private (Donor, NGO, Volunteer involved in the donation)
const submitFeedback = async (req, res) => {
  try {
    const { donationId, targetUserId, rating, comment } = req.body;
    const reviewerId = req.user._id;
    const reviewerRole = req.user.role;

    if (!donationId) {
      return res.status(400).json({ success: false, message: 'Donation ID is required.' });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5 stars.' });
    }

    // 1. Fetch donation
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    // 2. CRITICAL RULE: Ratings/feedback are strictly prohibited before a donation is marked "Completed"
    if (donation.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Feedback and ratings are only allowed after a donation is officially marked Completed.',
      });
    }

    // 3. CRITICAL RULE: Verify reviewer involvement in this specific donation transaction
    const isDonor = donation.donorId && donation.donorId.toString() === reviewerId.toString();
    const isNGO = donation.acceptedBy && donation.acceptedBy.toString() === reviewerId.toString();
    const isVolunteer = donation.volunteerId && donation.volunteerId.toString() === reviewerId.toString();

    if (!isDonor && !isNGO && !isVolunteer) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only rate donations in which you were directly involved.',
      });
    }

    // 4. Validate targetUserId if provided (must be involved in the transaction as well)
    let validatedTarget = null;
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(400).json({ success: false, message: 'Target user does not exist.' });
      }

      const targetIsDonor = donation.donorId && donation.donorId.toString() === targetUserId.toString();
      const targetIsNGO = donation.acceptedBy && donation.acceptedBy.toString() === targetUserId.toString();
      const targetIsVolunteer = donation.volunteerId && donation.volunteerId.toString() === targetUserId.toString();

      if (!targetIsDonor && !targetIsNGO && !targetIsVolunteer) {
        return res.status(400).json({
          success: false,
          message: 'The target user was not involved in this donation transaction.',
        });
      }

      if (targetUserId.toString() === reviewerId.toString()) {
        return res.status(400).json({ success: false, message: 'You cannot rate yourself.' });
      }

      validatedTarget = targetUser._id;
    }

    // 5. CRITICAL RULE: Prevent duplicate feedback for the same transaction & target
    const existingFeedback = await Feedback.findOne({
      donationId,
      reviewerId,
      targetUserId: validatedTarget,
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this transaction.',
      });
    }

    // 6. Save feedback
    const newFeedback = await Feedback.create({
      donationId,
      reviewerId,
      targetUserId: validatedTarget,
      rating: numRating,
      comment: comment ? comment.trim() : '',
      reviewerRole,
    });

    const populatedFeedback = await Feedback.findById(newFeedback._id)
      .populate('reviewerId', 'name role')
      .populate('targetUserId', 'name role');

    // 7. Trigger Notification for Target User
    if (validatedTarget) {
      await createNotification({
        recipient: validatedTarget,
        sender: reviewerId,
        title: 'New Feedback Received ⭐',
        message: `${req.user.name} rated your service ${numRating}/5 stars for donation "${donation.foodName}".`,
        type: 'GENERAL',
        donationId: donation._id,
        metadata: { rating: numRating, foodName: donation.foodName },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been recorded.',
      feedback: populatedFeedback,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate feedback detected for this transaction.',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all feedback for a specific donation
// @route   GET /api/feedback/donation/:donationId
// @access  Private
const getDonationFeedback = async (req, res) => {
  try {
    const { donationId } = req.params;
    const feedbackList = await Feedback.find({ donationId })
      .populate('reviewerId', 'name role email')
      .populate('targetUserId', 'name role email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: feedbackList.length, feedbackList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get rating summary & feedback list for a user profile
// @route   GET /api/feedback/user/:userId
// @access  Private
const getUserRatingSummary = async (req, res) => {
  try {
    const { userId } = req.params;

    const feedbackList = await Feedback.find({ targetUserId: userId })
      .populate('reviewerId', 'name role')
      .populate('donationId', 'foodName category')
      .sort({ createdAt: -1 });

    const count = feedbackList.length;
    let averageRating = 0;
    let distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (count > 0) {
      const sum = feedbackList.reduce((acc, curr) => {
        distribution[curr.rating] = (distribution[curr.rating] || 0) + 1;
        return acc + curr.rating;
      }, 0);
      averageRating = Number((sum / count).toFixed(1));
    }

    res.status(200).json({
      success: true,
      summary: {
        userId,
        averageRating,
        ratingCount: count,
        distribution,
      },
      feedbackList,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get platform rating statistics for Admin
// @route   GET /api/feedback/admin/summary
// @access  Private (Admin only)
const getAdminFeedbackSummary = async (req, res) => {
  try {
    const allFeedback = await Feedback.find()
      .populate('reviewerId', 'name role email')
      .populate('targetUserId', 'name role email')
      .populate('donationId', 'foodName status')
      .sort({ createdAt: -1 });

    const totalRatings = allFeedback.length;
    let overallAverage = 0;
    let distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (totalRatings > 0) {
      const sum = allFeedback.reduce((acc, curr) => {
        distribution[curr.rating] = (distribution[curr.rating] || 0) + 1;
        return acc + curr.rating;
      }, 0);
      overallAverage = Number((sum / totalRatings).toFixed(1));
    }

    // Role-specific averages
    const donorFeedback = allFeedback.filter((f) => f.reviewerRole === 'donor');
    const ngoFeedback = allFeedback.filter((f) => f.reviewerRole === 'ngo');
    const volunteerFeedback = allFeedback.filter((f) => f.reviewerRole === 'volunteer');

    const calcAvg = (arr) => (arr.length ? Number((arr.reduce((a, b) => a + b.rating, 0) / arr.length).toFixed(1)) : 0);

    res.status(200).json({
      success: true,
      stats: {
        totalRatings,
        overallAverage,
        distribution,
        roleAverages: {
          donorAvg: calcAvg(donorFeedback),
          donorCount: donorFeedback.length,
          ngoAvg: calcAvg(ngoFeedback),
          ngoCount: ngoFeedback.length,
          volunteerAvg: calcAvg(volunteerFeedback),
          volunteerCount: volunteerFeedback.length,
        },
      },
      recentFeedback: allFeedback,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitFeedback,
  getDonationFeedback,
  getUserRatingSummary,
  getAdminFeedbackSummary,
};
