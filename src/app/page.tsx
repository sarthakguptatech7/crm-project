'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, User, Phone, MapPin, Mail, Sparkles, DownloadCloud, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function LeadsDashboard() {
  const { data: leads, error, mutate, isValidating } = useSWR('/api/leads', fetcher, {
    refreshInterval: 3000, // Poll every 3 seconds for near real-time updates
  });

  const [sheetUrl, setSheetUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ message: string, error?: boolean } | null>(null);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl) return;

    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to sync');
      setSyncStatus({ message: `Successfully synced! ${data.ingested} new leads ingested and assigned.` });
      setSheetUrl('');
      mutate();
    } catch (err: any) {
      setSyncStatus({ message: err.message, error: true });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 6000);
    }
  };

  if (error) return <div className="p-4 text-red-400 glass-card rounded-xl">Failed to load leads.</div>;

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Leads Activity</h1>
          <p className="text-zinc-400">Real-time feed of ingested leads and assignments.</p>
        </div>

        <button
          onClick={() => mutate()}
          disabled={isValidating}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all group disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4 text-brand-400", isValidating && "animate-spin")} />
          <span className="text-zinc-200">Force Sync</span>
        </button>
      </div>

      {/* Sync Module */}
      <div className="glass-card rounded-xl p-5 border border-brand-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-[40px] translate-x-1/2 -translate-y-1/2" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <DownloadCloud className="w-4 h-4 text-brand-400" />
              Native Google Sheets Sync
            </h3>
            <p className="text-xs text-zinc-400">Provide a public Google Sheet URL to instantly ingest and assign matching leads. Duplicates are safely ignored.</p>
          </div>
          <form onSubmit={handleSync} className="flex-1 flex gap-2 max-w-lg">
            <input
              required
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../edit"
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
            <button
              disabled={isSyncing}
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50 whitespace-nowrap"
            >
              {isSyncing ? 'Syncing...' : 'Sync Sheet'}
            </button>
          </form>
        </div>

        {syncStatus && (
          <div className={cn("mt-4 text-xs flex items-center gap-1.5", syncStatus.error ? "text-red-400" : "text-brand-400")}>
            <AlertCircle className="w-3.5 h-3.5" />
            {syncStatus.message}
          </div>
        )}
      </div>



      <div className="glass-card rounded-2xl overflow-hidden border border-white/5 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-xs font-semibold text-zinc-400 uppercase tracking-wider bg-black/20">
          <div className="col-span-3">Contact</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-2">Time</div>
          <div className="col-span-5">Assigned Caller</div>
        </div>

        {/* Loading State or Empty */}
        {!leads && (
          <div className="p-8 flex justify-center items-center">
            <RefreshCw className="w-6 h-6 text-brand-500 animate-spin" />
          </div>
        )}

        {leads?.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center">
            <Sparkles className="w-12 h-12 text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">No leads yet</h3>
            <p className="text-zinc-500 max-w-sm">When new leads flow through the webhook, they'll appear here instantly.</p>
          </div>
        )}

        {/* Data Rows */}
        <div className="divide-y divide-white/5">
          {leads?.map((lead: any) => (
            <div key={lead.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors">

              {/* Contact Info */}
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-zinc-300 text-sm">
                    {lead.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-white truncate">{lead.name}</span>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 truncate mt-0.5">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{lead.email || 'N/A'}</span>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500 truncate mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* State */}
              <div className="col-span-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                <span className="text-sm text-zinc-300 capitalize">{lead.state}</span>
              </div>

              {/* Time */}
              <div className="col-span-2 text-sm text-zinc-500">
                {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
              </div>

              {/* Assignment Status */}
              <div className="col-span-5 flex items-center justify-between">
                {lead.caller ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full">
                      <User className="w-3.5 h-3.5 text-brand-400" />
                      <span className="text-sm font-medium text-brand-300">{lead.caller.name}</span>
                    </div>
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                      Routed directly
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-red-400">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
                      <User className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-sm font-medium">Unassigned</span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      All callers capped
                    </span>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
