'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Vendor {
  id: string;
  name: string;
  slug: string;
}

export default function CampusHome() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVendors() {
      const { data, error } = await supabase.from('vendors').select('*');
      if (!error && data) setVendors(data);
      setLoading(false);
    }
    loadVendors();
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="mb-8">
        <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Official Campus App</span>
        <h1 className="text-4xl font-black text-slate-900 mt-1">Campus Bites</h1>
        <p className="text-sm font-semibold text-slate-500 mt-1">Order food from your favorite campus vendors without standing in line.</p>
      </header>

      {/* Vendor List */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">Available Vendors</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <p className="text-slate-500 font-bold">No vendors available currently.</p>
        ) : (
          vendors.map((vendor) => (
            <Link key={vendor.id} href={`/${vendor.slug}`} className="block">
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-emerald-500 hover:shadow-md transition group">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition">{vendor.name}</h3>
                  <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">Open</span>
                </div>
                <p className="text-xs font-semibold text-slate-400">Click to view menu & order</p>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Quick Navigation Footer */}
      <div className="mt-12 pt-6 border-t border-slate-200 space-y-2">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Vendor Portals</p>
        <div className="flex gap-2">
          <Link
            href="/vendor"
            className="flex-1 text-center bg-slate-200 text-slate-800 font-bold py-2.5 text-xs rounded-xl hover:bg-slate-300 transition"
          >
            Menu Portal
          </Link>
          {vendors.length > 0 && (
            <Link
              href={`/kitchen/${vendors[0].id}`}
              className="flex-1 text-center bg-slate-800 text-white font-bold py-2.5 text-xs rounded-xl hover:bg-slate-900 transition"
            >
              Kitchen Display
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}