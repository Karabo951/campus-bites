'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Vendor {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
}

interface MenuItem {
  id: number;
  vendor_id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  is_available: boolean;
  image_url?: string;
}

interface Enquiry {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: 'pending' | 'in_progress' | 'resolved';
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

  // Add Forms State
  const [newVendor, setNewVendor] = useState({ id: '', name: '', description: '' });
  const [vendorLogoFile, setVendorLogoFile] = useState<File | null>(null);

  const [newDish, setNewDish] = useState({ name: '', price: '', category: 'Mains', description: '' });
  const [dishImageFile, setDishImageFile] = useState<File | null>(null);

  // Edit Modal States
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editVendorLogoFile, setEditVendorLogoFile] = useState<File | null>(null);

  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [editDishImageFile, setEditDishImageFile] = useState<File | null>(null);

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
    } else {
      setMenuItems([]);
    }
  }, [selectedVendorId]);

  const fetchVendors = async () => {
    const { data, error } = await supabase.from('vendors').select('*').order('name', { ascending: true });
    if (error) return console.error('Error fetching vendors:', error);
    
    if (data && data.length > 0) {
      setVendors(data);
      setSelectedVendorId((prev) => (data.some((v) => v.id === prev) ? prev : data[0].id));
    } else {
      setVendors([]);
      setSelectedVendorId('');
    }
  };

  const fetchMenuItems = async (vendorId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('id', { ascending: true });

    if (!error && data) setMenuItems(data);
    setLoading(false);
  };

  const fetchEnquiries = async () => {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setEnquiries(data as Enquiry[]);
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
    if (!newVendor.name) return alert('Please provide a Vendor Name');

    const vendorId = newVendor.id.trim() !== '' ? newVendor.id.trim() : `v_${Date.now()}`;
    let logoUrl = '';

    if (vendorLogoFile) {
      const filePath = `vendors/${Date.now()}_${vendorLogoFile.name}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, vendorLogoFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
        logoUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from('vendors').insert([
      { id: vendorId, name: newVendor.name, description: newVendor.description, logo_url: logoUrl || null },
    ]);

    if (error) alert(`Error creating vendor: ${error.message}`);
    else {
      alert('Vendor created successfully!');
      setNewVendor({ id: '', name: '', description: '' });
      setVendorLogoFile(null);
      fetchVendors();
    }
  };

  // EDIT EXISTING VENDOR
  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;

    let updatedLogoUrl = editingVendor.logo_url;

    if (editVendorLogoFile) {
      const filePath = `vendors/${Date.now()}_${editVendorLogoFile.name}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, editVendorLogoFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
        updatedLogoUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase
      .from('vendors')
      .update({
        name: editingVendor.name,
        description: editingVendor.description,
        logo_url: updatedLogoUrl,
      })
      .eq('id', editingVendor.id);

    if (error) alert(`Failed to update vendor: ${error.message}`);
    else {
      alert('Vendor updated!');
      setEditingVendor(null);
      setEditVendorLogoFile(null);
      fetchVendors();
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor? This will remove all associated menu items.')) return;

    await supabase.from('menu_items').delete().eq('vendor_id', vendorId);
    const { error } = await supabase.from('vendors').delete().eq('id', vendorId);

    if (error) alert(`Failed to delete vendor: ${error.message}`);
    else {
      alert('Vendor deleted successfully!');
      fetchVendors();
    }
  };

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) return alert('Please select a vendor first');
    if (!newDish.name || !newDish.price) return alert('Provide dish name and price');

    const priceNum = parseFloat(newDish.price);
    if (isNaN(priceNum)) return alert('Invalid price format');

    let dishImageUrl = '';

    if (dishImageFile) {
      const filePath = `dishes/${Date.now()}_${dishImageFile.name}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, dishImageFile);

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
        dishImageUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from('menu_items').insert([
      {
        vendor_id: selectedVendorId,
        name: newDish.name,
        price: priceNum,
        category: newDish.category,
        description: newDish.description,
        is_available: true,
        image_url: dishImageUrl || null,
      },
    ]);

    if (error) alert(`Error adding dish: ${error.message}`);
    else {
      setNewDish({ name: '', price: '', category: 'Mains', description: '' });
      setDishImageFile(null);
      fetchMenuItems(selectedVendorId);
    }
  };

  // EDIT EXISTING DISH
  const handleUpdateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;

    let updatedImageUrl = editingDish.image_url;

    if (editDishImageFile) {
      const filePath = `dishes/${Date.now()}_${editDishImageFile.name}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, editDishImageFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
        updatedImageUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase
      .from('menu_items')
      .update({
        name: editingDish.name,
        price: Number(editingDish.price),
        category: editingDish.category,
        description: editingDish.description,
        image_url: updatedImageUrl,
      })
      .eq('id', editingDish.id);

    if (error) alert(`Failed to update dish: ${error.message}`);
    else {
      alert('Dish updated successfully!');
      setEditingDish(null);
      setEditDishImageFile(null);
      fetchMenuItems(selectedVendorId);
    }
  };

  const handleDeleteDish = async (id: number) => {
    if (!confirm('Delete this menu item?')) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) alert(`Error: ${error.message}`);
    else fetchMenuItems(selectedVendorId);
  };

  const handleUpdateEnquiryStatus = async (id: number, newStatus: NonNullable<Enquiry['status']>) => {
    setEnquiries((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
    await supabase.from('enquiries').update({ status: newStatus }).eq('id', id);
  };

  const handleDeleteEnquiry = async (id: number) => {
    if (!confirm('Delete this enquiry record?')) return;
    const { error } = await supabase.from('enquiries').delete().eq('id', id);
    if (!error) fetchEnquiries();
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
            {pinError && <p className="text-xs text-red-400 font-bold">Invalid Admin PIN. Try again.</p>}
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

  const activeVendorObj = vendors.find((v) => v.id === selectedVendorId);

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
              className="bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-xl text-neutral-300 font-bold hover:text-white"
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

        {/* Navigation Tabs */}
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
                  placeholder="Vendor ID (Optional - Auto Generated)"
                  value={newVendor.id}
                  onChange={(e) => setNewVendor({ ...newVendor, id: e.target.value })}
                  className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Vendor Name *"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newVendor.description}
                  onChange={(e) => setNewVendor({ ...newVendor, description: e.target.value })}
                  className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                />

                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Vendor Logo (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && setVendorLogoFile(e.target.files[0])}
                    className="w-full bg-neutral-950 border border-neutral-800 p-2 rounded-xl text-xs text-neutral-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-neutral-200"
                  />
                </div>

                <button
                  type="submit"
                  className="sm:col-span-3 bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black p-3 rounded-xl text-xs uppercase transition-colors"
                >
                  Create Vendor
                </button>
              </form>
            </div>

            {/* Select Active Vendor, Edit & Remove */}
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {activeVendorObj?.logo_url && (
                    <img
                      src={activeVendorObj.logo_url}
                      alt="Vendor Logo"
                      className="w-8 h-8 rounded-full object-cover border border-orange-500/40"
                    />
                  )}
                  <span className="text-xs font-bold uppercase text-neutral-400">Managing Menu For:</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs font-bold text-white"
                  >
                    {vendors.length === 0 ? (
                      <option value="">No vendors available</option>
                    ) : (
                      vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.id})
                        </option>
                      ))
                    )}
                  </select>

                  {activeVendorObj && (
                    <button
                      type="button"
                      onClick={() => setEditingVendor(activeVendorObj)}
                      className="bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 text-xs font-bold px-3 py-3 rounded-xl transition-colors"
                    >
                      ✏️ Edit Vendor
                    </button>
                  )}

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

              {/* Add New Dish Form */}
              <form onSubmit={handleAddDish} className="space-y-3 pt-4 border-t border-neutral-800">
                <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400">+ Add New Dish</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Dish Name"
                    value={newDish.name}
                    onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                    className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price in ZAR"
                    value={newDish.price}
                    onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                    className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={newDish.category}
                    onChange={(e) => setNewDish({ ...newDish, category: e.target.value })}
                    className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newDish.description}
                    onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                    className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Dish Picture (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && setDishImageFile(e.target.files[0])}
                    className="w-full bg-neutral-950 border border-neutral-800 p-2 rounded-xl text-xs text-neutral-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-neutral-200"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black p-3 rounded-xl text-xs uppercase transition-colors"
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
                      className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex gap-4 items-center justify-between"
                    >
                      <div className="flex gap-3 items-center">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-14 h-14 rounded-lg object-cover border border-neutral-800 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-xs text-neutral-600 shrink-0">
                            No Img
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-white text-sm">{item.name}</h4>
                          <p className="text-xs text-orange-400 font-mono font-bold">R{item.price.toFixed(2)}</p>
                          <p className="text-[10px] text-neutral-500">{item.description}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setEditingDish(item)}
                          className="bg-neutral-800 text-neutral-200 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-neutral-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDish(item.id)}
                          className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Enquiries List */
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

      {/* EDIT VENDOR MODAL */}
      {editingVendor && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400">Edit Vendor Profile</h3>
            <form onSubmit={handleUpdateVendor} className="space-y-3">
              <input
                type="text"
                placeholder="Vendor Name"
                value={editingVendor.name}
                onChange={(e) => setEditingVendor({ ...editingVendor, name: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                required
              />
              <textarea
                placeholder="Vendor Description"
                value={editingVendor.description || ''}
                onChange={(e) => setEditingVendor({ ...editingVendor, description: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
              />
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Update Logo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && setEditVendorLogoFile(e.target.files[0])}
                  className="w-full bg-neutral-950 border border-neutral-800 p-2 rounded-xl text-xs text-neutral-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-neutral-950 font-bold py-2.5 rounded-xl text-xs uppercase"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold py-2.5 px-4 rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DISH MODAL */}
      {editingDish && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400">Edit Dish</h3>
            <form onSubmit={handleUpdateDish} className="space-y-3">
              <input
                type="text"
                placeholder="Dish Name"
                value={editingDish.name}
                onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={editingDish.price}
                onChange={(e) => setEditingDish({ ...editingDish, price: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
                required
              />
              <input
                type="text"
                placeholder="Category"
                value={editingDish.category}
                onChange={(e) => setEditingDish({ ...editingDish, category: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
              />
              <textarea
                placeholder="Description"
                value={editingDish.description || ''}
                onChange={(e) => setEditingDish({ ...editingDish, description: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 p-3 rounded-xl text-xs text-white"
              />
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Update Picture (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && setEditDishImageFile(e.target.files[0])}
                  className="w-full bg-neutral-950 border border-neutral-800 p-2 rounded-xl text-xs text-neutral-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-neutral-950 font-bold py-2.5 rounded-xl text-xs uppercase"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDish(null)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold py-2.5 px-4 rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}