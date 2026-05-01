import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Camera, History, Shield,
    Calendar, BarChart2, Activity, User,
    LogOut, Bell, Plus,
    TrendingUp, Phone, Mail, Download, Droplets, Info, ExternalLink, CheckCircle, AlertCircle
} from 'lucide-react';
import {
    XAxis, YAxis, Tooltip,
    ResponsiveContainer, AreaChart, Area,
    CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { farmerApi, BASE_URL } from '../services/api';
import NotificationCenter from './NotificationCenter';
import BreedComparison from './BreedComparison';
import Timetable from './Timetable';
import VaccinationSchedule from './VaccinationSchedule';

const chartData = [
    { name: 'Mon', yield: 40, fat: 3.8 },
    { name: 'Tue', yield: 45, fat: 4.2 },
    { name: 'Wed', yield: 42, fat: 4.0 },
    { name: 'Thu', yield: 48, fat: 4.5 },
    { name: 'Fri', yield: 46, fat: 4.3 },
    { name: 'Sat', yield: 50, fat: 4.6 },
    { name: 'Sun', yield: 44, fat: 4.1 },
];

interface FarmerDashboardProps {
    onLogout: () => void;
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [detections, setDetections] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [earTag, setEarTag] = useState('');
    const [userProfile, setUserProfile] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [profileFormData, setProfileFormData] = useState({
        full_name: '',
        phone_number: '',
        email: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [profileRes, detectionsRes, activityRes, analyticsRes] = await Promise.all([
                farmerApi.getProfile(),
                farmerApi.getDetections(),
                farmerApi.getRecentActivity(),
                farmerApi.getAnalytics('All')
            ]);
            setUserProfile(profileRes.data);
            setDetections(detectionsRes.data);
            setRecentActivity(activityRes.data);
            setAnalytics(analyticsRes.data);

            setProfileFormData({
                full_name: profileRes.data.full_name || '',
                phone_number: profileRes.data.phone_number || '',
                email: profileRes.data.email || ''
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setScanResult(null);
        }
    };

    const handleScan = async () => {
        if (!selectedFile) return;
        setIsScanning(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (earTag) formData.append('ear_tag', earTag);

        try {
            const response = await farmerApi.predictAnimal(formData);
            setScanResult(response.data);

            if (!response.data.not_cattle) {
                const [detRes, actRes] = await Promise.all([
                    farmerApi.getDetections(),
                    farmerApi.getRecentActivity()
                ]);
                setDetections(detRes.data);
                setRecentActivity(actRes.data);
            }
        } catch (error) {
            console.error('Scan failed:', error);
            alert('AI Scan failed. Please check backend connection.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleHistoryClick = (det: any) => {
        setScanResult(det);
        setActiveTab('scan');
        setSelectedFile(null);
    };

    const [showAbout, setShowAbout] = useState(false);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!profileFormData.full_name || profileFormData.full_name.length < 3) {
            return alert('Full name must be at least 3 characters');
        }
        if (profileFormData.phone_number && !/^\d{10}$/.test(profileFormData.phone_number)) {
            return alert('Phone number must be exactly 10 digits');
        }

        setIsUpdating(true);
        try {
            const response = await farmerApi.updateProfile(profileFormData);
            setUserProfile(response.data);
            alert('Profile updated successfully!');
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);

            setIsUpdating(true);
            try {
                const response = await farmerApi.uploadProfilePhoto(formData);
                setUserProfile(response.data);
                alert('Profile photo updated!');
            } catch (error: any) {
                alert(error.response?.data?.detail || 'Failed to upload photo');
            } finally {
                setIsUpdating(false);
            }
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you absolutely sure? This will delete all your data permanently.')) {
            try {
                await farmerApi.deleteAccount?.() || alert('Backend delete endpoint not implemented in service');
                onLogout();
            } catch (error) {
                alert('Failed to delete account');
            }
        }
    };

    const [unreadCount, setUnreadCount] = useState(0);

    const getYieldChartData = () => {
        if (!analytics?.bar_chart || analytics.bar_chart.length === 0) {
            return chartData;
        }

        const labels = analytics.bar_chart.map((d: any) => ({
            date: d.date,
            name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
        }));

        const categories = [...new Set(detections.filter(d => d.animal_ear_tag || d.breed_name).map(d => d.animal_ear_tag || d.breed_name))].slice(0, 3);

        return labels.map((label: any) => {
            const entry: any = { name: label.name };
            categories.forEach(cat => {
                // Precise day check: animal_ear_tag or breed matching, and date substring match
                const dayDetections = detections.filter(d => {
                    const dDate = d.detected_at.split('T')[0];
                    return (d.animal_ear_tag === cat || (d.breed_name === cat && !d.animal_ear_tag)) && dDate === label.date;
                });

                if (dayDetections.length > 0) {
                    entry[cat] = dayDetections[0].yield_estimate;
                } else {
                    entry[cat] = 0; // Explicitly set to 0 to prevent weird chart behavior
                }
            });
            // Original yield from backend (Sum/Avg)
            entry.yield = analytics.bar_chart.find((b: any) => b.date === label.date)?.avg_yield || 0;
            return entry;
        });
    };

    const exportToCSV = () => {
        if (detections.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = ["ID", "Ear Tag", "Breed", "Confidence", "Yield Estimate", "Fat Content", "Timestamp"];
        const rows = detections.map(det => [
            det.id,
            det.animal_ear_tag || 'N/A',
            det.breed_name,
            `${Math.round(det.confidence_score)}%`,
            det.yield_estimate || '0',
            det.fat_content || 'N/A',
            new Date(det.detected_at).toLocaleString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `breed_detection_history_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const yieldData = getYieldChartData();
    const categories = detections.length > 0 ? [...new Set(detections.map(d => d.animal_ear_tag || d.breed_name))].slice(0, 3) : [];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
            <motion.aside
                initial={{ x: -250 }}
                animate={{ x: 0 }}
                className="sidebar"
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={18} color="white" />
                    </div>
                    <span className="font-outfit" style={{ fontSize: '1.25rem', fontWeight: 700 }}>BreedSure<span style={{ color: 'var(--primary)' }}>AI</span></span>
                </div>

                <nav style={{ flex: 1 }}>
                    {[
                        { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
                        { id: 'scan', icon: Camera, label: 'AI Scanner' },
                        { id: 'history', icon: History, label: 'Scan History' },
                        { id: 'vaccination', icon: Shield, label: 'Vaccinations' },
                        { id: 'timetable', icon: Calendar, label: 'Care Plan' },
                        { id: 'comparison', icon: BarChart2, label: 'Comparisons' },
                        { id: 'analytics', icon: Activity, label: 'Milk Analytics' },
                        { id: 'settings', icon: User, label: 'Profile' }
                    ].map((item) => (
                        <motion.button
                            key={item.id}
                            whileHover={{ x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab(item.id)}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                            style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                            <item.icon size={20} /> {item.label}
                        </motion.button>
                    ))}
                </nav>

                <button onClick={onLogout} className="nav-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 'auto', color: '#ef4444' }}>
                    <LogOut size={20} /> Sign Out
                </button>
            </motion.aside>

            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <h1 className="font-outfit" style={{ fontSize: '2rem' }}>Welcome, {userProfile?.full_name || 'Farmer'}</h1>
                        <p style={{ color: 'var(--text-dim)' }}>Here is what's happening with your herd today.</p>
                    </motion.div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowNotifications(!showNotifications)}
                            style={{ position: 'relative', width: '45px', height: '45px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showNotifications ? 'var(--primary)' : 'var(--text-dim)', cursor: 'pointer' }}
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 800, width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--background)' }}>
                                    {unreadCount}
                                </span>
                            )}
                        </motion.button>
                        <NotificationCenter isOpen={showNotifications} onClose={() => setShowNotifications(false)} onUnreadChange={setUnreadCount} />

                        <div style={{ width: '45px', height: '45px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--secondary)' }}>
                            <img src={userProfile?.profile_photo ? `${BASE_URL}/${userProfile.profile_photo}?t=${Date.now()}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.full_name || 'Farmer'}`} alt="Profile" style={{ width: '100%', height: '100%' }} />
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'dashboard' && (
                            <div>
                                <div className="stat-grid">
                                    <motion.div whileHover={{ y: -5 }} className="glass-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <div style={{ color: 'var(--secondary)' }}>Total Cattle</div>
                                            <Plus size={20} color="var(--text-dim)" />
                                        </div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{analytics?.total_animals || detections.length}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                            <CheckCircle size={14} /> Official Records
                                        </div>
                                    </motion.div>
                                    <motion.div whileHover={{ y: -5 }} className="glass-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <div style={{ color: 'var(--primary)' }}>Avg Monthly Yield</div>
                                            <Droplets size={20} color="var(--text-dim)" />
                                        </div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{Math.round(analytics?.average_yield || 0)} L</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                            <TrendingUp size={14} /> Based on AI estimates
                                        </div>
                                    </motion.div>
                                    <motion.div whileHover={{ y: -5 }} className="glass-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <div style={{ color: '#f59e0b' }}>AI Confidence</div>
                                            <Info size={20} color="var(--text-dim)" />
                                        </div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{Math.round(analytics?.average_accuracy || 0)}%</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                            Precision metrics
                                        </div>
                                    </motion.div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                                    <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <h3 style={{ margin: 0 }}>Yield Overview</h3>
                                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                                {categories.map((cat, i) => (
                                                    <span key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <div style={{ width: '8px', height: '8px', background: i === 0 ? 'var(--primary)' : i === 1 ? 'var(--secondary)' : '#f59e0b', borderRadius: '50%' }} />
                                                        {cat}
                                                    </span>
                                                ))}
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <div style={{ width: '8px', height: '8px', background: 'var(--text)', borderRadius: '50%', opacity: 0.5 }} />
                                                    Cumulative Total
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ width: '100%', height: '300px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={yieldData}>
                                                    <defs>
                                                        <linearGradient id="colorCat0" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                                                        </linearGradient>
                                                        <linearGradient id="colorCat1" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0.1} />
                                                        </linearGradient>
                                                        <linearGradient id="colorCat2" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                    <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} />
                                                    <Tooltip
                                                        contentStyle={{ background: 'var(--background)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                                                    />
                                                    {categories.map((cat, i) => (
                                                        <Area
                                                            key={cat}
                                                            type="monotone"
                                                            dataKey={cat}
                                                            stackId="1"
                                                            stroke={i === 0 ? 'var(--primary)' : i === 1 ? 'var(--secondary)' : '#f59e0b'}
                                                            strokeWidth={2}
                                                            fill={`url(#colorCat${i})`}
                                                            name={cat}
                                                        />
                                                    ))}
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="glass-card">
                                        <h3 style={{ marginBottom: '1.5rem' }}>Recent Activity</h3>
                                        <div className="flex flex-col gap-4">
                                            {recentActivity.slice(0, 3).map((item, i) => (
                                                <div key={i} className="glass" style={{ padding: '1rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => {
                                                    if (item.title.includes('Scan') || item.title.includes('Detection')) {
                                                        setActiveTab('history');
                                                    }
                                                }}>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{item.subtitle}</div>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', flexShrink: 0 }}>{item.time}</div>
                                                </div>
                                            ))}
                                            <button className="btn-outline" onClick={() => setActiveTab('history')} style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                                View All History <ExternalLink size={14} style={{ marginLeft: '0.5rem' }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'vaccination' && <VaccinationSchedule />}



                        {activeTab === 'scan' && (
                            <div className="animate-fade-in">
                                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                                    <h2 className="font-outfit" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>AI Breed Scanner</h2>
                                    <p style={{ color: 'var(--text-dim)' }}>Upload a photo of your cattle for instant breed identification and yield estimation.</p>
                                </div>

                                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                    <div className="glass-card" style={{ padding: '3rem', borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--glass-border)' }}>
                                        {!selectedFile ? (
                                            <div style={{ textAlign: 'center' }}>
                                                <div className="pulse" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                                    <Camera size={40} color="var(--primary)" />
                                                </div>
                                                <h3>Select Cattle Image</h3>
                                                <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Drag and drop or click to browse files</p>
                                                <input type="file" id="cattle-upload" style={{ display: 'none' }} onChange={handleFileChange} accept="image/*" />
                                                <button className="btn-premium" onClick={() => document.getElementById('cattle-upload')?.click()}>Browse Library</button>
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'hidden', marginBottom: '2rem', maxHeight: '400px', background: 'rgba(0,0,0,0.2)' }}>
                                                    <img src={URL.createObjectURL(selectedFile)} style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain' }} />
                                                    {isScanning && (
                                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
                                                            <div className="loader"></div>
                                                            <div style={{ width: '100%', height: '2px', background: 'var(--primary)', position: 'absolute', top: '50%', boxShadow: '0 0 15px var(--primary)', animation: 'scan-move 2s infinite ease-in-out' }}></div>
                                                            <p className="font-outfit animate-pulse" style={{ letterSpacing: '4px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(0,0,0,0.4)', padding: '0.5rem 1rem', borderRadius: '2rem' }}>GENOME SCANNING IN PROGRESS...</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ marginBottom: '2rem' }}>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>ASSOCIATED EAR TAG (OPTIONAL)</label>
                                                    <input
                                                        type="text" className="glass-input" placeholder="Enter Tag ID for association..."
                                                        value={earTag} onChange={(e) => setEarTag(e.target.value)}
                                                    />
                                                </div>

                                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                                    <button className="btn-outline" onClick={() => setSelectedFile(null)}>Reset</button>
                                                    <button className="btn-premium" onClick={handleScan} disabled={isScanning}>
                                                        {isScanning ? 'Processing...' : 'Start AI Analysis'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {scanResult && !scanResult.not_cattle && scanResult.breed_name !== "Unidentified" && (
                                        <div className="glass-card animate-scale-in" style={{ marginTop: '2rem', border: '1px solid var(--primary)', position: 'relative', overflow: 'hidden', padding: '2.5rem' }}>
                                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem 1.5rem', background: 'var(--primary)', color: 'white', borderRadius: '0 0 0 1.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                                                DETECTION SUCCESS
                                            </div>

                                            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                                                <h3 style={{ color: 'var(--primary)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>{scanResult.breed_name}</h3>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', color: 'var(--text-dim)' }}>
                                                    <span>Species: {scanResult.animal_type || 'Cattle'}</span>
                                                    <span>•</span>
                                                    <span>Avg Fat: {scanResult.fat_content || 'N/A'}</span>
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '2.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                                    <span style={{ fontWeight: 600 }}>Identification Confidence</span>
                                                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{Math.round(scanResult.confidence_score)}%</span>
                                                </div>
                                                <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${scanResult.confidence_score}%` }}
                                                        transition={{ duration: 1, ease: 'easeOut' }}
                                                        style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}
                                                    />
                                                </div>
                                                <p style={{ marginTop: '1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                                    Our AI confirms this animal matches {scanResult.breed_name} standards. Expected daily output: <strong>{scanResult.yield_estimate}L</strong> ({scanResult.milk_yield_range || 'N/A'})
                                                </p>
                                            </div>

                                            <div className="info-grid" style={{ marginBottom: '2.5rem' }}>
                                                <div className="info-item">
                                                    <div className="info-label">Yield Range</div>
                                                    <div className="info-value">{scanResult.milk_yield_range || 'N/A'}</div>
                                                </div>
                                                <div className="info-item">
                                                    <div className="info-label">Fat Content</div>
                                                    <div className="info-value">{scanResult.fat_content || 'N/A'}</div>
                                                </div>
                                                <div className="info-item">
                                                    <div className="info-label">Animal Type</div>
                                                    <div className="info-value">{scanResult.animal_type || 'Cattle'}</div>
                                                </div>
                                            </div>

                                            <div className="glass" style={{ borderRadius: '1rem', padding: '1.5rem', marginBottom: '2.5rem' }}>
                                                <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={18} /> Breed Insights</h4>
                                                <div className="characteristics-row">
                                                    <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Coat & Texture</span>
                                                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Standard Match</span>
                                                </div>
                                                <div className="characteristics-row">
                                                    <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Productivity Score</span>
                                                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>High Efficiency</span>
                                                </div>
                                                <div className="characteristics-row">
                                                    <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Disease Resistance</span>
                                                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Above Average</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <button className="btn-outline" onClick={() => { setSelectedFile(null); setScanResult(null); }} style={{ flex: 1 }}> Retake Scan </button>
                                                <button className="btn-premium" onClick={() => setActiveTab('history')} style={{ flex: 1 }}> Save to Records </button>
                                            </div>
                                        </div>
                                    )}

                                    {scanResult && (scanResult.not_cattle || scanResult.breed_name === "Unidentified") && (
                                        <div className="glass-card animate-scale-in" style={{ marginTop: '2rem', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)' }}>
                                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <AlertCircle size={32} color="#ef4444" />
                                                </div>
                                                <div>
                                                    <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Animal Rejected</h3>
                                                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                                        {scanResult.message || "This image does not contain identifiable Cattle or Buffalo breeds supported by BreedSureAI."}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                className="btn-outline"
                                                onClick={() => { setSelectedFile(null); setScanResult(null); }}
                                                style={{ width: '100%', marginTop: '1.5rem', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                            >
                                                Dismiss & Retry
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="animate-fade-in">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h2 className="font-outfit" style={{ fontSize: '2rem' }}>Scan History</h2>
                                    <button
                                        onClick={exportToCSV}
                                        className="btn-outline"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <Download size={16} /> Export CSV
                                    </button>
                                </div>
                                <div className="glass-card" style={{ padding: 0 }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                                                    <th style={{ padding: '1.25rem' }}>Visual Asset</th>
                                                    <th style={{ padding: '1.25rem' }}>Ear Tag</th>
                                                    <th style={{ padding: '1.25rem' }}>Detection Result</th>
                                                    <th style={{ padding: '1.25rem' }}>Confidence</th>
                                                    <th style={{ padding: '1.25rem' }}>Yield Info</th>
                                                    <th style={{ padding: '1.25rem' }}>Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detections.length > 0 ? detections.map((det, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => handleHistoryClick(det)}>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={{ width: '60px', height: '60px', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                                                <img src={`${BASE_URL}/${det.image_path}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{det.animal_ear_tag || 'N/A'}</span>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{det.breed_name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Type: {det.animal_type}</div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                                                    <div style={{ width: `${det.confidence_score}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }}></div>
                                                                </div>
                                                                <span style={{ fontSize: '0.85rem' }}>{Math.round(det.confidence_score)}%</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div>{det.yield_estimate} L/day</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Fat: {det.fat_content}</div>
                                                        </td>
                                                        <td style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                                            {new Date(det.detected_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                                                            <div style={{ opacity: 0.5, marginBottom: '1rem' }}>
                                                                <History size={48} style={{ margin: '0 auto' }} />
                                                            </div>
                                                            <p>No scans analyzed yet. Your herd history will appear here.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'timetable' && <Timetable />}
                        {activeTab === 'comparison' && <BreedComparison />}

                        {activeTab === 'analytics' && (
                            <div className="animate-fade-in">
                                <h2 className="font-outfit" style={{ fontSize: '2rem', marginBottom: '2rem' }}>Advanced Analytics</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                                    <div className="glass-card">
                                        <h3 style={{ marginBottom: '2rem' }}>Milk Production & Quality Trends</h3>
                                        <div style={{ width: '100%', height: '400px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={yieldData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                    <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} />
                                                    <Tooltip contentStyle={{ background: 'var(--background)', border: '1px solid var(--glass-border)' }} />
                                                    <Area type="monotone" dataKey="yield" stroke="var(--primary)" fill="rgba(16, 185, 129, 0.1)" name="Herd Yield (L)" />
                                                    {categories.map((cat, i) => (
                                                        <Area
                                                            key={cat}
                                                            type="monotone"
                                                            dataKey={cat}
                                                            stroke={i === 0 ? 'var(--primary)' : i === 1 ? 'var(--secondary)' : '#f59e0b'}
                                                            fill="transparent"
                                                            name={`${cat} Yield`}
                                                        />
                                                    ))}
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="glass-card">
                                        <h3 style={{ marginBottom: '2rem' }}>Seasonal & Strategic Insights</h3>
                                        <div className="flex flex-col gap-4">
                                            {[
                                                { icon: CheckCircle, color: '#10b981', title: 'Summer Care: Heat Mitigation', desc: 'Summer temperatures are rising. Ensure your cattle have access to chilled water and shade.' },
                                                { icon: TrendingUp, color: '#6366f1', title: 'Productivity Alert', desc: 'Sahiwal breeds in your region are showing 5% higher yield this month.' },
                                                { icon: Shield, color: '#f59e0b', title: 'Vaccination Reminder', desc: 'FMD season is approaching. Check your vaccination schedule for pending boosters.' },
                                                { icon: AlertCircle, color: '#6366f1', title: 'Nutrition Tip', desc: 'Adding mineral blocks can improve the fat content in milk by up to 0.4%.' }
                                            ].map((insight, i) => (
                                                <div key={i} className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                                        <insight.icon size={20} color={insight.color} />
                                                        <span style={{ fontWeight: 700 }}>{insight.title}</span>
                                                    </div>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>{insight.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <h2 className="font-outfit" style={{ fontSize: '2rem', marginBottom: '2rem' }}>Farmer Profile</h2>
                                <div className="glass-card" style={{ padding: '2.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '3rem' }}>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ width: '120px', height: '120px', borderRadius: '24px', overflow: 'hidden', border: '4px solid var(--secondary)' }}>
                                                <img src={userProfile?.profile_photo ? `${BASE_URL}/${userProfile.profile_photo}?t=${Date.now()}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.full_name || 'Farmer'}`} alt="Profile Large" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <input
                                                type="file"
                                                id="profile-photo-input"
                                                style={{ display: 'none' }}
                                                onChange={handlePhotoUpload}
                                                accept="image/*"
                                            />
                                            <button
                                                onClick={() => document.getElementById('profile-photo-input')?.click()}
                                                disabled={isUpdating}
                                                style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'pointer' }}
                                            >
                                                <Camera size={18} />
                                            </button>
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{userProfile?.full_name}</h2>
                                            <p style={{ color: 'var(--text-dim)' }}>Premium Farmer Member</p>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                                <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>VERIFIED</span>
                                                <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--secondary)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>PRO BUNDLE</span>
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleProfileUpdate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                        <div className="input-group">
                                            <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Full Name</label>
                                            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem' }}>
                                                <User size={18} color="var(--primary)" />
                                                <input
                                                    value={profileFormData.full_name}
                                                    onChange={(e) => setProfileFormData({ ...profileFormData, full_name: e.target.value })}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text)', width: '100%', outline: 'none' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Phone Number</label>
                                            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem' }}>
                                                <Phone size={18} color="var(--primary)" />
                                                <input
                                                    value={profileFormData.phone_number}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        if (val.length <= 10) {
                                                            setProfileFormData({ ...profileFormData, phone_number: val });
                                                        }
                                                    }}
                                                    maxLength={10}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text)', width: '100%', outline: 'none' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Email Address</label>
                                            <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem' }}>
                                                <Mail size={18} color="var(--primary)" />
                                                <input
                                                    value={profileFormData.email}
                                                    readOnly
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', width: '100%', outline: 'none', cursor: 'not-allowed' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="input-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <button
                                                type="submit"
                                                disabled={isUpdating}
                                                className="btn-premium"
                                                style={{ width: '100%', opacity: isUpdating ? 0.7 : 1 }}
                                            >
                                                {isUpdating ? 'Updating...' : 'Update Profile'}
                                            </button>
                                        </div>
                                    </form>

                                    <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowAbout(true)}
                                            className="btn-outline"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <Info size={16} /> About BreedSureAI
                                        </button>
                                        <button
                                            onClick={handleDeleteAccount}
                                            className="btn-outline"
                                            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                        >
                                            Delete Account
                                        </button>
                                    </div>

                                    {/* About Modal */}
                                    <AnimatePresence>
                                        {showAbout && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(10px)' }}
                                            >
                                                <motion.div
                                                    initial={{ scale: 0.9, y: 20 }}
                                                    animate={{ scale: 1, y: 0 }}
                                                    className="glass-card"
                                                    style={{ maxWidth: '600px', width: '100%', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                                        <h2 className="font-outfit">About BreedSureAI</h2>
                                                        <button onClick={() => setShowAbout(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><Plus size={24} style={{ transform: 'rotate(45deg)' }} /></button>
                                                    </div>
                                                    <div className="flex flex-col gap-6">
                                                        <section>
                                                            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Our Purpose</h3>
                                                            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                                                BreedSureAI is an advanced livestock management platform designed to empower farmers with AI-driven insights.
                                                                We specialize in high-precision breed identification, yield prediction, and comprehensive health tracking to ensure the productivity and well-being of your herd.
                                                            </p>
                                                        </section>
                                                        <section>
                                                            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Safety & Privacy</h3>
                                                            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                                                Your data is your asset. We implement end-to-end encryption for all farmer records and scan histories.
                                                                Our AI processing is secure, and we never share individual farmer data with third parties without explicit authorization.
                                                            </p>
                                                        </section>
                                                        <section>
                                                            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Data Integrity</h3>
                                                            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                                                All breed registrations are verified by official Breed Profile Analysts (BPA) ensuring that your livestock records maintain official status for insurance and breeding programs.
                                                            </p>
                                                        </section>
                                                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                                                                <Shield size={18} />
                                                                <span style={{ fontWeight: 700 }}>Farmer Health Score</span>
                                                            </div>
                                                            <p style={{ fontSize: '0.85rem' }}>Your current herd management score: <strong style={{ color: 'var(--primary)' }}>94% (Excellent)</strong></p>
                                                            <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', marginTop: '0.5rem', overflow: 'hidden' }}>
                                                                <div style={{ width: '94%', height: '100%', background: 'var(--primary)' }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default FarmerDashboard;
