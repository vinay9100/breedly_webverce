import React, { useState, useEffect } from 'react';
import { Scale, TrendingUp, Droplets, Info, ChevronRight, BarChart3, Star } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

const BREED_DATA = [
    { name: 'Holstein', yield: 28, fat: 3.7, protein: 3.1, climate: 'Moderate', origin: 'Netherlands' },
    { name: 'Jersey', yield: 18, fat: 4.8, protein: 3.8, climate: 'Adaptable', origin: 'UK' },
    { name: 'Sahiwal', yield: 12, fat: 4.5, protein: 3.4, climate: 'Tropical', origin: 'Pakistan/India' },
    { name: 'Gir', yield: 14, fat: 4.7, protein: 3.5, climate: 'Tropical', origin: 'India' },
    { name: 'Red Sindhi', yield: 11, fat: 4.5, protein: 3.3, climate: 'Hot/Humid', origin: 'Pakistan' }
];

const BreedComparison: React.FC = () => {
    const [selectedBreeds, setSelectedBreeds] = useState<string[]>(['Holstein', 'Jersey']);
    const [comparisonData, setComparisonData] = useState<any[]>([]);

    useEffect(() => {
        const filtered = BREED_DATA.filter(b => selectedBreeds.includes(b.name));
        setComparisonData(filtered);
    }, [selectedBreeds]);

    const toggleBreed = (name: string) => {
        if (selectedBreeds.includes(name)) {
            if (selectedBreeds.length > 1) {
                setSelectedBreeds(selectedBreeds.filter(b => b !== name));
            }
        } else if (selectedBreeds.length < 3) {
            setSelectedBreeds([...selectedBreeds, name]);
        }
    };

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '2.5rem' }}>
                <h2 className="font-outfit" style={{ fontSize: '2rem' }}>Breed Intel & Comparison</h2>
                <p style={{ color: 'var(--text-dim)' }}>Analyze performance metrics across major regional and international breeds.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Selection Sidebar */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Select Breeds (Max 3)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {BREED_DATA.map(breed => (
                            <button
                                key={breed.name}
                                onClick={() => toggleBreed(breed.name)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1rem',
                                    borderRadius: '1rem',
                                    background: selectedBreeds.includes(breed.name) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${selectedBreeds.includes(breed.name) ? 'var(--primary)' : 'var(--glass-border)'}`,
                                    color: selectedBreeds.includes(breed.name) ? 'var(--primary)' : 'var(--text)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    textAlign: 'left'
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>{breed.name}</span>
                                {selectedBreeds.includes(breed.name) ? <Star size={16} fill="var(--primary)" /> : <ChevronRight size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Analysis Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ margin: 0 }}>Yield & Composition Analysis</h3>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                    <div style={{ width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '3px' }} /> Daily Yield (L)
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                    <div style={{ width: '12px', height: '12px', background: 'var(--secondary)', borderRadius: '3px' }} /> Fat %
                                </div>
                            </div>
                        </div>

                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                        contentStyle={{ background: 'var(--background)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                                    />
                                    <Bar dataKey="yield" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
                                    <Bar dataKey="fat" fill="var(--secondary)" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {comparisonData.map(breed => (
                            <div key={breed.name} className="glass-card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <h4 style={{ color: 'var(--primary)' }}>{breed.name} Quick-Specs</h4>
                                    <Info size={16} color="var(--text-dim)" />
                                </div>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--text-dim)' }}>Daily Yield:</span>
                                        <span style={{ fontWeight: 700 }}>{breed.yield} Liters</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--text-dim)' }}>Fat Content:</span>
                                        <span style={{ fontWeight: 700 }}>{breed.fat}%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--text-dim)' }}>Climate Adapt:</span>
                                        <span style={{ fontWeight: 700 }}>{breed.climate}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--text-dim)' }}>Heritage Origin:</span>
                                        <span style={{ fontWeight: 700 }}>{breed.origin}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BreedComparison;
