import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { Shell } from '../components/Shell';
import { CalmBackground } from '../components/CalmBackground';
import { getStore, getNotificationsForUser, markNotificationRead } from '../store/data';
import { Notification } from '../shared/types';

export default function Notifications() {
  const navigate = useNavigate();
  const studentId = 'student-1';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const store = getStore();
    const userNotifications = getNotificationsForUser(studentId);
    userNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setNotifications(userNotifications);
    setLoading(false);
  }, []);

  // Group notifications by day
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dayLabel: string;
    if (date.toDateString() === today.toDateString()) {
      dayLabel = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dayLabel = 'Yesterday';
    } else {
      dayLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    if (!groups[dayLabel]) {
      groups[dayLabel] = [];
    }
    groups[dayLabel].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markNotificationRead(notification.id);
    
    // Navigate to complaint if it has a complaintId in metadata
    if (notification.metadata?.complaintId) {
      navigate(`/student/complaint/${notification.metadata.complaintId}`);
    }
    
    // Update local state
    setNotifications(notifications.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    ));
  };

  return (
    <>
      <CalmBackground />
      <Shell unreadCount={notifications.filter(n => !n.read).length}>
        <div className="relative z-10">
          <div className="eyebrow eyebrow-ember mb-2">Notifications</div>
          <h1 className="display display-lg mb-8">Stay informed</h1>

          {loading ? (
            // Skeleton
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-ink-2/50 border border-line rounded-xl p-6 animate-pulse">
                  <div className="h-4 bg-line rounded w-3/4 mb-2" />
                  <div className="h-3 bg-line rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            // Empty state
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-ink-2 border border-line rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-muted" />
              </div>
              <h3 className="text-xl text-bone mb-2">No notifications yet</h3>
              <p className="text-bone-dim">
                You'll receive updates about your complaints here.
              </p>
            </div>
          ) : (
            // Grouped notifications
            <div className="space-y-8">
              {Object.entries(groupedNotifications).map(([dayLabel, dayNotifications]) => (
                <div key={dayLabel}>
                  <h2 className="text-sm text-bone-dim uppercase tracking-wider mb-4">{dayLabel}</h2>
                  <div className="space-y-2">
                    {dayNotifications.map((notification, idx) => (
                      <motion.button
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left bg-ink-2/50 border rounded-xl p-6 transition-all hover:bg-ink-2/70 ${
                          notification.read ? 'border-line' : 'border-ember/30 bg-ember/5'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Unread dot */}
                          {!notification.read && (
                            <div className="w-2 h-2 bg-ember rounded-full shrink-0 mt-2" />
                          )}

                          {/* Content */}
                          <div className="flex-1">
                            <p className={`text-sm mb-1 ${notification.read ? 'text-bone-dim' : 'text-bone font-medium'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted">
                              {new Date(notification.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Shell>
    </>
  );
}
