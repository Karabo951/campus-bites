'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Vendor {
  id: string;
  name: string;
  is_open: boolean;
}

export default function HomePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Auth state inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase.from('vendors').select('*');
      if (error) {
        console.error('Error fetching vendors:', error.message);
      } else if (data) {
        setVendors(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function checkUserSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        fetchVendors();
      } else {
        setLoading(false);
      }
    }

    checkUserSession();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setAuthMessage('Account created successfully! You can now log in.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          setUserEmail(data.user.email || null);
          setLoading(true);
          fetchVendors();
        }
      }
    } catch (err: any) {
      setAuthMessage(err.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-6 border-gray-200">
          <div>
            <span className="text-xs font-extrabold tracking-widest text-emerald-600 uppercase">
              Official Campus App
            </span>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Campus Bites
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Order food from campus vendors without standing in line.
            </p>
          </div>

          {userEmail && (
            <div className="flex items-center gap-2">
              <Link
                href="/orders"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-sm transition-colors"
              >
                📋 Track Orders
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs py-2 px-3 rounded-lg transition-colors"
              >
                Log Out
              </button>
            </div>
          )}
        </div>

        {/* CONDITION 1: User NOT logged in -> Show Login/Sign Up Form First */}
        {!userEmail ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-md mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {isSignUp ? 'Create Student Account' : 'Log In to Campus Bites'}
              </h2>
              <p className="text-xs text-gray-500">
                You must be logged in to view campus vendors and order food.
              </p>
            </div>

            {authMessage && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold text-center ${
                  authMessage.includes('successfully')
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {authMessage}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-emerald-500"
                  placeholder="student@campus.ac.za"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-emerald-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg text-sm transition-colors"
              >
                {authLoading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In & Continue'}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthMessage(null);
                }}
                className="text-xs text-emerald-600 font-bold hover:underline"
              >
                {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        ) : (
          /* CONDITION 2: User IS logged in -> Show Vendors & Menu Options */
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                Available Vendors
              </h2>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Logged in: {userEmail}
              </span>
            </div>

            {loading ? (
              <p className="text-gray-500 text-sm">Loading campus vendors...</p>
            ) : vendors.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {vendors.map((vendor) => {
                  const targetId = vendor.id || 'v1';
                  return (
                    <div
                      key={targetId}
                      className="p-4 border border-gray-200 rounded-lg hover:border-emerald-500 transition-colors flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-900">{vendor.name}</h3>
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              vendor.is_open ? 'bg-emerald-500' : 'bg-red-400'
                            }`}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {vendor.is_open ? 'Open for orders' : 'Closed'}
                        </p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link
                          href={`/vendor/${targetId}`}
                          className="flex-1 text-center bg-emerald-600 text-white text-xs font-semibold py-2 px-3 rounded hover:bg-emerald-700 transition-colors"
                        >
                          Order Food
                        </Link>
                        <Link
                          href={`/kitchen/${targetId}`}
                          className="text-center bg-gray-100 text-gray-700 text-xs font-semibold py-2 px-3 rounded hover:bg-gray-200 transition-colors"
                        >
                          KDS View
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm">No vendors listed in database yet.</p>
                <Link
                  href="/vendor/v1"
                  className="inline-block bg-emerald-600 text-white text-xs font-semibold py-2 px-4 rounded hover:bg-emerald-700 transition-colors"
                >
                  View Default Menu (v1)
                </Link>
              </div>
            )}

            <hr className="border-gray-100" />

            <div className="flex gap-3">
              <Link
                href="/vendor/v1"
                className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-3 px-4 rounded-lg transition-colors"
              >
                Menu Portal (v1)
              </Link>
              <Link
                href="/kitchen/v1"
                className="flex-1 text-center bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-3 px-4 rounded-lg transition-colors"
              >
                Kitchen Display (v1)
              </Link>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}