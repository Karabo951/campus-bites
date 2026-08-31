'use client';
import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';

interface OrderDetails {
  id: string;
  order_number: number;
  student_name: string;
  total_amount: number;
  status: 'pending' | 'ready' | 'completed';
}

export default function OrderStatusPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<OrderDetails | null>(null);

  useEffect(() => {
    // 1. Initial Order Fetch
    supabase
      .from('orders')
      .select('*')
      .eq('id', resolvedParams.orderId)
      .single()
      .then(({ data }) => {
        if (data) setOrder(data);
      });

    // 2. Real-time Status Subscription
    const channel = supabase
      .channel('order-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${resolvedParams.orderId}`,
        },
        (payload) => {
          setOrder(payload.new as OrderDetails);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedParams.orderId]);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans text-slate-500 font-bold">
        Loading order status...
      </div>
    );
  }

  const getStepColor = (targetStatus: string) => {
    if (order.status === 'completed') return 'bg-emerald-600 text-white';
    if (order.status === 'ready' && (targetStatus === 'pending' || targetStatus === 'ready'))
      return 'bg-emerald-600 text-white';
    if (order.status === 'pending' && targetStatus === 'pending') return 'bg-amber-500 text-white animate-pulse';
    return 'bg-slate-200 text-slate-500';
  };

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 font-sans text-slate-900 bg-slate-50">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center mb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Order Number</p>
        <h1 className="text-6xl font-black text-slate-900 my-2">#{order.order_number}</h1>
        <p className="text-slate-600 font-medium">Customer: <span className="font-bold text-slate-800">{order.student_name}</span></p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <h2 className="font-bold text-lg text-slate-800 mb-4">Live Order Progress</h2>

        {/* Step 1: Received */}
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${getStepColor('pending')}`}>
            1
          </div>
          <div>
            <p className="font-bold text-slate-800">Order Received</p>
            <p className="text-xs text-slate-500">The kitchen has received your order</p>
          </div>
        </div>

        {/* Step 2: Ready */}
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${getStepColor('ready')}`}>
            2
          </div>
          <div>
            <p className="font-bold text-slate-800">Ready for Pickup</p>
            <p className="text-xs text-slate-500">Head to the counter to collect</p>
          </div>
        </div>

        {/* Step 3: Collected */}
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${getStepColor('completed')}`}>
            3
          </div>
          <div>
            <p className="font-bold text-slate-800">Order Complete</p>
            <p className="text-xs text-slate-500">Food collected and enjoyed!</p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-400">Total Paid: <span className="font-bold text-slate-700">R{Number(order.total_amount).toFixed(2)}</span></p>
      </div>
    </div>
  );
}