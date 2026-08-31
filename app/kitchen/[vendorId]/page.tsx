'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Order {
  id: number;
  item_name: string;
  price: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  created_at: string;
}

export default function KitchenDisplayPage({
  params,
}: {
  params: Promise<{ vendorId: string }>;
}) {
  const resolvedParams = use(params);
  const vendorId = resolvedParams.vendorId || 'v1';

  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to live Supabase inserts & updates
    const channel = supabase
      .channel('kds-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId]);

  const updateOrderStatus = async (orderId: number, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    fetchOrders();
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-slate-700 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">Kitchen Display System (KDS)</h1>
            <p className="text-slate-400 text-xs">Vendor ID: {vendorId} • Live Updates Active</p>
          </div>
          <Link href="/" className="bg-slate-800 text-slate-300 text-xs px-3 py-2 rounded border border-slate-700">
            ← Main App
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-4 ${
                order.status === 'pending'
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-100'
                  : order.status === 'preparing'
                  ? 'bg-blue-950/40 border-blue-500/50 text-blue-100'
                  : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
              }`}
            >
              <div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Order #{order.id}</span>
                  <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <h3 className="font-bold text-lg text-white mt-2">{order.item_name}</h3>
                <p className="text-xs font-semibold mt-1">R{Number(order.price).toFixed(2)}</p>
              </div>

              <div className="flex gap-2 pt-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded"
                  >
                    Mark Ready for Pickup
                  </button>
                )}
                {order.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold py-2 rounded"
                  >
                    Complete & Archive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}