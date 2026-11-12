export async function getNotifications(request, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const response = await request(`/notifications?${params.toString()}`);
  return response.data;
}

export async function getUnreadNotificationCount(request) {
  const response = await request('/notifications/unread-count');
  return response.data.count;
}

export async function markNotificationRead(request, notificationId) {
  const response = await request(`/notifications/${notificationId}/read`, { method: 'PATCH' });
  return response.data.notification;
}

export async function markAllNotificationsRead(request) {
  const response = await request('/notifications/read-all', { method: 'PATCH' });
  return response.data;
}

export async function deleteNotification(request, notificationId) {
  await request(`/notifications/${notificationId}`, { method: 'DELETE' });
}
