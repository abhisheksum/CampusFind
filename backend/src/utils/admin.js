function serializeAdminUser(user) {
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

function serializeActivity(activity) {
  return {
    id: activity._id.toString(),
    actor: activity.actorId
      ? { id: activity.actorId._id.toString(), name: activity.actorId.name, role: activity.actorId.role }
      : null,
    action: activity.action,
    entityType: activity.entityType,
    entityId: activity.entityId.toString(),
    metadata: activity.metadata || {},
    createdAt: activity.createdAt
  };
}

module.exports = { serializeAdminUser, serializeActivity };
