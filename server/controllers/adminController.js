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
      },
      charts: {
        statusDistribution,
        categoryDistribution,
        monthlyStats,
        completedVsExpired,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats, getAllUsers, deleteUser, toggleUserStatus, getAllDonations, adminCancelDonation, getAnalytics };

