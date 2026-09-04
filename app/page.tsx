'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Vendor {
  id: string;
  name: string;
  description: string;
  is_open?: boolean;
}

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([
    { id: 'v1', name: 'CampusCrunch Grill', description: 'Burgers, Chips, and Wraps', is_open: true },
    { id: 'v2', name: 'Crunch Cafe', description: 'Coffee, Smoothies, and Bakery items', is_open: true }
  ]);

  useEffect(() => {
    async function loadVendors() {
      const { data } = await supabase.from('vendors').select('*').order('id');
      if (data && data.length > 0) {
        setVendors(data);
      }
    }
    loadVendors();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 sm:p-12">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Navigation & Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center p-2 shadow-lg shadow-orange-500/20">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-neutral-950">
                <path d="M 75 25 A 35 35 0 1 0 75 75 L 60 60 A 15 15 0 1 1 60 40 Z" />
                <line x1="10" y1="90" x2="90" y2="10" stroke="#0a0a0a" strokeWidth="8" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                Official Campus App
              </span>
              <h1 className="text-4xl font-black tracking-tight text-white">
                Campus<span className="text-orange-500">Crunch</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/vendor-menu"
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-orange-400 font-bold px-4 py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              ⚙️ Manage Vendors
            </Link>
          </div>
        </header>

        {/* Vendors Grid Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Campus Vendors & Portals
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {vendors.map((v) => (
              <div
                key={v.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-xl hover:border-orange-500/40 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white">{v.name}</h3>
                    <p className="text-xs text-neutral-400 mt-1">{v.description}</p>
                  </div>
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Link
                    href={`/menu?vendor=${v.id}`}
                    className="bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black py-2.5 rounded-xl text-xs uppercase text-center tracking-wider transition-colors shadow-md shadow-orange-500/10"
                  >
                    🛒 Order
                  </Link>

                  <Link
                    href={`/kitchen/${v.id}`}
                    className="bg-neutral-950 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 font-bold py-2.5 rounded-xl text-xs uppercase text-center tracking-wider transition-colors"
                  >
                    👨‍🍳 Kitchen
                  </Link>

                  <Link
                    href={`/admin/vendor-menu`}
                    className="bg-neutral-950 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 font-bold py-2.5 rounded-xl text-xs uppercase text-center tracking-wider transition-colors"
                  >
                    ⚙️ Admin
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}