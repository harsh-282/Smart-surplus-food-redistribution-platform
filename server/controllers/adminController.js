const User = require('../models/User');
const Donation = require('../models/Donation');
const NGO = require('../models/NGO');
const Volunteer = require('../models/Volunteer');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
const getStats = async (req, res) => {
  try {
    const [
      totalUsers, totalDonors, totalNGOs, totalVolunteers,
      totalDonations, availableDonations, completedDonations, cancelledDonations,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'ngo' }),
      User.countDocuments({ role: 'volunteer' }),
      Donation.countDocuments(),
      Donation.countDocuments({ status: 'Available' }),
      Donation.countDocuments({ status: 'Completed' }),
      Donation.countDocuments({ status: 'Cancelled' }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers, totalDonors, totalNGOs, totalVolunteers,
        totalDonations, availableDonations, completedDonations, cancelledDonations,
        activeDonations: totalDonations - completedDonations - cancelledDonations,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : { role: { $ne: 'admin' } };
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete/deactivate a user
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin account.' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle
// @access  Admin
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all donations (admin)
// @route   GET /api/admin/donations
// @access  Admin
const getAllDonations = async (req, res) => {
  try {
    const { status, category, expiryStatus } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    if (expiryStatus) {
      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      if (expiryStatus === 'Fresh') {
        filter.expiryDate = { $gt: next24h };
      } else if (expiryStatus === 'Expiring Soon') {
        filter.expiryDate = { $gt: now, $lte: next24h };
      } else if (expiryStatus === 'Expired') {
        filter.expiryDate = { $lte: now };
      }
    }

    const donations = await Donation.find(filter)
      .populate('donorId', 'name email phone')
      .populate('acceptedBy', 'name email phone')
      .populate('volunteerId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: donations.length, donations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin cancel a donation
// @route   PUT /api/admin/donations/:id/cancel
// @access  Admin
const adminCancelDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    donation.status = 'Cancelled';
    await donation.save();

    // 1. Notify donor
    if (donation.donorId) {
      await createNotification({
        recipient: donation.donorId,
        sender: req.user._id,
        title: 'Donation Cancelled by Admin ⚠️',
        message: `Your food donation "${donation.foodName}" has been cancelled by an administrator.`,
        type: 'STATUS_CHANGED',
        donationId: donation._id,
        metadata: { foodName: donation.foodName, status: 'Cancelled' },
      });
    }

    // 2. Notify NGO if accepted
    if (donation.acceptedBy) {
      await createNotification({
        recipient: donation.acceptedBy,
        sender: req.user._id,
        title: 'Donation Cancelled by Admin ⚠️',
        message: `Donation "${donation.foodName}" was cancelled by an administrator.`,
        type: 'STATUS_CHANGED',
        donationId: donation._id,
        metadata: { foodName: donation.foodName, status: 'Cancelled' },
      });
    }

    // 3. Notify Volunteer if assigned
    if (donation.volunteerId) {
      await createNotification({
        recipient: donation.volunteerId,
        sender: req.user._id,
        title: 'Delivery Task Cancelled ⚠️',
        message: `Delivery assignment for "${donation.foodName}" was cancelled by an administrator.`,
        type: 'STATUS_CHANGED',
        donationId: donation._id,
        metadata: { foodName: donation.foodName, status: 'Cancelled' },
      });
    }

    res.status(200).json({ success: true, message: 'Donation cancelled by admin.', donation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed admin analytics & charts data
// @route   GET /api/admin/analytics
// @access  Admin
const getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalDonors,
      totalNGOs,
      totalVolunteers,
      totalDonations,
      availableDonations,
      acceptedDonations,
      completedDeliveries,
      expiredDonations,
      nearExpiryDonations,
      statusAggregate,
      categoryAggregate,
      monthlyAggregate,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'ngo' }),
      User.countDocuments({ role: 'volunteer' }),
      Donation.countDocuments(),
      Donation.countDocuments({ status: 'Available' }),
      Donation.countDocuments({ status: 'Accepted' }),
      Donation.countDocuments({ status: 'Completed' }),
      Donation.countDocuments({
        $or: [{ status: 'Expired' }, { expiryDate: { $lte: now } }],
      }),
      Donation.countDocuments({
        expiryDate: { $gt: now, $lte: next24h },
        status: { $nin: ['Completed', 'Cancelled', 'Expired'] },
      }),
      Donation.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Donation.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Donation.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
            },
            expired: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$status', 'Expired'] },
                      { $lte: ['$expiryDate', now] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    // Format status distribution ensuring standard keys exist
    const statusMap = {
      Available: 0,
      Accepted: 0,
      'In Transit': 0,
      Completed: 0,
      Cancelled: 0,
      Expired: 0,
    };
    statusAggregate.forEach((item) => {
      if (item._id) statusMap[item._id] = item.count;
    });

    const statusDistribution = Object.keys(statusMap).map((key) => ({
      status: key,
      count: statusMap[key],
    }));

    // Format categories
    const categoryDistribution = categoryAggregate.map((item) => ({
      category: item._id || 'Uncategorized',
      count: item.count,
    }));

    // Format monthly trend (last 6 months template)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyStats = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;
      const label = `${monthNames[mo - 1]} ${yr}`;

      const found = monthlyAggregate.find(
        (m) => m._id.year === yr && m._id.month === mo
      );

      monthlyStats.push({
        label,
        year: yr,
        month: mo,
        total: found ? found.total : 0,
        completed: found ? found.completed : 0,
        expired: found ? found.expired : 0,
      });
    }

    // Success vs Expiry metrics
    const completedVsExpired = {
      completed: completedDeliveries,
      expired: expiredDonations,
      successRate:
        completedDeliveries + expiredDonations > 0
          ? Math.round(
              (completedDeliveries / (completedDeliveries + expiredDonations)) *
                100
            )
          : 0,
    };

    // Calculate Smart Priority Distribution for active available food donations
    const activeDonations = await Donation.find({
      status: 'Available',
      expiryDate: { $gt: now },
    });

    let priorityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, NORMAL: 0 };
    activeDonations.forEach((d) => {
      const hoursLeft = (new Date(d.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60);
      let expScore = hoursLeft < 6 ? 40 : hoursLeft < 12 ? 32 : hoursLeft < 24 ? 24 : hoursLeft < 48 ? 14 : 5;

      let qtyNum = 10;
      if (d.quantity) {
        const m = String(d.quantity).match(/\d+(\.\d+)?/);
        if (m) qtyNum = parseFloat(m[0]) || 10;
      }
      let qtyScore = qtyNum >= 50 ? 15 : qtyNum >= 20 ? 11 : qtyNum >= 10 ? 7 : 4;

      let catScore = d.category === 'Cooked Food' ? 10 : (d.category === 'Dairy' || d.category === 'Bakery') ? 8 : (d.category === 'Fruits' || d.category === 'Raw Vegetables') ? 6 : 4;

      let score = Math.min(100, Math.round(expScore + qtyScore + catScore + 15));
      if (score >= 90) priorityCounts.CRITICAL++;
      else if (score >= 70) priorityCounts.HIGH++;
      else if (score >= 40) priorityCounts.MEDIUM++;
      else priorityCounts.NORMAL++;
    });

    const priorityDistribution = [
      { level: 'CRITICAL', label: '🔴 Critical Priority', count: priorityCounts.CRITICAL, color: '#dc2626' },
      { level: 'HIGH', label: '🟠 High Priority', count: priorityCounts.HIGH, color: '#ea580c' },
      { level: 'MEDIUM', label: '🟡 Medium Priority', count: priorityCounts.MEDIUM, color: '#d97706' },
      { level: 'NORMAL', label: '🟢 Normal Priority', count: priorityCounts.NORMAL, color: '#16a34a' },
    ];

    res.status(200).json({
      success: true,
      kpis: {
        totalUsers,
        totalDonors,
        totalNGOs,
        totalVolunteers,
        totalDonations,
        availableDonations,
        acceptedDonations,
        completedDeliveries,
        expiredDonations,
        nearExpiryDonations,
        criticalPriority: priorityCounts.CRITICAL,
        highPriority: priorityCounts.HIGH,
        mediumPriority: priorityCounts.MEDIUM,
        normalPriority: priorityCounts.NORMAL,
      },
      charts: {
        statusDistribution,
        categoryDistribution,
        priorityDistribution,
        monthlyStats,
        completedVsExpired,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get NGO & Volunteer verification requests
// @route   GET /api/admin/verification-requests
// @access  Admin
const getVerificationRequests = async (req, res) => {
  try {
    const { role, status, search } = req.query;

    let filter = { role: { $in: ['ngo', 'volunteer'] } };
    if (role && ['ngo', 'volunteer'].includes(role)) {
      filter.role = role;
    }
    if (status && ['Pending', 'Verified', 'Rejected', 'Suspended'].includes(status)) {
      filter.verificationStatus = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ updatedAt: -1 });

    const [pendingNGOs, pendingVolunteers, verifiedNGOs, verifiedVolunteers, rejectedCount, suspendedCount] = await Promise.all([
      User.countDocuments({ role: 'ngo', verificationStatus: 'Pending' }),
      User.countDocuments({ role: 'volunteer', verificationStatus: 'Pending' }),
      User.countDocuments({ role: 'ngo', verificationStatus: 'Verified' }),
      User.countDocuments({ role: 'volunteer', verificationStatus: 'Verified' }),
      User.countDocuments({ role: { $in: ['ngo', 'volunteer'] }, verificationStatus: 'Rejected' }),
      User.countDocuments({ role: { $in: ['ngo', 'volunteer'] }, verificationStatus: 'Suspended' }),
    ]);

    // Populate role-specific profiles
    const populatedRequests = await Promise.all(
      users.map(async (u) => {
        const userObj = u.toObject();
        if (u.role === 'ngo') {
          userObj.ngoProfile = await NGO.findOne({ userId: u._id });
        } else if (u.role === 'volunteer') {
          userObj.volunteerProfile = await Volunteer.findOne({ userId: u._id });
        }
        return userObj;
      })
    );

    res.status(200).json({
      success: true,
      stats: {
        pendingNGOs,
        pendingVolunteers,
        verifiedNGOs,
        verifiedVolunteers,
        rejectedCount,
        suspendedCount,
      },
      requests: populatedRequests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed user verification profile
// @route   GET /api/admin/verification-details/:id
// @access  Admin
const getUserVerificationDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userObj = user.toObject();
    if (user.role === 'ngo') {
      userObj.ngoProfile = await NGO.findOne({ userId: user._id });
    } else if (user.role === 'volunteer') {
      userObj.volunteerProfile = await Volunteer.findOne({ userId: user._id });
    }

    res.status(200).json({ success: true, user: userObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user verification status (Approve, Reject, Suspend)
// @route   PUT /api/admin/verify-user/:id
// @access  Admin
const updateUserVerificationStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const allowedStatuses = ['Pending', 'Verified', 'Rejected', 'Suspended'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin verification status cannot be altered.' });
    }

    const oldStatus = user.verificationStatus || 'Pending';
    user.verificationStatus = status;
    user.verificationReviewedBy = req.user._id;

    if (status === 'Verified') {
      user.verificationVerifiedAt = new Date();
      user.verificationRejectionReason = '';
    } else if (status === 'Rejected') {
      user.verificationRejectedAt = new Date();
      user.verificationRejectionReason = reason || 'Profile information is incomplete or does not meet verification requirements.';
    } else if (status === 'Suspended') {
      user.verificationSuspendedAt = new Date();
    } else if (status === 'Pending') {
      user.verificationSubmittedAt = new Date();
    }

    await user.save();

    // Dispatch Notifications to User
    const roleTitle = user.role === 'ngo' ? 'NGO' : 'Volunteer';
    if (status === 'Verified') {
      await createNotification({
        recipient: user._id,
        sender: req.user._id,
        title: `${roleTitle} Account Verified! 🎉`,
        message: `Congratulations! Your ${roleTitle} account has been verified by administrators. You can now access all redistribution operations.`,
        type: 'GENERAL',
      });
    } else if (status === 'Rejected') {
      await createNotification({
        recipient: user._id,
        sender: req.user._id,
        title: `${roleTitle} Verification Not Approved ⚠️`,
        message: `Your ${roleTitle} account verification request was not approved. Reason: "${user.verificationRejectionReason}". Please update your profile and resubmit.`,
        type: 'GENERAL',
      });
    } else if (status === 'Suspended') {
      await createNotification({
        recipient: user._id,
        sender: req.user._id,
        title: `${roleTitle} Account Suspended ⚠️`,
        message: `Your ${roleTitle} account has been suspended by an administrator. Please contact support.`,
        type: 'GENERAL',
      });
    }

    res.status(200).json({
      success: true,
      message: `Account status updated from "${oldStatus}" to "${status}" successfully!`,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getAllUsers,
  deleteUser,
  toggleUserStatus,
  getAllDonations,
  adminCancelDonation,
  getAnalytics,
  getVerificationRequests,
  getUserVerificationDetails,
  updateUserVerificationStatus,
};

