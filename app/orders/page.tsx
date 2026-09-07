'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface SavedOrder {
  id: string;
  item_name: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  created_at: string;
  vendor_id: string;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSavedOrders() {
      setLoading(true);

      // Collect all order IDs stored in localStorage
      const localKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith('order_')
      );
      const orderIds = localKeys.map((key) => key.replace('order_', ''));

      if (orderIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch live status for all customer orders from Supabase
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data as SavedOrder[]);
      }
      setLoading(false);
    }

    loadSavedOrders();
  }, []);

  const getStatusBadge = (status: SavedOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'preparing':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'ready':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed':
        return 'bg-neutral-800 text-neutral-400 border-neutral-700';
      default:
        return 'bg-neutral-800 text-neutral-400 border-neutral-700';
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 sm:p-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-2xl font-black uppercase text-white">My Orders</h1>
            <p className="text-xs text-neutral-400">Track all your active and recent meals</p>
          </div>
          <Link
            href="/"
            className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-bold px-4 py-2 rounded-xl"
          >
            &larr; Home
          </Link>
        </div>

        {loading ? (
          <p className="text-xs text-neutral-500 font-mono">Loading your orders...</p>
        ) : orders.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl text-center space-y-3">
            <p className="text-xs text-neutral-400">No active or past orders found on this device.</p>
            <Link
              href="/"
              className="inline-block bg-orange-500 text-neutral-950 font-black px-4 py-2 rounded-xl text-xs uppercase"
            >
              Order Something Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-black text-white">#{order.id}</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 border rounded-md ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 font-semibold">{order.item_name}</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Link
                    href={`/orders/${order.id}/track`}
                    className="flex-1 sm:flex-none text-center bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black px-4 py-2 rounded-xl text-xs uppercase transition-colors"
                  >
                    Track Status ➔
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}