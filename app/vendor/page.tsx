'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  is_available: boolean;
}

export default function VendorPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true);

        if (error) {
          console.error('Error loading menu:', error.message);
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
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header & Navigation */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              Main Campus Grill
            </h1>
            <p className="text-xs text-neutral-400">Select items to place your order</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="bg-neutral-900 border border-neutral-800 text-xs font-bold px-3 py-2 rounded-xl text-orange-400 hover:text-orange-300 transition-colors"
            >
              📋 My Orders
            </Link>
            <Link
              href="/"
              className="bg-neutral-900 border border-neutral-800 text-xs font-bold px-3 py-2 rounded-xl text-neutral-300 hover:text-white"
            >
              ← Home
            </Link>
          </div>
        </div>

        {/* Menu Items */}
        {loading ? (
          <p className="text-neutral-500 text-xs font-mono">Loading food menu...</p>
        ) : items.length > 0 ? (
          <div className="grid gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-5 bg-neutral-900 rounded-2xl border border-neutral-800 shadow-sm flex justify-between items-center"
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-sm">{item.name}</h3>
                  <p className="text-xs text-neutral-400">{item.description}</p>
                  <p className="text-sm font-bold font-mono text-orange-400 pt-1">
                    R{item.price.toFixed(2)}
                  </p>
                </div>
                <button
                  disabled={!item.is_available}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors ${
                    item.is_available
                      ? 'bg-orange-500 text-neutral-950 hover:bg-orange-600'
                      : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  {item.is_available ? '+ Add' : 'Sold Out'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl text-center">
            <p className="text-neutral-400 text-xs">No active menu items available right now.</p>
          </div>
        )}
      </div>
    </main>
  );
}