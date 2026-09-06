'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface SlipData {
  orderId: string;
  vendorName: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  timestamp: string;
  date: string;
}

export default function OrderSlipPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  const [slip, setSlip] = useState<SlipData | null>(null);

  useEffect(() => {
    if (orderId) {
      const saved = localStorage.getItem(`order_${orderId}`);
      if (saved) {
        setSlip(JSON.parse(saved));
      }
    }
  }, [orderId]);

  if (!slip) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <p className="text-xs text-neutral-400">Loading Order Slip #{orderId}...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 flex flex-col items-center justify-center">
      <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl">
        {/* Receipt Header */}
        <div className="text-center space-y-1 border-b border-neutral-800 pb-4">
          <h1 className="text-xl font-black uppercase text-white tracking-wider">
            {slip.vendorName}
          </h1>
          <p className="text-xs font-mono text-emerald-400 font-bold">
            Order Slip #{slip.orderId}
          </p>
          <p className="text-[10px] text-neutral-500">
            {slip.date} at {slip.timestamp}
          </p>
        </div>

        {/* Customer Information Block */}
        <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-1">
          <p className="text-[10px] font-bold uppercase text-orange-400 tracking-wider">
            Customer Information
          </p>
          <p className="text-sm font-bold text-white">{slip.customerName}</p>
          <p className="text-xs text-neutral-400">Contact / Table: {slip.customerPhone}</p>
        </div>

        {/* Itemized List */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">
            Items Ordered
          </p>
          {slip.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span className="text-neutral-200">
                {item.name} <strong className="text-orange-400">x{item.qty}</strong>
              </span>
              <span className="font-mono text-neutral-400">
                R{(item.price * item.qty).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Total Price */}
        <div className="border-t border-neutral-800 pt-4 flex justify-between items-center">
          <span className="text-xs font-bold uppercase text-neutral-400">Total Paid</span>
          <span className="text-xl font-black font-mono text-emerald-400">
            R{slip.total.toFixed(2)}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => window.print()}
            className="w-full bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black py-3 rounded-xl text-xs uppercase"
          >
            Print Receipt
          </button>
          <Link
            href="/"
            className="block text-center bg-neutral-950 border border-neutral-800 text-neutral-400 font-bold py-3 rounded-xl text-xs"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}