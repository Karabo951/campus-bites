'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
}

interface Vendor {
  id: string;
  name: string;
  description: string;
}

export default function VendorMenuPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = (params.vendorId as string) || 'v1';

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (vendorData) {
        setVendor(vendorData);
      } else {
        setVendor({
          id: vendorId,
          name: vendorId === 'v1' ? 'CampusCrunch Grill' : 'Crunch Cafe',
          description: 'Delicious food prepared fresh on campus',
        });
      }

      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_available', true);

      if (menuData) {
        setMenuItems(menuData);
      }

      setLoading(false);
    }

    fetchData();
  }, [vendorId]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const totalPrice = cart.reduce(
    (sum, c) => sum + c.item.price * c.quantity,
    0
  );

  const handlePayAtCounter = async () => {const handlePayAtCounter = async () => {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);

    try {
      // 1. Fetch auth user or use null
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || null;

      const orderNum = Math.floor(100000 + Math.random() * 900000);
      const displayOrderId = `CC-${orderNum}`;
      const summaryItemNames = cart.map((c) => `${c.item.name} (x${c.quantity})`).join(', ');

      // 2. Insert into orders table without forcing custom text string into id
      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            vendor_id: vendorId,
            item_name: summaryItemNames,
            status: 'pending',
            ...(userId ? { user_id: userId } : {}),
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      const realOrderId = insertedOrder?.id;

      // 3. Insert detailed items into order_items table using the generated order ID
      const orderItems = cart.map((c) => ({
        order_id: realOrderId,
        item_id: c.item.id,
        quantity: c.quantity,
      }));

      await supabase.from('order_items').insert(orderItems);

      // 4. Save slip data locally using the display ID
      const slipData = {
        orderId: displayOrderId,
        vendorName: vendor?.name || 'CampusCrunch',
        vendorId,
        items: cart.map((c) => ({
          name: c.item.name,
          qty: c.quantity,
          price: c.item.price,
        })),
        total: totalPrice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
      };

      localStorage.setItem(`order_${displayOrderId}`, JSON.stringify(slipData));
      router.push(`/orders/${displayOrderId}`);
    } catch (err: any) {
      alert(`Checkout failed: ${err.message || 'Please try again.'}`);
      setSubmitting(false);
    }
  };};

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-orange-500/20">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-neutral-950">
                <path d="M 75 25 A 35 35 0 1 0 75 75 L 60 60 A 15 15 0 1 1 60 40 Z" />
                <line x1="10" y1="90" x2="90" y2="10" stroke="#0a0a0a" strokeWidth="8" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {vendor?.name || 'CampusCrunch'}
              </h1>
              <p className="text-xs text-neutral-400">{vendor?.description}</p>
            </div>
          </div>

          <Link
            href="/"
            className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold px-4 py-2 rounded-xl text-xs border border-neutral-800 transition-colors"
          >
            ← Back Home
          </Link>
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            Available Dishes
          </h2>

          {loading ? (
            <p className="text-neutral-500 text-xs">Loading menu items...</p>
          ) : menuItems.length === 0 ? (
            <p className="text-neutral-500 text-xs">No items available.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xl hover:border-orange-500/30 transition-colors"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-white text-base">{item.name}</h3>
                      <span className="font-mono text-sm font-bold text-orange-400">
                        R{item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">{item.description}</p>
                  </div>

                  <button
                    onClick={() => addToCart(item)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md shadow-orange-500/10"
                  >
                    + Add To Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Drawer */}
        {cart.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-neutral-900 border border-orange-500/50 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-neutral-400 font-medium">Total Due at Counter</p>
              <p className="text-lg font-black text-white font-mono">
                R{totalPrice.toFixed(2)}
              </p>
            </div>
            <button
              onClick={handlePayAtCounter}
              disabled={submitting}
              className="bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {submitting ? 'Generating Slip...' : `Pay at Counter (${cart.reduce((s, c) => s + c.quantity, 0)})`}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}