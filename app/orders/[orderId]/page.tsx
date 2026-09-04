'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function OrderStatusPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-8 rounded-3xl space-y-6 text-center shadow-2xl">
        <div className="w-16 h-16 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-orange-500/30">
          ✓
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
            Order Confirmed
          </span>
          <h1 className="text-2xl font-black text-white mt-1">Order #{orderId?.slice(0, 8)}</h1>
          <p className="text-xs text-neutral-400 mt-2">
            Your order has been sent to the kitchen and is being prepared!
          </p>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex justify-between items-center text-xs">
          <span className="text-neutral-400 font-medium">Status</span>
          <span className="text-orange-400 font-bold uppercase tracking-wider bg-orange-950/50 px-3 py-1 rounded-lg border border-orange-800/50">
            Pending / In Kitchen
          </span>
        </div>

        <Link
          href="/"
          className="block w-full bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </main>
  );
}