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

interface CartItem extends MenuItem {
  quantity: number;
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
  const [activeQueueCount, setActiveQueueCount] = useState(0);

  // Cart & Checkout State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Menu Items
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('vendor_id', vendorId);

      if (menuData) setItems(menuData);

      // 2. Calculate Active Queue Count (Pending + Preparing)
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorId)
        .in('status', ['pending', 'preparing']);

      setActiveQueueCount(count || 0);
      setLoading(false);
    }

    fetchData();

    // Real-time queue count sync
    const channel = supabase
      .channel(`queue-count-${vendorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendorId)
          .in('status', ['pending', 'preparing']);

        setActiveQueueCount(count || 0);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId]);

  // Dynamic wait time estimate (e.g., base 5 mins + 3 mins per order ahead)
  const estimatedWaitMins = Math.max(5, activeQueueCount * 3);

  // Cart Operations
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.id === item.id);
      if (existing) {
        return prev.map((ci) => (ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => (ci.id === itemId ? { ...ci, quantity: ci.quantity + delta } : ci))
        .filter((ci) => ci.quantity > 0)
    );
  };

  const cartTotalCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);
  const cartTotalPrice = cart.reduce((sum, ci) => sum + ci.price * ci.quantity, 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsProcessing(true);
    const itemSummary = cart.map((ci) => `${ci.quantity}x ${ci.name}`).join(', ');

    const { data } = await supabase
      .from('orders')
      .insert([
        {
          vendor_id: vendorId,
          item_name: itemSummary,
          price: cartTotalPrice,
          items: cart,
          notes: notes.trim(),
          status: 'pending',
          customer_name: customerName,
          customer_phone: customerPhone,
        },
      ])
      .select()
      .single();

    if (data) {
      window.location.href = `/orders?id=${data.id}`;
    }
    setIsProcessing(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header & Queue Badge */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <span className="text-xs font-extrabold tracking-widest text-emerald-600 uppercase">
              Campus Bites Menu
            </span>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">Vendor ({vendorId})</h1>
          </div>
          
          {/* Real-time Wait Indicator */}
          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-right">
            <div className="flex items-center gap-1.5 justify-end text-xs font-extrabold text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Est. Wait: ~{estimatedWaitMins} mins
            </div>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
              {activeQueueCount} order{activeQueueCount === 1 ? '' : 's'} ahead in kitchen
            </p>
          </div>
        </div>

        {/* Menu Grid */}
        {loading ? (
          <p className="text-gray-500 text-sm text-center">Loading menu & queue status...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => {
              const inCart = cart.find((ci) => ci.id === item.id);
              return (
                <div key={item.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                      <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-0.5 rounded">
                        R{Number(item.price).toFixed(2)}
                      </span>
                    </div>
                    {item.description && <p className="text-xs text-gray-500 mt-2">{item.description}</p>}
                  </div>

                  {inCart ? (
                    <div className="flex items-center justify-between bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 bg-white font-bold rounded shadow-sm">-</button>
                      <span className="text-xs font-bold text-emerald-900">{inCart.quantity} in Cart</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 bg-emerald-600 text-white font-bold rounded shadow-sm">+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      disabled={!item.is_available}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-xs font-bold"
                    >
                      {item.is_available ? 'Add to Cart' : 'Sold Out'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Sticky Cart */}
      {cartTotalCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 max-w-xl mx-auto px-4 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-2xl flex items-center justify-between"
          >
            <span>View Basket ({cartTotalCount})</span>
            <span>R{cartTotalPrice.toFixed(2)} →</span>
          </button>
        </div>
      )}

      {/* Checkout Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Checkout</h3>
            <form onSubmit={handlePlaceOrder} className="space-y-3">
              <input type="text" required placeholder="Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm" />
              <input type="tel" required placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm" />
              <input type="text" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm" />
              <button type="submit" disabled={isProcessing} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm">
                {isProcessing ? 'Placing Order...' : `Place Order (R${cartTotalPrice.toFixed(2)})`}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}