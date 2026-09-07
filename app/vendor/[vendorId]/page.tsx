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
  const vendorId = (params?.vendorId as string) || 'v1';

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Customer Slip Details State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (vendorData) setVendor(vendorData);

      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_available', true);

      if (menuData) setMenuItems(menuData);
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

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return alert('Please enter your name for the receipt');
    if (cart.length === 0 || submitting) return;

    setSubmitting(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || null;

      const orderNum = Math.floor(100000 + Math.random() * 900000);
      const displayOrderId = `CC-${orderNum}`;
      const summaryItemNames = cart.map((c) => `${c.item.name} (x${c.quantity})`).join(', ');

      // Insert Order with Customer Details
      const { error: orderError } = await supabase.from('orders').insert([
        {
          id: displayOrderId,
          vendor_id: vendorId,
          item_name: summaryItemNames,
          status: 'pending',
          user_id: userId,
          customer_name: customerName,
          customer_phone: customerPhone,
        },
      ]);

      if (orderError) throw new Error(`Orders insert failed: ${orderError.message}`);

      // Insert Order Line Items
      const orderItems = cart.map((c) => ({
        order_id: displayOrderId,
        item_id: c.item.id,
        quantity: c.quantity,
      }));

      await supabase.from('order_items').insert(orderItems);

      // Save Slip Data to Local Storage (Including Customer Details)
      const slipData = {
        orderId: displayOrderId,
        vendorName: vendor?.name || 'CampusCrunch',
        vendorId,
        customerName,
        customerPhone: customerPhone || 'N/A',
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to process order';
      alert(`Checkout Error: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <h1 className="text-2xl font-black text-white tracking-tight">
            {vendor?.name || 'CampusCrunch'}
          </h1>
          <Link
            href="/"
            className="bg-neutral-900 text-neutral-300 font-bold px-4 py-2 rounded-xl text-xs border border-neutral-800"
          >
            &larr; Back Home
          </Link>
        </div>

        {/* Menu Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white">{item.name}</h3>
                  <span className="font-mono text-sm font-bold text-orange-400">
                    R{item.price.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-2">{item.description}</p>
              </div>

              <button
                onClick={() => addToCart(item)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black py-2.5 rounded-xl text-xs uppercase"
              >
                + Add To Cart
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Cart Bar */}
        {cart.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-neutral-900 border border-orange-500/50 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-neutral-400 font-medium">Total Due</p>
              <p className="text-lg font-black text-white font-mono">
                R{totalPrice.toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => setShowCheckoutModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black px-6 py-3 rounded-xl text-xs uppercase"
            >
             Pay at Counter ({cart.reduce((s, c) => s + c.quantity, 0)})
            </button>
          </div>
        )}

        {/* Customer Details Modal */}
        {showCheckoutModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl max-w-md w-full space-y-6">
              <div>
                <h2 className="text-lg font-black uppercase text-white">Receipt Details</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Enter customer details to display on order receipt slip
                </p>
              </div>

              <form onSubmit={handleConfirmOrder} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400 block mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-400 block mb-1">
                    Phone or Table No. (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Table 4 or 0821234567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(false)}
                    className="w-1/2 bg-neutral-950 border border-neutral-800 text-neutral-400 font-bold py-3 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-1/2 bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black py-3 rounded-xl text-xs uppercase disabled:opacity-50"
                  >
                    {submitting ? 'Generating Slip...' : 'Confirm Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}