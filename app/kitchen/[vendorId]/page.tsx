'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Order {
  id: number;
  item_name: string;
  price: number;
  customer_name?: string;
  customer_phone?: string;
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

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('vendor_id', vendorId)
      .neq('status', 'completed')
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('kds-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          playChime();
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
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
            <p className="text-slate-400 text-xs">Vendor ID: {vendorId} • Live Orders & Sound Active</p>
          </div>
          <Link href="/" className="bg-slate-800 text-slate-300 text-xs px-3 py-2 rounded border border-slate-700 hover:bg-slate-700 transition-colors">
            ← Home
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-slate-400 text-sm">No incoming orders right now.</p>
        ) : (
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
                  <div className="flex justify-between text-xs text-slate-400 border-b border-slate-700/50 pb-2">
                    <span className="font-mono">Order #{order.id}</span>
                    <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <h3 className="font-bold text-lg text-white mt-3">{order.item_name}</h3>
                  <p className="text-xs font-semibold text-emerald-400 mt-0.5">R{Number(order.price).toFixed(2)}</p>

                  {/* Customer Contact Details */}
                  <div className="bg-slate-800/80 p-2.5 rounded-lg mt-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Customer:</span>
                      <span className="font-bold text-white">{order.customer_name || 'Guest'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-bold text-amber-400">{order.customer_phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
                    >
                      Mark Ready for Pickup
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold py-2.5 rounded-lg transition-colors"
                    >
                      Complete Ticket
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}