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
        if (error) console.error('Error fetching vendors:', error.message);
        else if (data) setVendors(data);
      } catch (err) {
        console.error('Unexpected error:', err);
      } font-medium {
        setLoading(false);
      }
    }

    fetchVendors();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-6 border-gray-200">
          <div>
            <span className="text-xs font-extrabold tracking-widest text-emerald-600 uppercase">
              Official Campus App
            </span>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Campus Bites
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Select a vendor to order food or open the kitchen display.
            </p>
          </div>

          <Link
            href="/orders"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-sm transition-colors"
          >
            📋 Track Orders
          </Link>
        </div>

        {/* Vendors List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
            Campus Vendors & Kitchen Portals
          </h2>

          {loading ? (
            <p className="text-gray-500 text-sm">Loading campus vendors...</p>
          ) : vendors.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {vendors.map((vendor) => {
                const targetId = vendor.id || 'v1';
                return (
                  <div
                    key={targetId}
                    className="p-4 border border-gray-200 rounded-lg flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-colors"
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

                    {/* Dual Buttons: Customer View + Kitchen View */}
                    <div className="flex gap-2">
                      <Link
                        href={`/vendor/${targetId}`}
                        className="flex-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-lg transition-colors"
                      >
                        🛒 Order Food
                      </Link>
                      <Link
                        href={`/kitchen/${targetId}`}
                        className="flex-1 text-center bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 px-3 rounded-lg transition-colors"
                      >
                        👨‍🍳 Kitchen View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
              <p className="text-gray-500 text-sm">No vendors listed in database yet.</p>
              <div className="flex gap-2">
                <Link
                  href="/vendor/v1"
                  className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Customer View (v1)
                </Link>
                <Link
                  href="/kitchen/v1"
                  className="bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  Kitchen View (v1)
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}