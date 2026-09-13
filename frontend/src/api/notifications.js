import axiosClient from './axiosClient';

export const fetchNotifications = () => axiosClient.get('/notifications').then((res) => res.data);

export const fetchUnreadNotificationCount = () =>
  axiosClient.get('/notifications/unread-count').then((res) => res.data);

export const markNotificationRead = (id) =>
  axiosClient.patch(`/notifications/${id}/read`).then((res) => res.data);

export const markAllNotificationsRead = () =>
  axiosClient.patch('/notifications/read-all').then((res) => res.data);
