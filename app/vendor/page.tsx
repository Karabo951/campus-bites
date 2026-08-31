'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Vendor {
  id: string;
  name: string;
  slug: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export default function VendorDashboard() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state for new items
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  // 1. Fetch available vendors on mount
  useEffect(() => {
    supabase
      .from('vendors')
      .select('*')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setVendors(data);
          setSelectedVendorId(data[0].id);
        }
      });
  }, []);

  // 2. Fetch menu items whenever selected vendor changes
  useEffect(() => {
    if (!selectedVendorId) return;

    async function loadMenuItems() {
      setLoading(true);
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('vendor_id', selectedVendorId)
        .order('name');

      if (data) setItems(data);
      setLoading(false);
    }

    loadMenuItems();
  }, [selectedVendorId]);

  // Toggle Item Availability
  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, available: nextStatus } : item)));

    await supabase
      .from('menu_items')
      .update({ available: nextStatus })
      .eq('id', id);
  };

  // Add New Menu Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice || !selectedVendorId) return;

    const priceNum = parseFloat(newItemPrice);
    if (isNaN(priceNum)) return alert('Please enter a valid price');

    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        vendor_id: selectedVendorId,
        name: newItemName,
        price: priceNum,
        available: true,
      })
      .select()
      .single();

    if (error) {
      alert(`Error adding item: ${error.message}`);
    } else if (data) {
      setItems((prev) => [...prev, data]);
      setNewItemName('');
      setNewItemPrice('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans text-slate-900">
      <h1 className="text-3xl font-black uppercase text-slate-800 mb-6">Vendor Management</h1>

      {/* Vendor Selector */}
      <div className="mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <label className="block text-sm font-bold text-slate-500 uppercase mb-2">Select Vendor</label>
        <select
          value={selectedVendorId}
          onChange={(e) => setSelectedVendorId(e.target.value)}
          className="w-full p-3 border rounded-xl bg-slate-50 font-bold outline-none focus:border-emerald-500"
        >
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} ({v.slug})
            </option>
          ))}
        </select>
      </div>

      {/* Add New Item Form */}
      <form onSubmit={handleAddItem} className="mb-8 bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
        <h2 className="font-bold text-lg text-emerald-900 mb-4">Add New Menu Item</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <input
            type="text"
            placeholder="Item Name (e.g. Chips & Cheese)"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="p-3 border rounded-xl bg-white outline-none focus:border-emerald-500"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price (R)"
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value)}
            className="p-3 border rounded-xl bg-white outline-none focus:border-emerald-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-md transition"
        >
          Add Item to Menu
        </button>
      </form>

      {/* Menu Items List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="font-bold text-lg text-slate-800 mb-4">Current Menu Stock</h2>

        {loading ? (
          <p className="text-slate-500 font-bold animate-pulse">Loading menu...</p>
        ) : items.length === 0 ? (
          <p className="text-slate-500">No items on this menu yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-4 border rounded-xl bg-slate-50"
              >
                <div>
                  <p className="font-bold text-slate-800 text-lg">{item.name}</p>
                  <p className="text-slate-600 font-medium">R{Number(item.price).toFixed(2)}</p>
                </div>
                <button
                  onClick={() => toggleAvailability(item.id, item.available)}
                  className={`px-4 py-2 rounded-xl font-bold transition ${
                    item.available
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  {item.available ? 'In Stock' : 'Sold Out'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}