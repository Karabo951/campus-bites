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
  item_name: string;
  price: number;
  items?: CartItem[];
  notes?: string;
  customer_name?: string;
  customer_phone?: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  created_at: string;
}

const VENDOR_PINS: Record<string, string> = { v1: '1234', v2: '5678' };

export default function KitchenDisplayPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const resolvedParams = use(params);
  const vendorId = resolvedParams.vendorId || 'v1';

  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('vendor_id', vendorId)
      .neq('status', 'completed')
      .order('created_at', { ascending: true });

    if (data) setOrders(data);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders();

    const channel = supabase
      .channel(`kds-${vendorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [vendorId, isAuthenticated]);

  const updateOrderStatus = async (order: Order, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);

    // Auto-dispatch SMS on "Ready"
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
        console.error('SMS notification error:', err);
      }
    }

    fetchOrders();
  };

  const activeCount = orders.filter((o) => o.status === 'pending' || o.status === 'preparing').length;

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={(e) => { e.preventDefault(); if (pinInput === (VENDOR_PINS[vendorId] || '1234')) setIsAuthenticated(true); }} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 max-w-sm w-full text-center">
          <h1 className="text-xl font-bold text-white">Enter Kitchen PIN</h1>
          <input type="password" maxLength={4} autoFocus value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="••••" className="w-full text-center text-3xl font-mono py-2 bg-slate-950 border border-slate-700 text-white rounded-xl" />
          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm">Unlock Kitchen</button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* KDS Header with Live Queue Meter */}
        <div className="flex justify-between items-center border-b border-slate-700 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">Kitchen Display System</h1>
            <p className="text-slate-400 text-xs">Vendor: <span className="uppercase font-mono">{vendorId}</span></p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-right">
              <span className="text-xs text-slate-400 block font-bold">ACTIVE QUEUE</span>
              <span className="text-sm font-bold text-amber-400">{activeCount} Pending (~{Math.max(5, activeCount * 3)}m wait)</span>
            </div>
            <button onClick={() => setIsAuthenticated(false)} className="bg-slate-800 text-xs px-3 py-2 rounded border border-slate-700">🔒 Lock</button>
          </div>
        </div>

        {/* Live Orders */}
        <div className="grid gap-4 md:grid-cols-3">
          {orders.map((order) => (
            <div key={order.id} className={`p-4 rounded-xl border space-y-4 ${
              order.status === 'pending' ? 'bg-amber-950/40 border-amber-500/50' : order.status === 'preparing' ? 'bg-blue-950/40 border-blue-500/50' : 'bg-emerald-950/40 border-emerald-500/50'
            }`}>
              <div className="flex justify-between text-xs border-b border-slate-700 pb-2">
                <span className="font-bold text-white font-mono">#{order.id}</span>
                <span className="uppercase font-extrabold text-[10px] px-2 py-0.5 rounded bg-slate-800">
                  {order.status}
                </span>
              </div>

              <div className="space-y-1">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm font-bold text-white">
                    <span>{item.quantity}x {item.name}</span>
                  </div>
                )) || <p className="font-bold text-white">{order.item_name}</p>}
              </div>

              {order.notes && <p className="text-xs bg-amber-900/60 p-2 rounded text-amber-200">Note: {order.notes}</p>}

              <div className="flex gap-2 pt-2">
                {order.status === 'pending' && (
                  <button onClick={() => updateOrderStatus(order, 'preparing')} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-lg">
                    Start Preparing ➔
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button onClick={() => updateOrderStatus(order, 'ready')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg">
                    Mark Ready (Send SMS) ➔
                  </button>
                )}
                {order.status === 'ready' && (
                  <button onClick={() => updateOrderStatus(order, 'completed')} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold py-2.5 rounded-lg">
                    Complete Ticket
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