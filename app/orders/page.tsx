'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function OrderSlipPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [slip, setSlip] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem(`order_${orderId}`);
    if (data) {
      setSlip(JSON.parse(data));
    }
  }, [orderId]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white text-neutral-950 p-6 rounded-3xl space-y-6 shadow-2xl border-4 border-orange-500 relative overflow-hidden">
        
        {/* Top Decorative Banner */}
        <div className="bg-orange-500 text-neutral-950 font-black py-2 text-center text-xs uppercase tracking-widest -mx-6 -mt-6">
          📷 Take Screenshot for Counter
        </div>

        {/* Header */}
        <div className="text-center border-b border-dashed border-neutral-300 pb-4 space-y-1">
          <div className="w-10 h-10 bg-neutral-950 text-orange-500 rounded-xl flex items-center justify-center mx-auto font-black text-xl mb-2">
            C
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            {slip?.vendorName || 'CampusCrunch'}
          </h1>
          <p className="text-xs text-neutral-500 font-mono">ORDER SLIP #{orderId}</p>
          <p className="text-[10px] text-neutral-400 font-mono">{slip?.date} • {slip?.timestamp}</p>
        </div>

        {/* Instructions */}
        <div className="bg-orange-100 text-orange-950 p-3 rounded-xl text-center space-y-0.5 border border-orange-200">
          <p className="text-xs font-black uppercase tracking-wider">Payment Method: Cash / Card at Counter</p>
          <p className="text-[11px] text-orange-800">Show this slip to the cashier to pay & collect food.</p>
        </div>

        {/* Itemized Receipt Table */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
            Item Breakdown
          </p>
          <div className="space-y-2 text-xs font-mono">
            {slip?.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center border-b border-neutral-100 pb-1.5">
                <span className="font-bold">
                  {item.qty}x {item.name}
                </span>
                <span className="font-bold">R{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total Price */}
        <div className="flex justify-between items-center pt-2 border-t-2 border-neutral-950 text-lg font-black font-mono">
          <span>TOTAL DUE:</span>
          <span className="text-orange-600 text-xl">R{slip?.total?.toFixed(2)}</span>
        </div>

        {/* Fake Barcode SVG for Cashier Scanning */}
        <div className="pt-2 text-center space-y-1">
          <div className="h-10 bg-neutral-950 rounded flex justify-between items-center px-4 overflow-hidden">
            <div className="h-full w-1 bg-white inline-block"></div>
            <div className="h-full w-2 bg-white inline-block"></div>
            <div className="h-full w-1 bg-white inline-block"></div>
            <div className="h-full w-3 bg-white inline-block"></div>
            <div className="h-full w-1 bg-white inline-block"></div>
            <div className="h-full w-2 bg-white inline-block"></div>
            <div className="h-full w-4 bg-white inline-block"></div>
            <div className="h-full w-1 bg-white inline-block"></div>
          </div>
          <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">
            Present Slip to Kitchen Cashier
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <Link
          href="/"
          className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider border border-neutral-800 transition-colors"
        >
          ← Back to Main Menu
        </Link>
      </div>
    </main>
  );
}