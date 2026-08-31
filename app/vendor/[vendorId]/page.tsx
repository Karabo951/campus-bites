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

export default function DynamicVendorPage({
  params,
}: {
  params: Promise<{ vendorId: string }>;
}) {
  const resolvedParams = use(params);
  const vendorId = resolvedParams.vendorId;

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

    if (vendorId) {
      fetchMenu();
    }
  }, [vendorId]);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Vendor Menu ({vendorId})
          </h1>
          <Link href="/" className="text-xs text-emerald-600 font-semibold hover:underline">
            ← Back Home
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading food menu...</p>
        ) : items.length > 0 ? (
          <div className="grid gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <p className="text-xs text-gray-500">{item.description}</p>
                  <p className="text-sm font-semibold text-emerald-600 mt-1">
                    R{item.price.toFixed(2)}
                  </p>
                </div>
                <button
                  disabled={!item.is_available}
                  className={`px-3 py-1.5 rounded text-xs font-semibold ${
                    item.is_available
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {item.is_available ? 'Add to Order' : 'Sold Out'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No menu items found for vendor {vendorId}.</p>
        )}
      </div>
    </main>
  );
}