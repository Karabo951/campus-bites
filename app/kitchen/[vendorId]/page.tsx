'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  vendor_id: string;
  item_name: string;
  price: number;
  items?: CartItem[];
  notes?: string;
  customer_name?: string;
  customer_phone?: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  created_at: string;
}

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

  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders from Supabase
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('vendor_id', vendorId)
      .neq('status', 'completed')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching kitchen orders:', error.message);
    } else if (data) {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchOrders();

    // Supabase Real-time updates for active kitchen tickets
    const channel = supabase
      .channel(`kds-channel-${vendorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, isAuthenticated]);

  // Robust status update handler with optimistic UI updates & error handling
  const updateOrderStatus = async (order: Order, newStatus: Order['status']) => {
    // 1. Optimistically update UI state immediately for instant button feedback
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
    );

    // 2. Send state change to Supabase database
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id);

    if (error) {
      console.error('Supabase update failed:', error.message);
      alert(`Failed to update order status: ${error.message}`);
      // Revert UI to database state if update fails
      fetchOrders();
      return;
    }

    // 3. Trigger SMS API when marked Ready
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
      } catch (smsErr) {
        console.error('SMS trigger error:', smsErr);
      }
    }

    fetchOrders();
  };

  // PIN Authentication Screen
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const expectedPin = VENDOR_PINS[vendorId] || '1234';
            if (pinInput === expectedPin) {
              setIsAuthenticated(true);
            } else {
              alert('Incorrect Kitchen PIN!');
            }
          }}
          className="bg-slate-900 border border-slate-800 p-8 rounded-2xl space-y-4 max-w-sm w-full text-center shadow-2xl"
        >
          <div className="text-3xl">🔒</div>
          <h1 className="text-xl font-bold text-white">Kitchen Display System</h1>
          <p className="text-xs text-slate-400">
            Enter 4-digit PIN for vendor <span className="uppercase font-bold text-emerald-400">{vendorId}</span>
          </p>
          <input
            type="password"
            maxLength={4}
            autoFocus
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="••••"
            className="w-full text-center text-3xl font-mono tracking-widest py-3 bg-slate-950 border border-slate-700 text-white rounded-xl focus:outline-emerald-500"
          />
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors"
          >
            Unlock Kitchen Display
          </button>
        </form>
      </main>
    );
  }

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const activeCount = pendingCount + preparingCount;
  const estimatedWaitMins = Math.max(5, activeCount * 3);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* KDS Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h1 className="text-2xl font-black tracking-wide text-white">
                KITCHEN DISPLAY SYSTEM
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Vendor Unit: <span className="uppercase font-mono text-emerald-400 font-bold">{vendorId}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Queue Indicator Badge */}
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Kitchen Workload
              </span>
              <span className="text-sm font-extrabold text-amber-400">
                {activeCount} Active Ticket{activeCount === 1 ? '' : 's'} (~{estimatedWaitMins}m wait)
              </span>
            </div>

            <button
              onClick={() => setIsAuthenticated(false)}
              className="bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-bold px-3.5 py-3 rounded-xl border border-slate-800 transition-colors"
            >
              🔒 Lock KDS
            </button>
          </div>
        </div>

        {/* Live Active Tickets Grid */}
        {loading ? (
          <p className="text-slate-500 text-sm text-center py-10">Loading active tickets...</p>
        ) : orders.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 text-sm space-y-2">
            <p className="text-2xl">🎉 All clear!</p>
            <p>No active kitchen orders in queue.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 shadow-xl transition-all ${
                  order.status === 'pending'
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-50'
                    : order.status === 'preparing'
                    ? 'bg-blue-950/20 border-blue-500/40 text-blue-50'
                    : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-50'
                }`}
              >
                {/* Header info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="font-mono text-base font-black tracking-wider text-emerald-400">
                        #{order.id}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                        order.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : order.status === 'preparing'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Customer Information */}
                  {(order.customer_name || order.customer_phone) && (
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs space-y-0.5">
                      {order.customer_name && (
                        <p className="font-bold text-slate-200">
                          👤 {order.customer_name}
                        </p>
                      )}
                      {order.customer_phone && (
                        <p className="font-mono text-[11px] text-slate-400">
                          📞 {order.customer_phone}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Itemized Dish Breakdown */}
                  <div className="space-y-1.5 py-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Ordered Items:
                    </span>
                    {order.items && order.items.length > 0 ? (
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm font-bold bg-slate-900/40 p-2 rounded border border-slate-800">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="text-xs text-slate-400 font-mono">
                              R{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-bold bg-slate-900/40 p-2 rounded border border-slate-800">
                        {order.item_name}
                      </p>
                    )}
                  </div>

                  {/* Special Notes */}
                  {order.notes && (
                    <div className="bg-amber-900/30 border border-amber-700/50 p-2.5 rounded-lg text-xs">
                      <span className="text-amber-400 font-bold uppercase text-[9px] block">
                        Special Instructions:
                      </span>
                      <p className="text-amber-200 font-semibold mt-0.5">{order.notes}</p>
                    </div>
                  )}
                </div>

                {/* Ticket Action Workflow Controls */}
                <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order, 'preparing')}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow transition-colors"
                    >
                      Start Preparing ➔
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order, 'ready')}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow transition-colors"
                    >
                      Mark Ready (Send SMS) ➔
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order, 'completed')}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs uppercase tracking-wider border border-slate-700 transition-colors"
                    >
                      Complete & Clear Ticket
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