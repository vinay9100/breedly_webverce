import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Circle, Clock, ChevronRight, Info, Plus, RotateCcw } from 'lucide-react';
import { farmerApi } from '../services/api';

interface Task {
    id: number;
    title: string;
    description: string;
    is_completed: boolean;
    day_number: number;
}

const Timetable: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [currentDay, setCurrentDay] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            setLoading(true);
            const res = await farmerApi.getTimetable();
            if (res.data.length === 0) {
                // Mock data if empty
                setTasks(Array.from({ length: 21 }, (_, i) => ({
                    id: i + 1,
                    day_number: i + 1,
                    title: i === 0 ? 'Breed Selection Check' :
                        i === 1 ? 'Feeding Schedule Setup' :
                            i === 2 ? 'Water Quality Test' : `Care Task Day ${i + 1}`,
                    description: `Plan and execute the designated care protocol for day ${i + 1}.`,
                    is_completed: i === 0 // Mark day 1 as done for demo
                })));
            } else {
                setTasks(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch timetable:', error);
            // Mock data fallback
            setTasks(Array.from({ length: 21 }, (_, i) => ({
                id: i + 1,
                day_number: i + 1,
                title: `Protocol Phase ${i + 1}`,
                description: `Standardized bovine care protocol for Phase ${i + 1} of the 21-day optimization plan.`,
                is_completed: false
            })));
        } finally {
            setLoading(false);
        }
    };

    const toggleTask = async (id: number) => {
        try {
            await farmerApi.completeTask(id);
            setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: !t.is_completed } : t));
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    };

    const generateNew = async () => {
        try {
            await farmerApi.generateTimetable();
            fetchTimetable();
        } catch (error) {
            console.error('Failed to generate timetable:', error);
        }
    };

    const progress = (tasks.filter(t => t.is_completed).length / tasks.length) * 100;

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="font-outfit" style={{ fontSize: '2rem' }}>21-Day Care Optimization</h2>
                    <p style={{ color: 'var(--text-dim)' }}>Precision management protocol for peak animal health and yield.</p>
                </div>
                <button onClick={generateNew} className="btn-outline" style={{ gap: '0.5rem' }}>
                    <RotateCcw size={18} /> Reset Protocol
                </button>
            </header>

            {/* Progress Bar */}
            <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-end' }}>
                    <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Overall Protocol Progress</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.round(progress)}% Complete</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Tasks</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{tasks.filter(t => t.is_completed).length}/{tasks.length || 21}</div>
                    </div>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(to right, var(--secondary), var(--primary))', transition: 'width 0.5s ease' }} />
                </div>
            </div>

            {/* Grid of Days */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {loading ? (
                    <div>Loading Protocol...</div>
                ) : tasks.map((task) => (
                    <div
                        key={task.id}
                        className="glass-card"
                        style={{
                            padding: '1.5rem',
                            border: `1px solid ${task.is_completed ? 'var(--primary)' : 'var(--glass-border)'}`,
                            background: task.is_completed ? 'rgba(16, 185, 129, 0.05)' : 'var(--glass-bg)',
                            opacity: task.day_number > tasks.filter(t => t.is_completed).length + 1 ? 0.6 : 1
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: task.is_completed ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                color: task.is_completed ? 'white' : 'var(--text-dim)'
                            }}>
                                {task.day_number}
                            </div>
                            <button
                                onClick={() => toggleTask(task.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                                {task.is_completed ?
                                    <CheckCircle size={24} color="var(--primary)" /> :
                                    <Circle size={24} color="var(--glass-border)" />
                                }
                            </button>
                        </div>
                        <h4 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{task.title}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1.5rem', lineHeight: 1.5 }}>{task.description}</p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            <Clock size={14} /> 08:00 AM Scheduled
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Timetable;
