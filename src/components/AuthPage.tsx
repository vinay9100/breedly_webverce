import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowLeft, ArrowRight, KeyRound, Eye, EyeOff, RefreshCcw } from 'lucide-react';
import { authApi } from '../services/api';
import cow3d from '../assets/cow_3d.png';
import robot3d from '../assets/robot_3d.png';
import shield3d from '../assets/shield_3d.png';

interface AuthPageProps {
    onBack: () => void;
    onLoginSuccess: (role: 'farmer' | 'bpa') => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onBack, onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [resetToken, setResetToken] = useState('');
    const [role, setRole] = useState<'farmer' | 'bpa'>('farmer');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        phone_number: '',
    });

    useEffect(() => {
        if (formData.email.trim().toUpperCase().startsWith('BPA-')) {
            setRole('bpa');
        } else {
            setRole('farmer');
        }
    }, [formData.email]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccessMsg('');
    };

    const validateForm = () => {
        if (!formData.email) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailToTest = role === 'bpa' ? formData.email.substring(4) : formData.email;
        if (!emailRegex.test(emailToTest)) return 'Please enter a valid email address';

        if (!isLogin) {
            if (!formData.full_name || formData.full_name.length < 3) return 'Full name must be at least 3 characters';
            if (!formData.phone_number || !/^\d{10}$/.test(formData.phone_number)) return 'Phone number must be exactly 10 digits';
        }

        if (formData.password.length < 6) return 'Password must be at least 6 characters';
        return '';
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await authApi.login({
                email: formData.email,
                password: formData.password
            });
            localStorage.setItem('token', res.data.access_token);
            onLoginSuccess(res.data.role || role); // Use server role if available
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const payload = { ...formData };
            if (role === 'bpa') {
                await authApi.bpaRegister(payload);
            } else {
                await authApi.register(payload);
            }
            setSuccessMsg('OTP sent to your email.');
            setIsVerifying(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);
        setError('');
        try {
            if (role === 'bpa') {
                await authApi.bpaForgotPassword({ email: formData.email });
            } else {
                await authApi.forgotPassword({ email: formData.email });
            }
            setSuccessMsg('Recovery OTP sent to your email.');
            setIsVerifying(true);
            setIsForgotPassword(true); // Maintain state for OTP verify logic
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Search for email failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otpCode || otpCode.length !== 6) {
            setError('Please enter a 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await authApi.verifyOtp({
                email: formData.email,
                otp_code: otpCode
            });

            if (isForgotPassword) {
                setResetToken(res.data.token);
                setIsResetPassword(true);
                setIsVerifying(false);
            } else {
                setSuccessMsg('Verification successful! Please login.');
                setIsLogin(true);
                setIsVerifying(false);
                setIsForgotPassword(false);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await authApi.resetPassword({
                token: resetToken,
                new_password: formData.password
            });
            setSuccessMsg('Password reset successful! Please login.');
            setIsResetPassword(false);
            setIsLogin(true);
            setIsForgotPassword(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Reset failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            await authApi.resendOtp(formData.email);
            setSuccessMsg('A new OTP has been sent to your email.');
        } catch (err: any) {
            setError('Failed to resend OTP.');
        }
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0a0f1e]" style={{ position: 'relative' }}>
                <div className="parallax-container">
                    <div className="parallax-layer-bg"></div>
                    <div className="parallax-layer-mid"></div>
                    <div className="parallax-layer-fg"></div>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card"
                    style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '3rem' }}
                >
                    <div className="animate-soft-pulse">
                        <KeyRound size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
                    </div>
                    <h2 className="font-outfit" style={{ marginBottom: '1rem', fontSize: '2rem' }}>Verify OTP</h2>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', fontSize: '0.9rem' }}>Enter the 6-digit secure code sent to <br /><span style={{ color: 'var(--text)', fontWeight: 600 }}>{formData.email}</span></p>

                    <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="0 0 0 0 0 0"
                            className="glass-input"
                            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 700 }}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            maxLength={6}
                            required
                        />
                        {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}
                        {successMsg && <p style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>{successMsg}</p>}

                        <button type="submit" className="btn-premium" disabled={loading} style={{ width: '100%', padding: '1rem' }}>
                            {loading ? 'Verifying...' : 'Authenticate'}
                        </button>
                    </form>

                    <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                        Didn't receive code? {' '}
                        <button onClick={handleResendOtp} style={{ color: 'var(--primary)', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                            Resend OTP
                        </button>
                    </div>

                    <button onClick={() => setIsVerifying(false)} className="btn-outline" style={{ marginTop: '2rem', border: 'none', width: '100%', opacity: 0.6 }}>
                        Cancel & Go Back
                    </button>
                </motion.div>
            </div>
        );
    }

    if (isResetPassword) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0a0f1e]" style={{ position: 'relative' }}>
                <div className="parallax-container">
                    <div className="parallax-layer-bg"></div>
                    <div className="parallax-layer-mid"></div>
                    <div className="parallax-layer-fg"></div>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card"
                    style={{ width: '100%', maxWidth: '450px', padding: '3rem' }}
                >
                    <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                        <Lock size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
                        <h2 className="font-outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Set New Password</h2>
                        <p style={{ color: 'var(--text-dim)' }}>Choose a strong password to secure your account.</p>
                    </div>

                    <form onSubmit={handleResetPassword} className="flex flex-col gap-6">
                        <div style={{ position: 'relative' }}>
                            <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-dim)' }} />
                            <input
                                name="password" type={showPassword ? "text" : "password"} placeholder="New Password"
                                className="glass-input" style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                                value={formData.password} onChange={handleInputChange} required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>}

                        <button type="submit" className="btn-premium" disabled={loading} style={{ padding: '1rem', background: 'var(--primary)' }}>
                            {loading ? 'Updating...' : 'Complete Reset'}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-[#0a0f1e]" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* LEFT SIDE: Visuals */}
            <div className="hide-mobile" style={{
                flex: '1.2',
                background: 'rgba(0,0,0,0.3)',
                borderRight: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(var(--glass-border) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3 }}></div>

                <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <motion.img
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        src={cow3d}
                        alt="Cow Char"
                        className="animate-breathing"
                        style={{
                            position: 'absolute', top: '25%', left: '20%', width: '180px',
                            filter: 'drop-shadow(0 0 30px rgba(99,102,241,0.4))'
                        }}
                    />
                    <motion.img
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        src={robot3d}
                        alt="Robot Char"
                        className="animate-float-gentle"
                        style={{
                            position: 'absolute', bottom: '25%', left: '45%', width: '160px',
                            filter: 'drop-shadow(0 0 30px rgba(16,185,129,0.4))'
                        }}
                    />
                    <motion.img
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        src={shield3d}
                        alt="Shield Char"
                        className="animate-sway"
                        style={{
                            position: 'absolute', top: '15%', right: '15%', width: '140px',
                            filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.3))'
                        }}
                    />
                </div>

                <div style={{ position: 'absolute', bottom: '10%', left: '10%', right: '10%', textAlign: 'center', zIndex: 5 }}>
                    <h3 className="font-outfit" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                        Modern <span className="gradient-text">Herd Intelligence</span>
                    </h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '450px', margin: '0 auto' }}>
                        Join the future of livestock management with real-time AI analytics and seamless multi-role access.
                    </p>
                </div>
            </div>

            {/* RIGHT SIDE: Form */}
            <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 10 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isForgotPassword ? 'forgot' : (isLogin ? 'login' : 'register')}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="glass-card"
                        style={{ width: '100%', maxWidth: '480px', padding: '3rem', position: 'relative' }}
                    >
                        <div style={{
                            position: 'absolute', top: '1.5rem', right: '1.5rem',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.4rem 0.8rem', borderRadius: '2rem',
                            background: role === 'bpa' ? 'rgba(45, 90, 39, 0.1)' : 'rgba(0, 229, 255, 0.15)',
                            border: `1px solid ${role === 'bpa' ? 'var(--primary)' : 'var(--secondary)'}`,
                            transition: 'all 0.5s ease'
                        }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: role === 'bpa' ? 'var(--primary)' : '#0891b2', textTransform: 'uppercase' }}>
                                {role === 'bpa' ? 'BPA Officer' : 'Farmer Portal'}
                            </span>
                        </div>

                        <button onClick={onBack} className="btn-outline" style={{ border: 'none', padding: '0.5rem', marginBottom: '2rem', marginLeft: '-1rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ArrowLeft size={20} /> Back
                        </button>

                        {isForgotPassword ? (
                            <>
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <h2 className="font-outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Reset Password</h2>
                                    <p style={{ color: 'var(--text-dim)' }}>Enter your email to receive recovery instructions.</p>
                                </div>

                                <form onSubmit={handleForgotPassword} className="flex flex-col gap-6">
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={20} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-dim)' }} />
                                        <input
                                            name="email" type="email" placeholder="Email Address" className="glass-input" style={{ paddingLeft: '3rem' }}
                                            value={formData.email} onChange={handleInputChange} required
                                        />
                                    </div>

                                    <button type="submit" className="btn-premium" disabled={loading} style={{ padding: '1rem', background: 'var(--primary)' }}>
                                        {loading ? 'Sending...' : 'Send Reset Link'} <RefreshCcw size={20} style={{ marginLeft: 'auto' }} />
                                    </button>
                                </form>

                                <button onClick={() => setIsForgotPassword(false)} className="btn-outline" style={{ marginTop: '1.5rem', width: '100%', border: 'none' }}>
                                    Back to Login
                                </button>
                            </>
                        ) : (
                            <>
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <h2 className="font-outfit" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{isLogin ? 'Welcome Back' : 'Join BSAI'}</h2>
                                    <p style={{ color: 'var(--text-dim)' }}>{isLogin ? 'Enter your details to manage your herd.' : 'Create an account to start using AI vision.'}</p>
                                </div>

                                <form onSubmit={isLogin ? handleLogin : handleRegister} className="flex flex-col gap-5">
                                    {!isLogin && (
                                        <div style={{ position: 'relative' }}>
                                            <User size={20} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-dim)' }} />
                                            <input
                                                name="full_name" type="text" placeholder="Full Name" className="glass-input" style={{ paddingLeft: '3rem' }}
                                                value={formData.full_name} onChange={handleInputChange} required
                                            />
                                        </div>
                                    )}

                                    <div style={{ position: 'relative' }}>
                                        <Mail size={20} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-dim)' }} />
                                        <input
                                            name="email" type="email" placeholder="Email Address" className="glass-input" style={{ paddingLeft: '3rem' }}
                                            value={formData.email} onChange={handleInputChange} required
                                        />
                                    </div>

                                    {!isLogin && (
                                        <div style={{ position: 'relative' }}>
                                            <Phone size={20} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-dim)' }} />
                                            <input
                                                name="phone_number" type="tel" placeholder="Phone Number" className="glass-input" style={{ paddingLeft: '3rem' }}
                                                value={formData.phone_number} onChange={handleInputChange}
                                            />
                                        </div>
                                    )}

                                    <div style={{ position: 'relative' }}>
                                        <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-dim)' }} />
                                        <input
                                            name="password" type={showPassword ? "text" : "password"} placeholder="Password" className="glass-input"
                                            style={{ paddingLeft: '3rem', paddingRight: '3rem', color: 'var(--text)' }}
                                            value={formData.password} onChange={handleInputChange} required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>

                                    {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>}
                                    {successMsg && <p style={{ color: 'var(--primary)', fontSize: '0.85rem', textAlign: 'center' }}>{successMsg}</p>}

                                    {isLogin ? (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                                            <button
                                                type="button"
                                                onClick={() => setIsForgotPassword(true)}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.85rem', cursor: 'pointer' }}
                                            >
                                                Forgot Password?
                                            </button>

                                            <button type="submit" className="btn-premium" disabled={loading} style={{
                                                padding: '0.8rem 2rem',
                                                background: role === 'bpa' ? 'linear-gradient(135deg, var(--primary), #059669)' : 'linear-gradient(135deg, var(--secondary), #4f46e5)',
                                                minWidth: '160px'
                                            }}>
                                                {loading ? '...' : 'Sign In'} <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button type="submit" className="btn-premium" disabled={loading} style={{
                                            padding: '1rem', marginTop: '1rem',
                                            width: '100%',
                                            background: role === 'bpa' ? 'linear-gradient(135deg, var(--primary), #059669)' : 'linear-gradient(135deg, var(--secondary), #4f46e5)'
                                        }}>
                                            {loading ? 'Processing...' : 'Create Account'} <ArrowRight size={20} style={{ marginLeft: 'auto' }} />
                                        </button>
                                    )}
                                </form>

                                <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-dim)', fontSize: '0.95rem' }}>
                                    {isLogin ? "Don't have an account?" : "Already have an account?"} {' '}
                                    <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: role === 'bpa' ? 'var(--primary)' : 'var(--secondary)', fontWeight: 600, cursor: 'pointer', transition: 'color 0.5s ease' }}>
                                        {isLogin ? 'Sign Up' : 'Log In'}
                                    </button>
                                </p>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(2deg); }
                }
                @media (max-width: 1024px) {
                    .hide-mobile {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default AuthPage;
