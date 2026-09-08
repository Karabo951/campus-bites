'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Vendor {
  id: string;
  name: string;
  description: string;
}

interface MenuItem {
  id: number;
  vendor_id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  is_available: boolean;
}

interface Enquiry {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
}

const ADMIN_PIN = '040301';

export default function AdminVendorPage() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Vendor & Menu State
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  // Forms State
  const [newVendor, setNewVendor] = useState({ id: '', name: '', description: '' });
  const [newDish, setNewDish] = useState({ name: '', price: '', category: 'Mains', description: '' });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'enquiries'>('menu');

  useEffect(() => {
    if (localStorage.getItem('admin_authenticated') === 'true') {
      setIsAdminAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAdminAuthenticated) return;
    fetchVendors();
    fetchEnquiries();
  }, [isAdminAuthenticated]);

  useEffect(() => {
    if (selectedVendorId) {
      fetchMenuItems(selectedVendorId);
    }
  }, [selectedVendorId]);

  const fetchVendors = async () => {
    const { data } = await supabase.from('vendors').select('*').order('name', { ascending: true });
    if (data && data.length > 0) {
      setVendors(data);
      if (!selectedVendorId) setSelectedVendorId(data[0].id);
    } else {
      setVendors([]);
      setSelectedVendorId('');
    }
  };

  const fetchMenuItems = async (vendorId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('id', { ascending: true });

    if (data) setMenuItems(data);
    setLoading(false);
  };

  const fetchEnquiries = async () => {
    const { data } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setEnquiries(data as Enquiry[]);
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor? This will remove all associated menu items.')) {
      return;
    }

    // 1. Delete associated menu items
    await supabase.from('menu_items').delete().eq('vendor_id', vendorId);

    // 2. Delete vendor record
    const { error } = await supabase.from('vendors').delete().eq('id', vendorId);

    if (error) {
      alert(`Failed to delete vendor: ${error.message}`);
    } else {
      const remainingVendors = vendors.filter((v) => v.id !== vendorId);
      setVendors(remainingVendors);
      if (selectedVendorId === vendorId) {
        setSelectedVendorId(remainingVendors.length > 0 ? remainingVendors[0].id : '');
        setMenuItems([]);
      }
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.id || !newVendor.name) return alert('Fill in Vendor ID and Name');

    const { error } = await supabase.from('vendors').insert([newVendor]);
    if (error) {
      alert(`Error creating vendor: ${error.message}`);
    } else {
      alert('Vendor created successfully!');
      setNewVendor({ id: '', name: '', description: '' });
      fetchVendors();
    }
  };

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) return alert('Please select or create a vendor first');
    if (!newDish.name || !newDish.price) return alert('Provide dish name and price');

    const priceNum = parseFloat(newDish.price);
    if (isNaN(priceNum)) return alert('Invalid price format');

    const { error } = await supabase.from('menu_items').insert([
      {
        vendor_id: selectedVendorId,
        name: newDish.name,
        price: priceNum,
        category: newDish.category,
        description: newDish.description,
        is_available: true,
      },
    ]);

    if (error) {
      alert(`Error adding dish: ${error.message}`);
    } else {
      setNewDish({ name: '', price: '', category: 'Mains', description: '' });
      fetchMenuItems(selectedVendorId);
    }
  };

  const handleDeleteDish = async (id: number) => {
    if (!confirm('Delete this menu item?')) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) alert(`Error: ${error.message}`);
    else fetchMenuItems(selectedVendorId);
  };

  const handleUpdateEnquiryStatus = async (id: number, newStatus: Enquiry['status']) => {
    setEnquiries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );

    const { error } = await supabase
      .from('enquiries')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert(`Failed to update status: ${error.message}`);
      fetchEnquiries();
    }
  };

  const handleDeleteEnquiry = async (id: number) => {
    if (!confirm('Delete this enquiry record?')) return;

    setEnquiries((prev) => prev.filter((item) => item.id !== id));

    const { error } = await supabase.from('enquiries').delete().eq('id', id);

    if (error) {
      alert(`Failed to delete enquiry: ${error.message}`);
      fetchEnquiries();
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            🛡️
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-white">Admin Portal</h1>
            <p className="text-xs text-neutral-400 mt-1">Enter Admin PIN to manage vendors & menu items</p>
          </div>

          <form onSubmit={handleAdminAuth} className="space-y-4">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN"
              className="w-full bg-neutral-950 border border-neutral-800 text-center text-2xl tracking-[0.5em] font-mono py-3 rounded-xl text-white focus:outline-none focus:border-orange-500"
            />
            {pinError && <p className="text-xs text-red-400 font-bold">Invalid Admin PIN. Try 040301.</p>}
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black py-3 rounded-xl uppercase tracking-wider text-xs transition-colors"
            >
              Unlock Admin Panel
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 sm:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider">Vendor & Menu Manager</h1>
            <p className="text-xs text-neutral-400">Manage stores, dishes, and incoming enquiries</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-xl text-neutral-300 font-bold"
            >
              &larr; Home
            </Link>
            <button
              onClick={() => {
                setIsAdminAuthenticated(false);
                localStorage.removeItem('admin_authenticated');
              }}
              className="bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-xl font-bold text-neutral-400 hover:text-white"
            >
              🔒 Lock Admin
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-4 border-b border-neutral-800 pb-2">
          <button
            onClick={() => setActiveTab('menu')}
            className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'menu' ? 'bg-orange-500 text-neutral-950 font-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Menu Manager
          </button>
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'enquiries' ? 'bg-orange-500 text-neutral-950 font-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Enquiries ({enquiries.length})
          </button>
        </div>

        {activeTab === 'menu' ? (
          <div className="space-y-8">
            {/* Create New Vendor Section */}
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-orange-400">+ Add New Vendor</h2>
              <form onSubmit={handleCreateVendor} className="grid sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Vendor ID (e.g. v3)"
                  value={newVendor.id}
                  onChange={(e) => setNewVendor({ ...newVendor, id: e.target.value })}
                  className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Vendor Name"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newVendor.description}
                  onChange={(e) => setNewVendor({ ...newVendor, description: e.target.value })}
                  className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                />
                <button
                  type="submit"
                  className="sm:col-span-3 bg-orange-500 text-neutral-950 font-black p-3 rounded-xl text-xs uppercase"
                >
                  Create Vendor
                </button>
              </form>
            </div>

            {/* Select Active Vendor & Remove Vendor */}
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-xs font-bold uppercase text-neutral-400">Managing Menu For:</span>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs font-bold text-white"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.id})
                      </option>
                    ))}
                  </select>
                  {selectedVendorId && (
                    <button
                      type="button"
                      onClick={() => handleDeleteVendor(selectedVendorId)}
                      className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold px-3 py-3 rounded-xl transition-colors"
                    >
                      🗑 Remove Vendor
                    </button>
                  )}
                </div>
              </div>

              {/* Add New Dish */}
              <form onSubmit={handleAddDish} className="space-y-3 pt-4 border-t border-neutral-800">
                <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400">+ Add New Dish</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Dish Name (e.g. Crunch Burger)"
                    value={newDish.name}
                    onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                    className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price in ZAR (e.g. 59.99)"
                    value={newDish.price}
                    onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                    className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Category (e.g. Mains, Sides)"
                    value={newDish.category}
                    onChange={(e) => setNewDish({ ...newDish, category: e.target.value })}
                    className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Description (Optional)"
                    value={newDish.description}
                    onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                    className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-orange-500 text-neutral-950 font-black p-3 rounded-xl text-xs uppercase"
                >
                  Save & Publish Dish
                </button>
              </form>
            </div>

            {/* Menu List */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Current Dishes</h3>
              {loading ? (
                <p className="text-xs text-neutral-500">Loading dishes...</p>
              ) : menuItems.length === 0 ? (
                <p className="text-xs text-neutral-500">No dishes listed for this vendor.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-bold text-white text-sm">{item.name}</h4>
                        <p className="text-xs text-orange-400 font-mono font-bold">R{item.price.toFixed(2)}</p>
                        <p className="text-[10px] text-neutral-500">{item.description}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteDish(item.id)}
                        className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Enquiries List Section */
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Customer Enquiries</h3>
            {enquiries.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl text-center text-xs text-neutral-500">
                No customer enquiries submitted yet.
              </div>
            ) : (
              <div className="space-y-4">
                {enquiries.map((enquiry) => (
                  <div key={enquiry.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start border-b border-neutral-800 pb-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{enquiry.subject}</h4>
                        <p className="text-xs text-orange-400">From: {enquiry.name} ({enquiry.email})</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {new Date(enquiry.created_at).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleDeleteEnquiry(enquiry.id)}
                          className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg font-bold"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-300 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                      {enquiry.message}
                    </p>

                    {/* Progress Update Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                        Progress Status:
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateEnquiryStatus(enquiry.id, 'pending')}
                          className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${
                            enquiry.status === 'pending' || !enquiry.status
                              ? 'bg-amber-500 text-neutral-950 font-bold'
                              : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          🟡 Pending
                        </button>
                        <button
                          onClick={() => handleUpdateEnquiryStatus(enquiry.id, 'in_progress')}
                          className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${
                            enquiry.status === 'in_progress'
                              ? 'bg-blue-500 text-white font-bold'
                              : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          🔵 In Progress
                        </button>
                        <button
                          onClick={() => handleUpdateEnquiryStatus(enquiry.id, 'resolved')}
                          className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${
                            enquiry.status === 'resolved'
                              ? 'bg-emerald-500 text-neutral-950 font-bold'
                              : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          🟢 Resolved
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}