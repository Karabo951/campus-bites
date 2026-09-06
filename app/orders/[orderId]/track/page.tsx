'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  vendor_id: string;
  item_name: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  customer_name: string;
  customer_phone: string;
  created_at: string;
}

const STEPS: { status: Order['status']; label: string; desc: string }[] = [
  { status: 'pending', label: 'Order Placed', desc: 'Sent to kitchen display' },
  { status: 'preparing', label: 'In Kitchen', desc: 'Chef is preparing your meal' },
  { status: 'ready', label: 'Ready for Pickup', desc: 'Collect at the counter' },
  { status: 'completed', label: 'Completed', desc: 'Enjoy your meal!' },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    // Fetch initial order details
    async function fetchOrder() {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!error && data) {
        setOrder(data as Order);
      }
      setLoading(false);
    }

    fetchOrder();

    // Subscribe to live status updates from Supabase
    const channel = supabase
      .channel(`order_track_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const getStepIndex = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'preparing':
        return 1;
      case 'ready':
        return 2;
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <p className="text-xs text-neutral-400 font-mono">Loading order status...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-sm text-red-400 font-bold">Order #{orderId} not found.</p>
        <Link href="/" className="bg-neutral-900 border border-neutral-800 text-xs px-4 py-2 rounded-xl text-neutral-300">
          Back Home
        </Link>
      </main>
    );
  }

  const currentStep = getStepIndex(order.status);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-8 rounded-3xl space-y-8 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-neutral-800 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Live Tracker</span>
            <h1 className="text-xl font-black font-mono text-white">#{order.id}</h1>
          </div>
          <Link
            href={`/orders/${order.id}`}
            className="bg-neutral-950 border border-neutral-800 text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white"
          >
            View Slip
          </Link>
        </div>

        {/* Customer & Item Info */}
        <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-400">Customer:</span>
            <span className="font-bold text-white">{order.customer_name || 'Guest'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-neutral-400">Items:</span>
            <span className="font-semibold text-neutral-200 text-right">{order.item_name}</span>
          </div>
        </div>

        {/* Vertical Progress Tracker */}
        <div className="space-y-6 relative pl-2">
          {STEPS.map((step, idx) => {
            const isFinished = idx <= currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div key={step.status} className="flex items-start gap-4 relative">
                {/* Connector Line */}
                {idx !== STEPS.length - 1 && (
                  <div
                    className={`absolute left-[15px] top-[30px] w-0.5 h-10 ${
                      idx < currentStep ? 'bg-orange-500' : 'bg-neutral-800'
                    }`}
                  />
                )}

                {/* Status Dot */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold z-10 transition-all ${
                    isCurrent
                      ? 'bg-orange-500 text-neutral-950 ring-4 ring-orange-500/20'
                      : isFinished
                      ? 'bg-emerald-500 text-neutral-950'
                      : 'bg-neutral-950 border border-neutral-800 text-neutral-600'
                  }`}
                >
                  {isFinished && !isCurrent ? '✓' : idx + 1}
                </div>

                {/* Status Label & Description */}
                <div>
                  <h3 className={`text-sm font-bold ${isFinished ? 'text-white' : 'text-neutral-500'}`}>
                    {step.label}
                  </h3>
                  <p className="text-xs text-neutral-500">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Link Home */}
        <Link
          href="/"
          className="block w-full text-center bg-neutral-950 border border-neutral-800 text-neutral-400 font-bold py-3 rounded-xl text-xs uppercase"
        >
          Return to Home
        </Link>
      </div>
    </main>
  );
}