'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const ADMIN_PIN = '9999';

export default function AdminVendorPage() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('admin_authenticated') === 'true') {
      setIsAdminAuthenticated(true);
    }
  }, []);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            🛡️
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-white">
              Admin Portal
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Enter Admin PIN to manage vendors & menu items
            </p>
          </div>

          <form onSubmit={handleAdminAuth} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN (Default: 9999)"
              className="w-full bg-neutral-950 border border-neutral-800 text-center text-2xl tracking-[0.5em] font-mono py-3 rounded-xl text-white focus:outline-none focus:border-orange-500"
            />
            {pinError && (
              <p className="text-xs text-red-400 font-bold">Invalid Admin PIN. Try 9999.</p>
            )}
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black py-3 rounded-xl uppercase tracking-wider text-xs transition-colors"
            >
              Unlock Admin Panel
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-black uppercase">Vendor & Menu Manager</h1>
          <button
            onClick={() => {
              setIsAdminAuthenticated(false);
              localStorage.removeItem('admin_authenticated');
            }}
            className="bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-xl font-bold text-neutral-400 hover:text-white"
          >
            🔒 Lock Admin
          </button>
        </div>
        <p className="text-neutral-400 text-xs">Admin controls active.</p>
      </div>
    </main>
  );
}