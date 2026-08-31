'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface MenuItem {
  id: number;
  vendor_id: string;
  name: string;
  price: number;
  description: string;
  is_available: boolean;
}

const VENDOR_PINS: Record<string, string> = {
  v1: '1234',
  v2: '5678',
};

export default function VendorAdminPage({
  params,
}: {
  params: Promise<{ vendorId: string }>;
}) {
  const resolvedParams = use(params);
  const vendorId = resolvedParams.vendorId || 'v1';

  // Auth State
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Menu State
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for Adding/Editing
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = VENDOR_PINS[vendorId] || '1234';

    if (pinInput === correctPin) {
      setIsAuthenticated(true);
      setPinError(null);
    } else {
      setPinError('Incorrect PIN. Default PIN is 1234');
      setPinInput('');
    }
  };

  const fetchMenu = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('id', { ascending: true });

    if (error) console.error('Error fetching menu:', error.message);
    else if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMenu();
    }
  }, [vendorId, isAuthenticated]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('menu_items').insert([
        {
          vendor_id: vendorId,
          name: name.trim(),
          price: parseFloat(price),
          description: description.trim(),
          is_available: true,
        },
      ]);

      if (error) throw error;

      setName('');
      setPrice('');
      setDescription('');
      fetchMenu();
    } catch (err: any) {
      alert('Failed to add item: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id);

    if (error) console.error('Error updating status:', error.message);
    else fetchMenu();
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    const { error } = await supabase.from('menu_items').delete().eq('id', itemId);

    if (error) console.error('Error deleting item:', error.message);
    else fetchMenu();
  };

  // 1. Lock Screen
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-sm w-full p-6 space-y-6 text-center shadow-2xl">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950 px-2 py-1 rounded">
              Vendor Dashboard
            </span>
            <h1 className="text-2xl font-bold text-white mt-2">Menu Manager Access</h1>
            <p className="text-gray-400 text-xs mt-1">
              Enter 4-digit PIN for Vendor <span className="text-white font-mono">{vendorId}</span>
            </p>
          </div>

          {pinError && (
            <div className="p-2.5 bg-red-950/80 border border-red-500/50 rounded-lg text-xs font-bold text-red-300">
              {pinError}
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              required
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className="w-full text-center text-3xl font-mono tracking-widest py-3 bg-gray-950 border border-gray-700 rounded-xl text-white focus:outline-emerald-500"
            />

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 rounded-xl transition-colors"
            >
              Unlock Dashboard
            </button>
          </form>

          <Link href="/" className="block text-xs text-gray-500 hover:text-gray-300">
            ← Home
          </Link>
        </div>
      </main>
    );
  }

  // 2. Authenticated Admin Dashboard
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <div>
            <span className="text-xs font-extrabold tracking-widest text-emerald-600 uppercase">
              Management Portal
            </span>
            <h1 className="text-2xl font-bold text-gray-900">
              Menu & Stock Admin ({vendorId})
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAuthenticated(false)}
              className="bg-white border border-gray-300 text-gray-700 text-xs font-semibold py-2 px-3 rounded-md hover:bg-gray-100"
            >
              🔒 Lock Portal
            </button>
            <Link
              href="/"
              className="bg-white border border-gray-300 text-gray-700 text-xs font-semibold py-2 px-3 rounded-md hover:bg-gray-100"
            >
              ← Home
            </Link>
          </div>
        </div>

        {/* Form: Add New Item */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            ➕ Add New Menu Item
          </h2>

          <form onSubmit={handleAddItem} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase">Item Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Chicken Burger"
                className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase">Price (ZAR)</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 45.00"
                className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-700 uppercase">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Served with fresh chips and sauce"
                className="mt-1 w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-lg shadow transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Save & Publish to Menu'}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Menu Items List */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            📋 Live Menu & Availability Control
          </h2>

          {loading ? (
            <p className="text-gray-500 text-sm">Loading items...</p>
          ) : items.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        R{Number(item.price).toFixed(2)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`text-xs font-bold py-1.5 px-3 rounded-lg transition-colors ${
                        item.is_available
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {item.is_available ? 'In Stock' : 'Sold Out'}
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-xs font-bold text-gray-400 hover:text-red-600 p-1.5"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No menu items found. Add your first dish above!</p>
          )}
        </div>

      </div>
    </main>
  );
}