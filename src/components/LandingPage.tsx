import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, useMotionValue, animate } from 'framer-motion';
import { ChevronRight, Activity, Zap, BarChart3, Binary, Network, Sun, Moon, Dna, Eye, ShieldCheck, Microscope, Beef, Camera, Shield, BarChart2 } from 'lucide-react';
import officialLogo from '../assets/logo.png';

interface LandingPageProps {
    onGetStarted: () => void;
}

const CountUp = ({ value, duration = 1.5 }: { value: number, duration?: number }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (isInView) {
            animate(count, value, { duration });
        }
    }, [isInView, value, count, duration]);

    return <motion.span ref={ref}>{rounded}</motion.span>;
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    const { scrollYProgress } = useScroll();
    const floatingY = useTransform(scrollYProgress, [0, 1], [0, -50]);
    const [beforeAfterVal, setBeforeAfterVal] = useState(50);
    const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));
    const [detections, setDetections] = useState([
        { id: 1, breed: 'Murrah', conf: 98.4, time: '12:45' },
        { id: 2, breed: 'Deoni', conf: 89.1, time: '12:40' },
        { id: 3, breed: 'Kankrej', conf: 94.2, time: '12:35' }
    ]);

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    };

    // Live Ticker Effect
    useEffect(() => {
        const interval = setInterval(() => {
            setDetections(prev => [...prev.slice(1), {
                id: Date.now(),
                breed: ['Gir', 'Sahival', 'Jaffrabadi'][Math.floor(Math.random() * 3)],
                conf: (85 + Math.random() * 14).toFixed(1) as any,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--text)' }}>
            <nav
                className="glass"
                style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000, padding: '1rem 0', backdropFilter: 'blur(40px)', borderBottom: '1px solid var(--glass-border)' }}
            >
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <div style={{ width: '45px', height: '45px', borderRadius: '14px', background: 'white', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(16, 185, 129, 0.15)', overflow: 'hidden' }}>
                            <img src={officialLogo} alt="BSAI Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <span className="font-outfit" style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px' }}>
                            BreedSure<span className="gradient-text">AI</span>
                        </span>
                    </motion.div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>

                        <button
                            onClick={toggleTheme}
                            className="glass"
                            style={{ width: '38px', height: '38px', borderRadius: '12px', border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--glass-bg)' }}
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button onClick={onGetStarted} className="btn-premium" style={{ borderRadius: '50px', background: 'var(--accent)', padding: '0.6rem 2rem', fontSize: '0.9rem', color: 'white' }}>
                            Authorize AI
                        </button>
                    </div>
                </div>
            </nav>

            <section style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', paddingTop: '80px' }}>
                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    <img
                        src="https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&q=80&w=2000"
                        alt="Murrah Buffalo Field"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.95 }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--background) 5%, transparent 60%, rgba(26,26,26,0.5) 100%)' }}></div>
                </div>

                <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                    <motion.div style={{ maxWidth: '800px', y: floatingY }} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="font-outfit animate-glitch" style={{ fontSize: '6rem', lineHeight: 0.85, fontWeight: 950, marginBottom: '2.5rem', color: 'var(--text)', letterSpacing: '-3px' }}>
                            BreedSure<span className="gradient-text">AI</span>
                        </h1>
                        <p style={{ fontSize: '1.4rem', color: 'var(--text-dim)', marginBottom: '3.5rem', maxWidth: '550px', lineHeight: 1.5 }}>
                            AI Vision Layer for Agricultural Precision. Detect genomic integrity with neural-link accuracy.
                        </p>
                        <button onClick={onGetStarted} className="btn-premium" style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', gap: '1rem', background: 'var(--accent)', color: 'white' }}>
                            Initiate Forensic Scan <ChevronRight size={24} />
                        </button>
                    </motion.div>
                </div>

                <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', width: '320px', background: 'var(--glass-bg)', backdropFilter: 'blur(30px)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '1.5rem', zIndex: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <span style={{ color: 'var(--secondary)', fontSize: '0.75rem', fontWeight: 900 }}>HUB LOGS</span>
                        <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }} className="animate-pulse" />
                    </div>
                    <div style={{ height: '120px', overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse', gap: '0.75rem' }}>
                        {detections.map((det) => (
                            <motion.div key={det.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text)' }}>
                                <span style={{ opacity: 0.7 }}>{det.breed} Unit</span>
                                <span style={{ color: 'var(--secondary)', fontWeight: 800 }}>{det.conf}%</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="milk-divider" style={{ background: 'var(--accent)', height: '120px' }}>
                <svg viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                    <motion.path
                        animate={{
                            d: [
                                "M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                                "M0,160L48,181.3C96,203,192,245,288,234.7C384,224,480,160,576,138.7C672,117,768,139,864,165.3C960,192,1056,224,1152,213.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                            ]
                        }}
                        transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
                        fill="var(--background)"
                    />
                </svg>
            </div>

            <section style={{ padding: '8rem 0', background: 'var(--background)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
                        <h2 className="font-outfit" style={{ fontSize: '4rem', color: 'var(--text)', fontWeight: 900 }}>AI Genomic Intelligence</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '1.25rem' }}>High-Fidelity Veterinary Recognition Systems</p>
                    </div>
                    <div className="stat-grid" style={{ gap: '3rem' }}>
                        {[
                            { icon: Camera, title: 'AI Scanner', desc: 'Real-time breed identification and genomic verification layering.' },
                            { icon: Shield, title: 'Vaccination Tracker', color: 'var(--primary)', desc: 'Automated herd immunization records and life-cycle alerts.' },
                            { icon: BarChart2, title: 'Milk Analytics', dark: true, desc: 'Advanced yield forecasting and nutritional performance insights.' }
                        ].map((item, i) => (
                            <div key={i} className="glass-card" style={{ background: item.dark ? 'var(--accent)' : 'var(--glass-bg)', borderRadius: '32px', padding: '3rem', color: item.dark ? 'white' : 'var(--text)' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: item.color || '#10B981' }}>
                                    <item.icon size={40} />
                                </div>
                                <h3 style={{ fontSize: '2rem', marginBottom: '1rem', textAlign: 'center' }}>{item.title}</h3>
                                <p style={{ color: item.dark ? 'rgba(255,255,255,0.6)' : 'var(--text-dim)', textAlign: 'center' }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section style={{ padding: '8rem 0', background: 'var(--accent)', color: 'white' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '6rem', alignItems: 'center' }}>
                        <div>
                            <h2 className="font-outfit" style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '2rem' }}>Core AI <span className="gradient-text">Forensics</span></h2>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', marginBottom: '3rem' }}>Evaluating the Neural Hub processing layers.</p>
                            <div style={{ display: 'flex', gap: '4rem' }}>
                                <div><div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--secondary)' }}><CountUp value={99} />%</div><div style={{ fontSize: '0.8rem', opacity: 0.4 }}>Precision</div></div>
                                <div><div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--primary)' }}><CountUp value={300} />ms</div><div style={{ fontSize: '0.8rem', opacity: 0.4 }}>Latency</div></div>
                            </div>
                        </div>
                        <div className="glass-card" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '32px', overflow: 'hidden' }}>
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', overflow: 'hidden', borderRadius: '26px' }}>
                                <img src="https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&q=80&w=1200" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Detected" />
                                <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - beforeAfterVal}% 0 0)`, zIndex: 5 }}>
                                    <img src="https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&q=80&w=1200" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) brightness(0.7)' }} alt="Raw" />
                                </div>
                                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${beforeAfterVal}%`, width: '4px', background: 'var(--secondary)', zIndex: 10 }}>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '48px', height: '48px', background: 'var(--secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                        <ChevronRight size={28} />
                                    </div>
                                </div>
                                <input type="range" min="0" max="100" value={beforeAfterVal} onChange={(e) => setBeforeAfterVal(parseInt(e.target.value))} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'ew-resize', zIndex: 15 }} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer style={{ padding: '6rem 0', background: 'var(--background)', borderTop: '1px solid var(--glass-border)' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="flex items-center gap-2">
                        <img src={officialLogo} alt="BSAI Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                        <span className="font-outfit" style={{ fontSize: '1.5rem', fontWeight: 900 }}>BreedSureAI</span>
                    </div>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>© 2026 DISTRICT INFRASTRUCTURE. AI-POWERED GENETICS.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
