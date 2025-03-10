'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

export default function NotificationCenter() {
  const { notifications, fetchNotifications, markNotificationAsRead, clearNotifications } = useStore();

  useEffect(() => {
    fetchNotifications();
    // Rafraîchir les notifications toutes les minutes
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        className="relative p-2 text-gray-600 hover:text-gray-900"
        onClick={() => clearNotifications()}
      >
        <svg
          className="h-6 w-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {notifications.length > 0 && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => clearNotifications()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Tout marquer comme lu
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${notification.read ? 'bg-gray-50' : 'bg-white'}`}
                onClick={() => markNotificationAsRead(notification.id)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {!notification.read && (
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 