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

// Vendor PIN mappings (Default PIN: 1234)
const VENDOR_PINS: Record<string, string> = {
  v1: '1234',
  v2: '5678',
};

export default function KitchenDisplayPage({
  params,
}: {
  params: Promise<{ vendorId: string }>;
}) {
  const resolvedParams = use(params);
  const vendorId = resolvedParams.vendorId || 'v1';

  // PIN Auth State
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = VENDOR_PINS[vendorId] || '1234';

    if (pinInput === correctPin) {
      setIsAuthenticated(true);
      setPinError(null);
    } else {
      setPinError('Incorrect PIN. Try default PIN: 1234');
      setPinInput('');
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
    if (!isAuthenticated) return;

    fetchOrders();

    const channel = supabase
      .channel(`kds-orders-${vendorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, isAuthenticated]);

  const updateOrderStatus = async (order: Order, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);

    // Trigger SMS notification when marked Ready
    if (newStatus === 'ready' && order.customer_phone) {
      try {
        await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: order.customer_phone,
            customerName: order.customer_name || 'Customer',
            orderId: order.id,
            itemName: order.item_name,
          }),
        });
      } catch (err) {
        console.error('Failed to dispatch SMS:', err);
      }
    }

    fetchOrders();
  };

  // STEP 1: PIN Authentication Screen
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-6 text-center shadow-2xl">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950 px-2 py-1 rounded">
              Kitchen Protection
            </span>
            <h1 className="text-2xl font-bold text-white mt-2">Vendor PIN Required</h1>
            <p className="text-slate-400 text-xs mt-1">
              Enter 4-digit PIN for Vendor <span className="text-white font-mono">{vendorId}</span>
            </p>
          </div>

          {pinError && (
            <div className="p-2.5 bg-red-950/80 border border-red-500/50 rounded-lg text-xs font-bold text-red-300">
              {pinError}
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              required
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className="w-full text-center text-3xl font-mono tracking-widest py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-emerald-500"
            />

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 rounded-xl transition-colors"
            >
              Unlock Kitchen View
            </button>
          </form>

          <Link
            href="/"
            className="block text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Cancel & Return Home
          </Link>
        </div>
      </main>
    );
  }

  // STEP 2: Authenticated Kitchen Display
  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top KDS Header */}
        <div className="flex justify-between items-center border-b border-slate-700 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">Kitchen Display & Dispatch</h1>
            <p className="text-slate-400 text-xs">Vendor ID: {vendorId} • Active Kitchen Session</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAuthenticated(false)}
              className="bg-slate-800 text-slate-300 text-xs px-3 py-2 rounded border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              🔒 Lock KDS
            </button>
            <Link
              href="/"
              className="bg-slate-800 text-slate-300 text-xs px-3 py-2 rounded border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              ← Home
            </Link>
          </div>
        </div>

        {/* Live Orders Display */}
        {orders.length === 0 ? (
          <div className="bg-slate-950/50 border border-slate-800 p-12 rounded-2xl text-center space-y-2">
            <p className="text-slate-300 font-bold text-base">No active kitchen orders</p>
            <p className="text-slate-500 text-xs">New student orders will appear here automatically.</p>
          </div>
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
                    <span className="font-mono font-bold text-white">Order #{order.id}</span>
                    <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <h3 className="font-bold text-lg text-white mt-3">{order.item_name}</h3>
                  <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                    R{Number(order.price).toFixed(2)}
                  </p>

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
                      onClick={() => updateOrderStatus(order, 'preparing')}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order, 'ready')}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
                    >
                      Mark Ready (Send SMS)
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order, 'completed')}
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