'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  is_available: boolean;
}

export default function VendorMenuPage({
  params,
}: {
  params: Promise<{ vendorId: string }>;
}) {
  const resolvedParams = use(params);
  const vendorId = resolvedParams.vendorId || 'v1';

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'snapscan' | 'cash'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('vendor_id', vendorId);

        if (error) {
          console.error('Error fetching menu:', error.message);
        } else if (data) {
          setItems(data);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, [vendorId]);

  const handlePayAndOrder = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    setOrderMessage(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          itemName: selectedItem.name,
          price: selectedItem.price,
          paymentMethod,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Payment failed');
      }

      setOrderMessage(`Payment successful! Order placed for ${selectedItem.name}.`);
      setSelectedItem(null);
    } catch (err: any) {
      setOrderMessage(err.message || 'Payment processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <span className="text-xs font-extrabold tracking-widest text-emerald-600 uppercase">
              Campus Bites Menu
            </span>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              Vendor Menu ({vendorId})
            </h1>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Order Success/Error Banner */}
        {orderMessage && (
          <div
            className={`p-4 rounded-lg text-xs font-bold ${
              orderMessage.startsWith('Payment successful')
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {orderMessage}
          </div>
        )}

        {/* Menu Items */}
        {loading ? (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-center">
            <p className="text-gray-500 text-sm">Loading food menu...</p>
          </div>
        ) : items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                    <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-0.5 rounded">
                      R{Number(item.price).toFixed(2)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setSelectedItem(item)}
                  disabled={!item.is_available}
                  className={`w-full py-2 px-4 rounded-lg text-xs font-bold transition-colors ${
                    item.is_available
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {item.is_available ? 'Proceed to Checkout' : 'Currently Unavailable'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-center">
            <p className="text-gray-600 text-sm font-medium">No menu items found.</p>
          </div>
        )}

        {/* Payment Checkout Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-lg font-bold text-gray-900">Checkout & Payment</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-700">{selectedItem.name}</span>
                  <span className="font-bold text-gray-900">R{Number(selectedItem.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 border-t pt-2">
                  <span>Total Amount</span>
                  <span className="font-extrabold text-emerald-600 text-sm">
                    R{Number(selectedItem.price).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 text-xs font-bold rounded-lg border transition-all ${
                      paymentMethod === 'card'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    💳 Credit/Debit Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod('snapscan')}
                    className={`p-3 text-xs font-bold rounded-lg border transition-all ${
                      paymentMethod === 'snapscan'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    📱 SnapScan / QR
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 text-xs font-bold rounded-lg border transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    💵 Cash on Pickup
                  </button>
                </div>
              </div>

              <button
                onClick={handlePayAndOrder}
                disabled={isProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {isProcessing
                  ? 'Processing Payment...'
                  : `Pay R${Number(selectedItem.price).toFixed(2)} & Complete Order`}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}