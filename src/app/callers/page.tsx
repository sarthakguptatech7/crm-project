'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Plus, Users, Globe, MapPin, Gauge } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CallersManagement() {
    const { data: callers, error, mutate } = useSWR('/api/callers', fetcher, { refreshInterval: 5000 });
    const [isAdding, setIsAdding] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [role, setRole] = useState('Sales Representative');
    const [languages, setLanguages] = useState('');
    const [dailyLimit, setDailyLimit] = useState(60);
    const [assignedStates, setAssignedStates] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Convert comma separated to arrays
        const langsArray = languages.split(',').map(s => s.trim()).filter(Boolean);
        const statesArray = assignedStates.split(',').map(s => s.trim()).filter(Boolean);

        try {
            await fetch('/api/callers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name, role, languages: langsArray, dailyLimit, assignedStates: statesArray
                })
            });
            setIsAdding(false);
            setName('');
            setLanguages('');
            setAssignedStates('');
            mutate();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const parseJsonStr = (str: string) => {
        try {
            const arr = JSON.parse(str);
            return Array.isArray(arr) ? arr : [str];
        } catch {
            return [str];
        }
    };

    if (error) return <div className="p-4 text-red-500">Failed to load callers.</div>;

    return (
        <div className="space-y-8 animate-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Sales Team</h1>
                    <p className="text-zinc-400">Manage callers, regions, and daily quotas for the assignment engine.</p>
                </div>

                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand-500/20"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Caller</span>
                </button>
            </div>

            {isAdding && (
                <div className="glass-card rounded-2xl p-6 border border-brand-500/30 animate-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <h2 className="text-lg font-semibold text-white mb-4">Add New Caller</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Full Name</label>
                            <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" placeholder="Jane Doe" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Role</label>
                            <input required value={role} onChange={e => setRole(e.target.value)} type="text" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Daily Lead Quota</label>
                            <input required value={dailyLimit} onChange={e => setDailyLimit(Number(e.target.value))} type="number" min="1" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Languages (comma separated)</label>
                            <input required value={languages} onChange={e => setLanguages(e.target.value)} type="text" placeholder="English, Hindi, Marathi" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-zinc-300">Assigned States (comma separated)</label>
                            <input required value={assignedStates} onChange={e => setAssignedStates(e.target.value)} type="text" placeholder="Maharashtra, Karnataka" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-zinc-300 transition-colors">Cancel</button>
                            <button disabled={isSubmitting} type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50">Save Caller</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Grid of Callers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {callers?.map((caller: any) => {
                    const langs = parseJsonStr(caller.languages);
                    const states = parseJsonStr(caller.assignedStates);

                    return (
                        <div key={caller.id} className="glass-card rounded-2xl p-6 border border-white/5 relative group hover:border-brand-500/30 transition-colors duration-300">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                                        <Users className="w-5 h-5 text-brand-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{caller.name}</h3>
                                        <p className="text-xs text-brand-400/80 font-medium">{caller.role}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm text-zinc-300">
                                    <Gauge className="w-4 h-4 text-zinc-500 shrink-0" />
                                    <span><span className="text-white font-medium">{caller.dailyLimit}</span> Leads / day max</span>
                                </div>

                                <div className="flex items-start gap-3 text-sm text-zinc-300">
                                    <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                                    <div className="flex flex-wrap gap-1.5">
                                        {states.map((s, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-zinc-300">{s}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 text-sm text-zinc-300">
                                    <Globe className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                                    <div className="flex flex-wrap gap-1.5">
                                        {langs.map((l, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-brand-500/10 border border-brand-500/20 rounded text-xs text-brand-300">{l}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
