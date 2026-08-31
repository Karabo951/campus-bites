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

interface OrderReceipt {
  id: number;
  items: CartItem[];
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  notes: string;
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

  // Cart & Checkout State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Digital Receipt State
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('vendor_id', vendorId);

        if (error) console.error('Error fetching menu:', error.message);
        else if (data) setItems(data);
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, [vendorId]);

  // Cart Helper Functions
  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.id === item.id);
      if (existing) {
        return prevCart.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((ci) => {
          if (ci.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const cartTotalCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);
  const cartTotalPrice = cart.reduce((sum, ci) => sum + ci.price * ci.quantity, 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerName.trim() || !customerPhone.trim()) {
      setOrderError('Please enter your name and phone number.');
      return;
    }

    setIsProcessing(true);
    setOrderError(null);

    try {
      // Summary line for simple legacy views + structured JSON for multi-item views
      const itemSummary = cart.map((ci) => `${ci.quantity}x ${ci.name}`).join(', ');

      const { data, error } = await supabase
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

      if (error) throw error;

      setReceipt({
        id: data.id,
        items: [...cart],
        totalPrice: cartTotalPrice,
        customerName,
        customerPhone,
        notes,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      setCart([]);
      setIsCartOpen(false);
      setNotes('');
    } catch (err: any) {
      console.error('Order error:', err);
      setOrderError(err.message || 'Failed to place order. Try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 pb-24">
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
            {items.map((item) => {
              const inCart = cart.find((ci) => ci.id === item.id);
              return (
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

                  {inCart ? (
                    <div className="flex items-center justify-between bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 bg-white text-emerald-700 font-bold rounded-md shadow-sm border border-emerald-200 hover:bg-emerald-100"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-emerald-900">
                        {inCart.quantity} in Cart
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 bg-emerald-600 text-white font-bold rounded-md shadow-sm hover:bg-emerald-700"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      disabled={!item.is_available}
                      className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-colors ${
                        item.is_available
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {item.is_available ? 'Add to Cart' : 'Sold Out'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-center">
            <p className="text-gray-600 text-sm font-medium">No menu items found.</p>
          </div>
        )}

      </div>

      {/* Floating Sticky Cart Bar */}
      {cartTotalCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-0 right-0 max-w-xl mx-auto px-4 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-2xl flex items-center justify-between transition-all transform hover:scale-[1.01]"
          >
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-800 text-white text-xs px-2.5 py-1 rounded-full font-mono">
                {cartTotalCount}
              </span>
              <span className="text-sm">View Cart</span>
            </div>
            <span className="text-sm font-extrabold">R{cartTotalPrice.toFixed(2)} →</span>
          </button>
        </div>
      )}

      {/* Slide-over Checkout Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Your Basket ({cartTotalCount})</h3>
              <button
                onClick={() => setIsCartOpen(false)}
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

            {/* Cart Items List */}
            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-1">
              {cart.map((ci) => (
                <div key={ci.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-gray-900">{ci.name}</span>
                    <span className="text-gray-400 ml-2">x{ci.quantity}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-emerald-600">
                      R{(ci.price * ci.quantity).toFixed(2)}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => updateQuantity(ci.id, -1)}
                        className="w-5 h-5 bg-gray-100 text-gray-700 rounded font-bold hover:bg-gray-200"
                      >
                        -
                      </button>
                      <button
                        onClick={() => updateQuantity(ci.id, 1)}
                        className="w-5 h-5 bg-gray-100 text-gray-700 rounded font-bold hover:bg-gray-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-emerald-50 p-3 rounded-lg flex justify-between items-center border border-emerald-100">
              <span className="text-xs font-bold text-emerald-900 uppercase">Total Amount:</span>
              <span className="text-lg font-black text-emerald-600">
                R{cartTotalPrice.toFixed(2)}
              </span>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handlePlaceOrder} className="space-y-3">
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

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">
                  Special Notes / Sauce Options
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Extra spicy sauce, no onions"
                  className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-colors disabled:opacity-50 mt-2"
              >
                {isProcessing ? 'Placing Order...' : 'Confirm & Place Order'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Digital Receipt Slip Modal */}
      {receipt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border-2 border-dashed border-emerald-500 shadow-2xl">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Campus Bites Order Slip
              </span>
              <h2 className="text-2xl font-black text-gray-900">ORDER #{receipt.id}</h2>
              <p className="text-xs text-gray-500">📸 Screenshot for pickup!</p>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl space-y-2 text-xs border border-gray-100">
              <div className="border-b pb-2">
                <span className="text-gray-400 uppercase text-[10px] font-bold">Items Ordered:</span>
                {receipt.items.map((item) => (
                  <div key={item.id} className="flex justify-between font-bold text-gray-900 mt-1">
                    <span>{item.quantity}x {item.name}</span>
                    <span>R{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {receipt.notes && (
                <div className="border-b pb-2">
                  <span className="text-gray-400 uppercase text-[10px] font-bold">Notes:</span>
                  <p className="font-semibold text-amber-700">{receipt.notes}</p>
                </div>
              )}

              <div className="flex justify-between border-b pb-1.5 pt-1">
                <span className="text-gray-500">Total:</span>
                <span className="font-black text-emerald-600">R{receipt.totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-gray-500">Name:</span>
                <span className="font-bold text-gray-900">{receipt.customerName}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
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
    </main>
  );
}