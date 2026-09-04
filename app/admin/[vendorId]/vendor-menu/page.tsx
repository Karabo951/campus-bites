'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MenuItem {
  id?: number;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
}

export default function VendorMenuManager() {
  const [vendorId, setVendorId] = useState('v1');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Mains');

  const fetchMenuItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('id', { ascending: true });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMenuItems();
  }, [vendorId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const { error } = await supabase.from('menu_items').insert([
      {
        vendor_id: vendorId,
        name,
        description,
        price: parseFloat(price),
        category,
        is_available: true,
      },
    ]);

    if (!error) {
      setName('');
      setDescription('');
      setPrice('');
      fetchMenuItems();
    } else {
      alert(`Error adding item: ${error.message}`);
    }
  };

  const toggleAvailability = async (id: number, currentStatus: boolean) => {
    await supabase
      .from('menu_items')
      .update({ is_available: !currentStatus })
      .eq('id', id);

    fetchMenuItems();
  };

  const deleteItem = async (id: number) => {
    await supabase.from('menu_items').delete().eq('id', id);
    fetchMenuItems();
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 max-w-5xl mx-auto space-y-8">
      {/* Header with Diagonal-Cut C Logo and CampusCrunch Branding */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          {/* Custom SVG Diagonal Cut "C" Logo */}
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-orange-500/20">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-neutral-950">
              <path d="M 75 25 A 35 35 0 1 0 75 75 L 60 60 A 15 15 0 1 1 60 40 Z" />
              {/* Diagonal Slash Cut */}
              <line x1="10" y1="90" x2="90" y2="10" stroke="#0a0a0a" strokeWidth="8" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Campus<span className="text-orange-500">Crunch</span>
            </h1>
            <p className="text-xs text-neutral-400">Vendor Menu Management Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-neutral-400">Select Vendor:</label>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 text-orange-400 font-bold text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-orange-500"
          >
            <option value="v1">CampusCrunch Grill (v1)</option>
            <option value="v2">Crunch Cafe (v2)</option>
          </select>
        </div>
      </div>

      {/* Add New Item Form */}
      <form onSubmit={handleAddItem} className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 space-y-4">
        <h2 className="text-lg font-bold text-white">Add New Menu Item</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Item Name (e.g. Crunch Burger)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-sm focus:outline-none focus:border-orange-500 text-white"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price in ZAR (e.g. 59.99)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-sm focus:outline-none focus:border-orange-500 text-white"
            required
          />
          <input
            type="text"
            placeholder="Category (e.g. Mains, Drinks, Sides)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-sm focus:outline-none focus:border-orange-500 text-white"
            required
          />
          <input
            type="text"
            placeholder="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-sm focus:outline-none focus:border-orange-500 text-white"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-orange-500/20"
        >
          + Add Item to Menu
        </button>
      </form>

      {/* Live Menu Items List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Active Menu Items</h2>
        {loading ? (
          <p className="text-neutral-500 text-sm">Loading menu items...</p>
        ) : items.length === 0 ? (
          <p className="text-neutral-500 text-sm">No menu items found for this vendor.</p>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{item.name}</span>
                    <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded text-neutral-400 font-mono">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">{item.description}</p>
                  <p className="text-sm font-bold text-orange-400 font-mono mt-1">
                    R{item.price.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAvailability(item.id!, item.is_available)}
                    className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
                      item.is_available
                        ? 'bg-orange-950/60 text-orange-400 border border-orange-800/80'
                        : 'bg-rose-950/60 text-rose-400 border border-rose-800/80'
                    }`}
                  >
                    {item.is_available ? 'In Stock' : 'Out of Stock'}
                  </button>
                  <button
                    onClick={() => deleteItem(item.id!)}
                    className="bg-neutral-800 hover:bg-rose-900 text-neutral-400 hover:text-rose-200 text-xs font-bold p-2 rounded-lg border border-neutral-700 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}