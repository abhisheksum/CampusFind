function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    studentId: user.studentId,
    department: user.department,
    role: user.role,
    avatarUrl: user.avatarUrl || null,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

module.exports = { serializeUser };

