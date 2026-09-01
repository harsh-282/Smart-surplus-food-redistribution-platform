const User = require('../models/User');
const Donation = require('../models/Donation');
const NGO = require('../models/NGO');
const Volunteer = require('../models/Volunteer');

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
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

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
    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    );
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }
    res.status(200).json({ success: true, message: 'Donation cancelled by admin.', donation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats, getAllUsers, deleteUser, toggleUserStatus, getAllDonations, adminCancelDonation };
