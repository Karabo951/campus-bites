'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  is_available: boolean;
}

export default function VendorMenuPage({
  params,
}: {
  params: Promise<{ vendorId: string }>;
}) {
  const resolvedParams = use(params);
  const vendorId = resolvedParams.vendorId || 'v1';

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('vendor_id', vendorId);

        if (error) {
          console.error('Error fetching menu:', error.message);
        } else if (data) {
          setItems(data);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, [vendorId]);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <span className="text-xs font-extrabold tracking-widest text-emerald-600 uppercase">
              Campus Bites Menu
            </span>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              Main Campus Grill
            </h1>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Menu Items Container */}
        {loading ? (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-center">
            <p className="text-gray-500 text-sm">Loading food menu...</p>
          </div>
        ) : items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                    <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-0.5 rounded">
                      R{Number(item.price).toFixed(2)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <button
                  disabled={!item.is_available}
                  className={`w-full py-2 px-4 rounded-lg text-xs font-bold transition-colors ${
                    item.is_available
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {item.is_available ? 'Add to Order' : 'Currently Unavailable'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-center space-y-3">
            <p className="text-gray-600 text-sm font-medium">No menu items found for this vendor.</p>
            <p className="text-xs text-gray-400">
              Ensure you have added items to your Supabase <code className="bg-gray-100 px-1 py-0.5 rounded">menu_items</code> table linked to vendor ID: <strong className="text-gray-700">{vendorId}</strong>
            </p>
          </div>
        )}

      </div>
    </main>
  );
}