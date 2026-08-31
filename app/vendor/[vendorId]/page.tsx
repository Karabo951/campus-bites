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

interface OrderReceipt {
  id: number;
  itemName: string;
  price: number;
  customerName: string;
  customerPhone: string;
  createdAt: string;
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

  // Customer Contact State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Receipt Slip State
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);

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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (!customerName.trim() || !customerPhone.trim()) {
      setOrderError('Please provide your name and phone number.');
      return;
    }

    setIsProcessing(true);
    setOrderError(null);

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            vendor_id: vendorId,
            item_name: selectedItem.name,
            price: selectedItem.price,
            status: 'pending',
            customer_name: customerName,
            customer_phone: customerPhone,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Show receipt slip
      setReceipt({
        id: data.id,
        itemName: selectedItem.name,
        price: selectedItem.price,
        customerName,
        customerPhone,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      setSelectedItem(null);
    } catch (err: any) {
      console.error('Order submission error:', err);
      setOrderError(err.message || 'Failed to submit order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Navigation */}
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
            ← Home
          </Link>
        </div>

        {/* Menu Grid */}
        {loading ? (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-center">
            <p className="text-gray-500 text-sm">Loading menu items...</p>
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
                  onClick={() => {
                    setSelectedItem(item);
                    setOrderError(null);
                  }}
                  disabled={!item.is_available}
                  className={`w-full py-2 px-4 rounded-lg text-xs font-bold transition-colors ${
                    item.is_available
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {item.is_available ? 'Order Food' : 'Unavailable'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-center">
            <p className="text-gray-600 text-sm font-medium">No menu items found.</p>
          </div>
        )}

        {/* Contact Input Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-lg font-bold text-gray-900">Enter Details for Order</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              {orderError && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-xs font-bold text-red-800">
                  {orderError}
                </div>
              )}

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg flex justify-between text-xs">
                  <span className="font-bold text-gray-700">{selectedItem.name}</span>
                  <span className="font-extrabold text-emerald-600">
                    R{Number(selectedItem.price).toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase">Your Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g., Karabo"
                    className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g., 076 123 4567"
                    className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Placing Order...' : 'Confirm Order'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Digital Slip Modal */}
        {receipt && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-5 border-2 border-dashed border-emerald-500 shadow-2xl">
              
              <div className="text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Campus Bites Receipt Slip
                </span>
                <h2 className="text-2xl font-black text-gray-900">ORDER #{receipt.id}</h2>
                <p className="text-xs text-gray-500">📸 Screenshot this slip for pickup!</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-3 text-xs border border-gray-100">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Item:</span>
                  <span className="font-bold text-gray-900">{receipt.itemName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Price:</span>
                  <span className="font-extrabold text-emerald-600">R{Number(receipt.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-bold text-gray-900">{receipt.customerName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-bold text-gray-900">{receipt.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Placed At:</span>
                  <span className="font-semibold text-gray-700">{receipt.createdAt}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href="/orders"
                  className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition-colors"
                >
                  📋 Track Order Status Live
                </Link>
                <button
                  onClick={() => setReceipt(null)}
                  className="w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs py-2 rounded-xl transition-colors"
                >
                  Done
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}