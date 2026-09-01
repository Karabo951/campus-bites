'use client';

import { useEffect, useState } from 'react';
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

export default function OrderTrackerPage() {
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState<'id' | 'phone'>('id');
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setLoading(true);
    setHasSearched(true);

    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (activeTab === 'id') {
      const parsedId = parseInt(searchInput.trim(), 10);
      if (!isNaN(parsedId)) {
        query = query.eq('id', parsedId);
      }
    } else {
      query = query.ilike('customer_phone', `%${searchInput.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching orders:', error.message);
    } else if (data) {
      setOrders(data);
    }
    setLoading(false);
  };

  // Real-time subscription to auto-update order statuses
  useEffect(() => {
    if (orders.length === 0) return;

    const channel = supabase
      .channel('public-order-tracker')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updatedOrder = payload.new as Order;
          setOrders((prev) =>
            prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orders]);

  const getStepStatus = (currentStatus: Order['status'], targetStep: Order['status']) => {
    const steps: Order['status'][] = ['pending', 'preparing', 'ready', 'completed'];
    const currentIndex = steps.indexOf(currentStatus);
    const targetIndex = steps.indexOf(targetStep);

    if (currentIndex > targetIndex) return 'completed';
    if (currentIndex === targetIndex) return 'active';
    return 'upcoming';
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <span className="text-xs font-extrabold tracking-widest text-emerald-600 uppercase">
              Live Order Status
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Campus Order Tracker</h1>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-100 transition-colors"
          >
            ← Home
          </Link>
        </div>

        {/* Search Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => { setActiveTab('id'); setSearchInput(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'id' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Search by Order ID
            </button>
            <button
              onClick={() => { setActiveTab('phone'); setSearchInput(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'phone' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Search by Phone Number
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type={activeTab === 'id' ? 'number' : 'tel'}
              required
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={activeTab === 'id' ? 'Enter Order ID (e.g. 12)' : 'Enter Phone Number'}
              className="flex-1 p-3 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-emerald-500 font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 rounded-xl shadow transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>
        </div>

        {/* Order Tracker Results */}
        {hasSearched && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-500 text-sm">
                No orders found matching your search.
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6"
                >
                  {/* Order Top Bar */}
                  <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                    <div>
                      <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                        ORDER #{order.id}
                      </span>
                      <h2 className="text-sm font-bold text-gray-900 mt-2">
                        Vendor: <span className="uppercase">{order.vendor_id}</span>
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block">Total Paid</span>
                      <span className="text-sm font-black text-gray-900">
                        R{Number(order.price).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                      <span className={getStepStatus(order.status, 'pending') !== 'upcoming' ? 'text-emerald-600' : 'text-gray-400'}>
                        1. Received
                      </span>
                      <span className={getStepStatus(order.status, 'preparing') !== 'upcoming' ? 'text-blue-600' : 'text-gray-400'}>
                        2. Preparing
                      </span>
                      <span className={getStepStatus(order.status, 'ready') !== 'upcoming' ? 'text-emerald-600' : 'text-gray-400'}>
                        3. Ready
                      </span>
                      <span className={getStepStatus(order.status, 'completed') !== 'upcoming' ? 'text-gray-700' : 'text-gray-400'}>
                        4. Collected
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-500 ${
                          order.status === 'pending'
                            ? 'w-1/4 bg-amber-500'
                            : order.status === 'preparing'
                            ? 'w-2/4 bg-blue-500'
                            : order.status === 'ready'
                            ? 'w-3/4 bg-emerald-500'
                            : 'w-full bg-gray-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Live Callout Banner */}
                  {order.status === 'ready' && (
                    <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-center space-y-1 animate-pulse">
                      <p className="text-emerald-900 font-extrabold text-sm">
                        🎉 Your order is ready for pickup!
                      </p>
                      <p className="text-emerald-700 text-xs">
                        Head over to vendor <span className="font-bold uppercase">{order.vendor_id}</span> to collect your meal.
                      </p>
                    </div>
                  )}

                  {/* Itemized Details */}
                  <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100 text-xs">
                    <span className="text-gray-400 uppercase text-[10px] font-bold">Items:</span>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between font-bold text-gray-800">
                          <span>{item.quantity}x {item.name}</span>
                          <span>R{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="font-bold text-gray-800">{order.item_name}</p>
                    )}

                    {order.notes && (
                      <div className="pt-2 border-t border-gray-200/60 mt-2">
                        <span className="text-gray-400 uppercase text-[10px] font-bold">Notes:</span>
                        <p className="font-semibold text-amber-700">{order.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </main>
  );
}