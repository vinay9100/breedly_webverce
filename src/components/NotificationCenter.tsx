import React, { useState, useEffect } from 'react';
import { Bell, X, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { farmerApi } from '../services/api';

interface Notification {
    id: number | string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'alert';
    created_at: string;
    is_read: boolean;
}

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    onUnreadChange?: (count: number) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, onUnreadChange }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    useEffect(() => {
        const unreadCount = notifications.filter(n => !n.is_read).length;
        if (onUnreadChange) onUnreadChange(unreadCount);
    }, [notifications, onUnreadChange]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const [notifRes, alertRes] = await Promise.all([
                farmerApi.getNotifications(),
                farmerApi.getAlerts()
            ]);

            const readAlerts = JSON.parse(localStorage.getItem('read_alerts') || '[]');

            const combined: Notification[] = [
                ...notifRes.data.map((n: any) => ({ ...n, type: n.type || 'info' })),
                ...alertRes.data.map((a: any) => ({
                    id: `alert-${a.id}`,
                    title: a.disease_name,
                    message: a.message,
                    type: 'alert',
                    created_at: a.created_at,
                    is_read: readAlerts.includes(`alert-${a.id}`)
                }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setNotifications(combined);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            // Mock data for demonstration if API fails
            setNotifications([
                { id: 1, title: 'Vaccination Due', message: 'FMD Vaccination for Holstein #21 is due in 2 days.', type: 'warning', created_at: new Date().toISOString(), is_read: false },
                { id: 2, title: 'Yield Milestone', message: 'Your herd reached a new weekly milk yield record!', type: 'success', created_at: new Date(Date.now() - 86400000).toISOString(), is_read: true },
                { id: 3, title: 'Outbreak Alert', message: 'Lumpy Skin Disease detected in 50km radius. Stay alert.', type: 'alert', created_at: new Date(Date.now() - 172800000).toISOString(), is_read: false }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: number | string) => {
        if (typeof id === 'number') {
            try {
                await farmerApi.markNotificationRead(id);
                setNotifications(notifications.map(n => n.id.toString() === id.toString() ? { ...n, is_read: true } : n));
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        } else {
            // Local read for alerts
            const readAlerts = JSON.parse(localStorage.getItem('read_alerts') || '[]');
            if (!readAlerts.includes(id)) {
                readAlerts.push(id);
                localStorage.setItem('read_alerts', JSON.stringify(readAlerts));
            }
            setNotifications(notifications.map(n => n.id.toString() === id.toString() ? { ...n, is_read: true } : n));
        }
    };

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => !n.is_read);
        for (const notif of unread) {
            await markAsRead(notif.id);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="notification-panel glass animate-fade-in" style={{
            position: 'fixed',
            top: '80px',
            right: '2.5rem',
            width: '400px',
            maxHeight: '600px',
            zIndex: 1000,
            borderRadius: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <header style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Bell size={20} color="var(--primary)" />
                    <h3 className="font-outfit" style={{ margin: 0 }}>Center Command</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {notifications.some(n => !n.is_read) && (
                        <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                            Mark All Read
                        </button>
                    )}
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {loading && notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>Syncing alerts...</div>
                ) : notifications.length > 0 ? (
                    notifications.map((notif) => (
                        <div
                            key={notif.id.toString()}
                            onClick={() => markAsRead(notif.id)}
                            style={{
                                padding: '1.25rem',
                                borderRadius: '1rem',
                                marginBottom: '0.75rem',
                                background: notif.is_read ? 'transparent' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${notif.is_read ? 'transparent' : 'var(--glass-border)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                position: 'relative'
                            }}
                            className="notif-item"
                        >
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: notif.type === 'alert' ? 'rgba(239, 68, 68, 0.1)' :
                                        notif.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                                            notif.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)'
                                }}>
                                    {notif.type === 'alert' && <AlertTriangle size={20} color="#ef4444" />}
                                    {notif.type === 'warning' && <Info size={20} color="#f59e0b" />}
                                    {notif.type === 'success' && <CheckCircle size={20} color="#10b981" />}
                                    {notif.type === 'info' && <Bell size={20} color="#6366f1" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{notif.title}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.4 }}>{notif.message}</p>
                                </div>
                            </div>
                            {!notif.is_read && (
                                <div style={{
                                    position: 'absolute',
                                    top: '1.25rem',
                                    left: '0.5rem',
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: 'var(--primary)'
                                }} />
                            )}
                        </div>
                    ))
                ) : (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                        <CheckCircle size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                        <p>All operations are nominal.</p>
                    </div>
                )}
            </div>

            <footer style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <button className="btn-outline" style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}>
                    View Archive
                </button>
            </footer>
        </div>
    );
};

export default NotificationCenter;
