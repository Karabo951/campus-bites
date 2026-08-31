'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Vendor {
  id: string;
  name: string;
  is_open: boolean;
}

export default function HomePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVendors() {
      try {
        const { data, error } = await supabase.from('vendors').select('*');
        if (error) {
          console.error('Error fetching vendors:', error.message);
        } else if (data) {
          setVendors(data);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } font-semibold;
      setLoading(false);
    }

    fetchVendors();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Section with Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-6">
          <div>
            <span className="text-xs font-extrabold tracking-widest text-emerald-600 uppercase">
              Official Campus App
            </span>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Campus Bites
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Order food from campus vendors without waiting in line.
            </p>
          </div>
          <Link
            href="/orders"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            📋 Track My Orders
          </Link>
        </div>

        {/* Vendors Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
            Available Vendors
          </h2>

          {loading ? (
            <p className="text-gray-500 text-sm">Loading campus vendors...</p>
          ) : vendors.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {vendors.map((vendor) => {
                const vendorId = vendor.id || 'v1';
                return (
                  <div
                    key={vendorId}
                    className="p-4 border border-gray-200 rounded-lg hover:border-emerald-500 transition-colors flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">{vendor.name}</h3>
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            vendor.is_open ? 'bg-emerald-500' : 'bg-red-400'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {vendor.is_open ? 'Open for orders' : 'Closed'}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Link
                        href={`/vendor/${vendorId}`}
                        className="flex-1 text-center bg-emerald-600 text-white text-xs font-semibold py-2 px-3 rounded hover:bg-emerald-700 transition-colors"
                      >
                        Order Food
                      </Link>
                      <Link
                        href={`/kitchen/${vendorId}`}
                        className="text-center bg-gray-100 text-gray-700 text-xs font-semibold py-2 px-3 rounded hover:bg-gray-200 transition-colors"
                      >
                        KDS View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-500 text-sm">No vendors listed yet.</p>
              <Link
                href="/vendor/v1"
                className="inline-block bg-emerald-600 text-white text-xs font-semibold py-2 px-4 rounded hover:bg-emerald-700 transition-colors"
              >
                View Default Menu (v1)
              </Link>
            </div>
          )}

          <hr className="border-gray-100" />

          {/* Quick Links */}
          <div className="flex gap-3">
            <Link
              href="/vendor/v1"
              className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-3 px-4 rounded-lg transition-colors"
            >
              Menu Portal
            </Link>
            <Link
              href="/kitchen/v1"
              className="flex-1 text-center bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-3 px-4 rounded-lg transition-colors"
            >
              Kitchen Display
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}