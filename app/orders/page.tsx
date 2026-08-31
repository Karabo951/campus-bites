'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Order {
  id: number;
  item_name: string;
  price: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  created_at: string;
}

export default function OrderTrackerPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchMyOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

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

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Your Campus Orders</h1>
          <Link href="/" className="text-xs text-emerald-600 font-semibold">
            ← Order More Food
          </Link>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{order.item_name}</h3>
                  <p className="text-xs text-gray-500">Order #{order.id} • R{Number(order.price).toFixed(2)}</p>
                </div>
                <span className="text-xs font-extrabold uppercase px-2 py-1 rounded bg-gray-100 text-gray-700 self-start">
                  {order.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden flex">
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
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}