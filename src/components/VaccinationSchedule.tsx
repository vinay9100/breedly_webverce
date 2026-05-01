import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Info, AlertCircle, Syringe, Plus,
    CheckCircle, Clock, Trash2, X, ChevronRight,
    User
} from 'lucide-react';
import { farmerApi } from '../services/api';

const vaccinationGuide = [
    {
        id: 1,
        disease: 'FMD (Foot and Mouth Disease)',
        schedule: 'Every 6 months',
        age: '4 months and above',
        severity: 'Critical',
        notes: 'Highly contagious. Vaccination is the only prevention.'
    },
    {
        id: 2,
        disease: 'HS (Hemorrhagic Septicemia)',
        schedule: 'Annually (Pre-monsoon)',
        age: '6 months and above',
        severity: 'High',
        notes: 'Prevalent during rainy season. Heavy economic loss.'
    },
    {
        id: 3,
        disease: 'BQ (Black Quarter)',
        schedule: 'Annually (Pre-monsoon)',
        age: '6 months to 2 years',
        severity: 'High',
        notes: 'Affects young healthy cattle. Rapid onset.'
    },
    {
        id: 4,
        disease: 'Brucellosis',
        schedule: 'Once in a lifetime',
        age: '4-8 months (Heifers only)',
        severity: 'Medium',
        notes: 'Prevents abortion. Essential for breeding stock.'
    },
    {
        id: 5,
        disease: 'Theileriosis',
        schedule: 'Annually',
        age: '2 months and above',
        severity: 'Medium',
        notes: 'Tick-borne disease. Common in crossbred cattle.'
    }
];

const VaccinationSchedule: React.FC = () => {
    const [scheduled, setScheduled] = useState<any[]>([]);
    const [animals, setAnimals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        vaccine_name: '',
        planned_date: '',
        type: 'Routine',
        animal_id: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [vaxRes, animalsRes] = await Promise.all([
                farmerApi.getVaccinations(),
                farmerApi.getAnimals()
            ]);
            setScheduled(vaxRes.data);
            setAnimals(animalsRes.data);
        } catch (error) {
            console.error('Failed to fetch vaccinations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.vaccine_name || formData.vaccine_name.length < 3) {
            return alert('Vaccine name must be at least 3 characters');
        }
        if (!formData.planned_date) {
            return alert('Please select a planned date');
        }

        try {
            await farmerApi.addVaccination({
                ...formData,
                animal_id: formData.animal_id ? parseInt(formData.animal_id) : null,
                planned_date: new Date(formData.planned_date).toISOString()
            });
            setShowAddForm(false);
            setFormData({ vaccine_name: '', planned_date: '', type: 'Routine', animal_id: '' });
            fetchInitialData();
        } catch (error) {
            alert('Failed to schedule vaccination');
        }
    };

    const handleComplete = async (id: number) => {
        try {
            await farmerApi.completeVaccination(id);
            fetchInitialData();
        } catch (error) {
            alert('Error updating status');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;
        try {
            await farmerApi.deleteVaccination(id);
            fetchInitialData();
        } catch (error) {
            alert('Error deleting');
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h2 className="font-outfit" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>Live Vaccination Portal</h2>
                    <p style={{ color: 'var(--text-dim)' }}>Manage protocols and scheduled immunization for your livestock.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="btn-premium"
                    style={{ background: 'var(--secondary)' }}
                >
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> Schedule Vaccination
                </button>
            </div>

            {/* Scheduled Vaccinations List */}
            <div style={{ marginBottom: '4rem' }}>
                <h3 className="font-outfit" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Calendar size={20} color="var(--primary)" /> Scheduled & Active
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    <AnimatePresence>
                        {scheduled.map((vax) => (
                            <motion.div
                                key={vax.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="glass-card"
                                style={{
                                    padding: '1.5rem',
                                    borderLeft: `4px solid ${vax.status === 'completed' ? '#10b981' : 'var(--primary)'}`,
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    {vax.status !== 'completed' && (
                                        <button onClick={() => handleComplete(vax.id)} className="icon-btn" style={{ color: '#10b981' }}>
                                            <CheckCircle size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(vax.id)} className="icon-btn" style={{ color: '#ef4444' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>
                                        {vax.type} • {vax.status === 'completed' ? 'Done' : 'Pending'}
                                    </div>
                                    <h4 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', paddingRight: '2rem' }}>{vax.vaccine_name}</h4>

                                    {vax.animal ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '0.75rem' }}>
                                            <User size={14} />
                                            <span>{vax.animal.animal_name} (Tag: {vax.animal.ear_tag_number})</span>
                                        </div>
                                    ) : (
                                        animals.find(a => a.id === vax.animal_id) && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '0.75rem' }}>
                                                <User size={14} />
                                                <span>{animals.find(a => a.id === vax.animal_id).animal_name} (Tag: {animals.find(a => a.id === vax.animal_id).ear_tag_number})</span>
                                            </div>
                                        )
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                        <Clock size={14} />
                                        {new Date(vax.planned_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>

                                {vax.completion_date && (
                                    <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#10b981', textAlign: 'center' }}>
                                        Verified Completion: {new Date(vax.completion_date).toLocaleDateString()}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {scheduled.length === 0 && !isLoading && (
                        <div style={{
                            gridColumn: '1 / -1',
                            padding: '4rem',
                            textAlign: 'center',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '1.5rem',
                            border: '1px dashed var(--glass-border)'
                        }}>
                            <div style={{ opacity: 0.3, marginBottom: '1rem' }}>
                                <Syringe size={48} style={{ margin: '0 auto' }} />
                            </div>
                            <p style={{ color: 'var(--text-dim)' }}>No active vaccinations scheduled.</p>
                            <button onClick={() => setShowAddForm(true)} className="btn-outline" style={{ marginTop: '1.5rem' }}>Schedule Now</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Knowledge Base Section */}
            <div>
                <h3 className="font-outfit" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Info size={20} color="var(--secondary)" /> Vaccination Directory
                </h3>
                <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    {vaccinationGuide.map((vax) => (
                        <motion.div
                            key={vax.id}
                            whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
                            className="glass-card"
                            style={{ padding: '1.5rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '2rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    background: vax.severity === 'Critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    color: vax.severity === 'Critical' ? '#ef4444' : '#f59e0b',
                                    border: `1px solid ${vax.severity === 'Critical' ? '#ef444455' : '#f59e0b55'}`
                                }}>
                                    {vax.severity.toUpperCase()}
                                </div>
                                <Syringe size={18} color="var(--primary)" />
                            </div>

                            <h4 className="font-outfit" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{vax.disease}</h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                                    <Calendar size={16} color="var(--text-dim)" />
                                    <span><strong>Schedule:</strong> {vax.schedule}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                                    <AlertCircle size={16} color="var(--text-dim)" />
                                    <span><strong>Ideal Age:</strong> {vax.age}</span>
                                </div>
                            </div>

                            <div style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '0.75rem',
                                fontSize: '0.85rem',
                                color: 'var(--text-dim)',
                                border: '1px solid var(--glass-border)'
                            }}>
                                {vax.notes}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Add Vaccination Modal */}
            {showAddForm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(10px)'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card"
                        style={{ width: '90%', maxWidth: '500px', padding: '2.5rem', position: 'relative' }}
                    >
                        <button onClick={() => setShowAddForm(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>

                        <h3 className="font-outfit" style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Schedule Vaccination</h3>

                        <form onSubmit={handleAdd} className="flex flex-col gap-5">
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>VACCINE NAME</label>
                                <input
                                    type="text" required className="glass-input" placeholder="e.g. FMD Booster"
                                    value={formData.vaccine_name}
                                    onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>PLANNED DATE</label>
                                    <input
                                        type="date" required className="glass-input"
                                        min={new Date().toISOString().split('T')[0]}
                                        max="2060-12-31"
                                        value={formData.planned_date}
                                        onChange={(e) => setFormData({ ...formData, planned_date: e.target.value })}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Select a future date up to 2060</p>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>TYPE</label>
                                    <select
                                        className="glass-input"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        style={{ appearance: 'none' }}
                                    >
                                        <option value="Routine">Routine</option>
                                        <option value="Booster">Booster</option>
                                        <option value="Emergency">Emergency</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>ASSOCIATE ANIMAL (OPTIONAL)</label>
                                <select
                                    className="glass-input"
                                    value={formData.animal_id}
                                    onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
                                    style={{ appearance: 'none' }}
                                >
                                    <option value="">-- Apply to specific animal --</option>
                                    {animals.map(animal => (
                                        <option key={animal.id} value={animal.id}>{animal.animal_name} ({animal.ear_tag_number})</option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" className="btn-premium" style={{ marginTop: '1rem', padding: '1rem' }}>
                                Add Schedule <ChevronRight size={18} style={{ marginLeft: 'auto' }} />
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            <style>{`
                .icon-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--glass-border);
                    padding: 0.5rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .icon-btn:hover {
                    background: rgba(255,255,255,0.1);
                    transform: scale(1.1);
                }
                select option {
                    background: #1a1a2e;
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default VaccinationSchedule;
