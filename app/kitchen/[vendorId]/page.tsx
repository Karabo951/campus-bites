'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  vendor_id: string;
  item_name: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  created_at: string;
}

const DEFAULT_KITCHEN_PIN = '1234'; // Default lock PIN

export default function KitchenDisplayPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Check saved lock state on load
  useEffect(() => {
    const savedAuth = localStorage.getItem('kds_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch orders and subscribe to live realtime updates when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchOrders() {
      setLoading(true);
      const { data } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'completed')
        .order('created_at', { ascending: true });

      if (data) setOrders(data as Order[]);
      setLoading(false);
    }

    fetchOrders();

    const subscription = supabase
      .channel('kitchen_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [...prev, payload.new as Order]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Order;
            if (updated.status === 'completed') {
              setOrders((prev) => prev.filter((o) => o.id !== updated.id));
            } else {
              setOrders((prev) =>
                prev.map((o) => (o.id === updated.id ? updated : o))
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isAuthenticated]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === DEFAULT_KITCHEN_PIN) {
      setIsAuthenticated(true);
      localStorage.setItem('kds_authenticated', 'true');
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('kds_authenticated');
  };

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus: 'preparing' | 'ready' | 'completed' = 'preparing';
    if (currentStatus === 'pending') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'completed';

    // Optimistic UI update
    setOrders((prev) =>
      nextStatus === 'completed'
        ? prev.filter((o) => o.id !== orderId)
        : prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    // Database update
    const { error } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', orderId);

    if (error) {
      console.error('Failed to update status in Supabase:', error.message);
      alert(`Status update failed: ${error.message}`);

      // Revert optimistic state on failure
      const { data } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'completed')
        .order('created_at', { ascending: true });
      if (data) setOrders(data as Order[]);
    }
  };

  const getButtonLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'START PREPARING →';
      case 'preparing':
        return 'MARK AS READY →';
      case 'ready':
        return 'COMPLETE ORDER ✓';
      default:
        return 'UPDATE STATUS';
    }
  };

  const getButtonClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'preparing':
        return 'bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black';
      case 'ready':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-neutral-800 text-white';
    }
  };

  // PIN Access Modal Gate
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            🔒
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-white">
              Kitchen Display System
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Enter staff PIN to access active orders
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN (Default: 1234)"
              className="w-full bg-neutral-950 border border-neutral-800 text-center text-2xl tracking-[0.5em] font-mono py-3 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
            {pinError && (
              <p className="text-xs text-red-400 font-bold">Incorrect PIN. Try 1234.</p>
            )}
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black py-3 rounded-xl uppercase tracking-wider text-xs transition-colors"
            >
              Unlock Display
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="border-b border-neutral-800 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-wider uppercase">
              Kitchen Display System
            </h1>
            <p className="text-xs text-emerald-400 font-mono">Vendor Unit: V1</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl text-center">
              <span className="text-[10px] text-neutral-400 block uppercase font-bold">
                Active Tickets
              </span>
              <span className="text-sm font-black text-amber-400 font-mono">
                {orders.length} Tickets
              </span>
            </div>
            <button
              onClick={handleLock}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              🔒 Lock KDS
            </button>
          </div>
        </header>

        {loading ? (
          <p className="text-neutral-500 text-sm">Loading tickets...</p>
        ) : orders.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 p-12 rounded-2xl text-center text-neutral-500 font-bold">
            No active orders in kitchen queue
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl"
              >
                <div>
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                    <span className="font-mono text-lg font-black text-emerald-400">
                      #{order.id}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider ${
                        order.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : order.status === 'preparing'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                      Ordered Items:
                    </p>
                    <div className="bg-neutral-950 p-3 rounded-xl text-sm font-semibold text-neutral-200 border border-neutral-800">
                      {order.item_name || 'Item data pending'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleUpdateStatus(order.id, order.status)}
                  className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg ${getButtonClass(
                    order.status
                  )}`}
                >
                  {getButtonLabel(order.status)}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}