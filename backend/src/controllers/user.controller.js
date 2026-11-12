const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/errors');
const { User } = require('../models');
const authService = require('../services/auth.service');
const { serializeUser } = require('../utils/user');

const getProfile = asyncHandler(async (request, response) => {
  response.json({ success: true, data: { user: serializeUser(request.user) } });
});

const updateProfile = asyncHandler(async (request, response) => {
  const allowedFields = ['name', 'department', 'avatarUrl'];
  const updates = Object.fromEntries(
    allowedFields.filter((field) => request.body[field] !== undefined).map((field) => [
      field,
      typeof request.body[field] === 'string' ? request.body[field].trim() : request.body[field]
    ])
  );

  const user = await User.findByIdAndUpdate(request.user._id, { $set: updates }, {
    new: true,
    runValidators: true
  });

  response.json({ success: true, data: { user: serializeUser(user) } });
});

const changePassword = asyncHandler(async (request, response) => {
  await authService.changePassword(request.user._id, request.body);
  response.json({ success: true, data: { message: 'Password changed successfully.' } });
});

const deactivateAccount = asyncHandler(async (request, response) => {
  const user = await User.findByIdAndUpdate(
    request.user._id,
    {
      $set: { isActive: false, refreshTokenHash: null },
      $inc: { authVersion: 1, refreshTokenVersion: 1 }
    },
    { new: true }
  );

  if (!user) throw new AppError('User account was not found.', 404, 'USER_NOT_FOUND');
  response.status(204).send();
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount
};

