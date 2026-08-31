'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export default function StudentMenu({ params }: { params: Promise<{ vendorSlug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{ item: MenuItem; qty: number }[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState('Capitec');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function loadMenu() {
      try {
        setLoading(true);
        const { data: vendor, error: vendorErr } = await supabase
          .from('vendors')
          .select('id')
          .eq('slug', resolvedParams.vendorSlug)
          .maybeSingle();

        if (vendorErr || !vendor) {
          setErrorMsg('Vendor not found or query failed.');
          return;
        }

        setVendorId(vendor.id);

        const { data: menu } = await supabase
          .from('menu_items')
          .select('*')
          .eq('vendor_id', vendor.id)
          .eq('available', true);

        if (menu) setItems(menu);
      } catch (err: any) {
        setErrorMsg(`Error loading menu: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
  }, [resolvedParams.vendorSlug]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.item.id === item.id);
      if (exists) return prev.map((i) => (i.item.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { item, qty: 1 }];
    });
  };

  const total = cart.reduce((acc, curr) => acc + curr.item.price * curr.qty, 0);

  const initiatePayment = () => {
    if (!name || !phone || cart.length === 0) {
      return alert('Please enter your details and select items first.');
    }
    setShowPaymentModal(true);
  };

  const processInstantEFT = async () => {
    setIsProcessing(true);

    // Simulate Instant EFT bank handshake delay (2 seconds)
    setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert([
            {
              vendor_id: vendorId,
              student_name: name,
              student_phone: phone,
              total_amount: total,
              status: 'pending',
            },
          ])
          .select('id')
          .single();

        if (error) {
          alert(`Payment succeeded, but order creation failed: ${error.message}`);
          setIsProcessing(false);
          setShowPaymentModal(false);
          return;
        }

        if (data && data.id) {
          setCart([]);
          router.push(`/orders/${data.id}`);
        }
      } catch (err: any) {
        alert('Unexpected order creation error.');
        setIsProcessing(false);
        setShowPaymentModal(false);
      }
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-32 text-slate-900 font-sans">
      <h1 className="text-2xl font-black mb-4 uppercase tracking-wider text-emerald-700">Campus Eats</h1>

      {loading && <p className="text-slate-500 font-bold animate-pulse">Loading menu items...</p>}
      {errorMsg && <div className="p-4 bg-red-50 text-red-700 rounded-xl mb-4 text-sm font-medium">{errorMsg}</div>}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center p-4 border rounded-xl shadow-sm bg-white">
            <div>
              <p className="font-bold text-lg">{item.name}</p>
              <p className="text-slate-600 font-medium">R{Number(item.price).toFixed(2)}</p>
            </div>
            <button
              onClick={() => addToCart(item)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 active:scale-95 transition"
            >
              Add +
            </button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 max-w-md mx-auto shadow-2xl rounded-t-2xl">
          <div className="flex justify-between font-bold text-lg mb-3">
            <span>Total:</span>
            <span className="text-emerald-700">R{total.toFixed(2)}</span>
          </div>
          <input
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border rounded-lg mb-2 outline-none focus:border-emerald-500"
          />
          <input
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 border rounded-lg mb-3 outline-none focus:border-emerald-500"
          />
          <button
            onClick={initiatePayment}
            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-700"
          >
            Pay with Instant EFT
          </button>
        </div>
      )}

      {/* Instant EFT Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-xs font-black uppercase text-slate-400">Campus Pay</span>
                <h2 className="text-xl font-black text-slate-800">Instant EFT Payment</h2>
              </div>
              <span className="text-emerald-700 font-black text-xl">R{total.toFixed(2)}</span>
            </div>

            {isProcessing ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="font-bold text-slate-700">Authorizing with {selectedBank}...</p>
                <p className="text-xs text-slate-400">Do not close this window</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-600">Select your bank to complete payment:</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Capitec', 'FNB', 'Standard Bank', 'Absa', 'Nedbank', 'TymeBank'].map((bank) => (
                    <button
                      key={bank}
                      onClick={() => setSelectedBank(bank)}
                      className={`p-3 rounded-xl border text-sm font-bold text-left transition ${
                        selectedBank === bank
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    onClick={processInstantEFT}
                    className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-emerald-700 transition"
                  >
                    Authorize & Pay R{total.toFixed(2)}
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full text-slate-500 font-semibold py-2 text-sm hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}