'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Enquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
}

const ADMIN_PIN = '040301';

export default function AdminEnquiriesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_enquiries_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchEnquiries() {
      setLoading(true);
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching enquiries:', error.message);
      } else if (data) {
        setEnquiries(data as Enquiry[]);
      }
      setLoading(false);
    }

    fetchEnquiries();

    const subscription = supabase
      .channel('realtime_enquiries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enquiries' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEnquiries((prev) => [payload.new as Enquiry, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Enquiry;
            setEnquiries((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setEnquiries((prev) => prev.filter((item) => item.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isAuthenticated]);

  const handleUpdateStatus = async (id: string, newStatus: Enquiry['status']) => {
    // Optimistic UI update
    setEnquiries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );

    const { error } = await supabase
      .from('enquiries')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const handleDeleteEnquiry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;

    // Optimistic UI update
    setEnquiries((prev) => prev.filter((item) => item.id !== id));

    const { error } = await supabase.from('enquiries').delete().eq('id', id);

    if (error) {
      alert(`Failed to delete enquiry: ${error.message}`);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_enquiries_auth', 'true');
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_enquiries_auth');
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            🔒
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-white">
              Enquiries Portal
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Enter admin PIN to view & update enquiries
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN"
              className="w-full bg-neutral-950 border border-neutral-800 text-center text-2xl tracking-[0.3em] font-mono py-3 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
            {pinError && (
              <p className="text-xs text-red-400 font-bold">Incorrect PIN.</p>
            )}
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black py-3 rounded-xl uppercase tracking-wider text-xs transition-colors"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 sm:p-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="border-b border-neutral-800 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Customer Enquiries
            </h1>
            <p className="text-xs text-neutral-400">
              Track progress status and manage customer support requests
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/vendor-menu"
              className="bg-neutral-900 border border-neutral-800 text-xs font-bold px-3 py-2 rounded-xl text-neutral-300 hover:text-white"
            >
              ← Admin Portal
            </Link>
            <button
              onClick={handleLock}
              className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 font-bold px-3 py-2 rounded-xl"
            >
              🔒 Lock
            </button>
          </div>
        </header>

        {loading ? (
          <p className="text-neutral-500 text-sm">Loading enquiries...</p>
        ) : enquiries.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 p-12 rounded-2xl text-center text-neutral-500 font-bold">
            No customer enquiries submitted yet.
          </div>
        ) : (
          <div className="space-y-4">
            {enquiries.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4 shadow-lg"
              >
                <div className="flex flex-wrap justify-between items-start gap-4 border-b border-neutral-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white">{item.subject}</h2>
                    <p className="text-xs text-amber-400 font-semibold mt-0.5">
                      From: {item.name} ({item.email})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDeleteEnquiry(item.id)}
                      className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg font-bold"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {item.message}
                </p>

                {/* STATUS PROGRESS BAR / DROPDOWN */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Progress Status:
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'pending')}
                      className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${
                        item.status === 'pending' || !item.status
                          ? 'bg-amber-500 text-neutral-950 font-bold'
                          : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      🟡 Pending
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'in_progress')}
                      className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${
                        item.status === 'in_progress'
                          ? 'bg-blue-500 text-white font-bold'
                          : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      🔵 In Progress
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'resolved')}
                      className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${
                        item.status === 'resolved'
                          ? 'bg-emerald-500 text-neutral-950 font-bold'
                          : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      🟢 Resolved
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}