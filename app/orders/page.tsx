'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Order {
  id: number;
  item_name: string;
  price: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  payment_status: string;
  payment_method: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
}

export default function OrderTrackerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const fetchMyOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (user) {
      setUserEmail(user.email || null);
      query = query.eq('user_id', user.id);
    } else {
      query = query.limit(10);
    }

    const { data } = await query;
    if (data) setOrders(data);
  };

  useEffect(() => {
    fetchMyOrders();

    const channel = supabase
      .channel('customer-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () =>
        fetchMyOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    fetchMyOrders();
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Navigation & User Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Campus Orders</h1>
            {userEmail ? (
              <p className="text-xs text-gray-500 mt-0.5">Logged in as <span className="font-bold text-gray-700">{userEmail}</span></p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5">Showing recent device orders. <Link href="/login" className="text-emerald-600 font-bold hover:underline">Log in</Link> to save order history.</p>
            )}
          </div>
          
          <div className="flex gap-2">
            {userEmail ? (
              <button onClick={handleLogout} className="text-xs font-semibold bg-gray-200 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-300 transition-colors">
                Log Out
              </button>
            ) : (
              <Link href="/login" className="text-xs font-semibold bg-emerald-600 text-white py-2 px-3 rounded-lg hover:bg-emerald-700 transition-colors">
                Log In
              </Link>
            )}
            <Link href="/" className="text-xs font-semibold bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
              ← Menu
            </Link>
          </div>
        </div>

        {/* Order Details List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
              <p className="text-gray-500 text-sm">No order history found.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white p-5 rounded-xl border border-gray-200 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-base">{order.item_name}</h3>
                      <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {order.payment_status || 'Paid'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Order #{order.id} • {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded bg-gray-100 text-gray-700">
                    {order.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-500 ${
                      order.status === 'pending'
                        ? 'w-1/3 bg-amber-500'
                        : order.status === 'preparing'
                        ? 'w-2/3 bg-blue-500'
                        : 'w-full bg-emerald-500'
                    }`}
                  />
                </div>

                {/* Order Details Card */}
                <div className="bg-gray-50 p-3 rounded-lg grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-semibold block text-gray-400 uppercase text-[10px]">Customer</span>
                    <span>{order.customer_name || 'Guest'} ({order.customer_phone || 'N/A'})</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-gray-400 uppercase text-[10px]">Payment Method</span>
                    <span className="capitalize">{order.payment_method || 'Card'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}