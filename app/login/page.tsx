'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        if (!vendorName.trim()) {
          throw new Error('Please enter a store name for your vendor account.');
        }

        // 1. Register User in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;
        const userId = authData.user?.id;
        if (!userId) throw new Error('Failed to retrieve user ID.');

        // 2. Insert corresponding Vendor Record in Public Schema
        const vendorId = `v_${Date.now()}`;
        const { error: vendorError } = await supabase.from('vendors').insert([
          {
            id: vendorId,
            name: vendorName,
            user_id: userId,
            description: 'Campus food vendor profile',
          },
        ]);

        if (vendorError) throw vendorError;

        setMessage('Vendor account created successfully! Redirecting...');
        setTimeout(() => {
          router.push('/admin/vendor-menu');
          router.refresh();
        }, 1500);
      } else {
        // Log in existing Vendor
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) throw loginError;

        router.push('/admin/vendor-menu');
        router.refresh();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed.';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6 sm:p-12">
      <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
            Vendor Portal
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {isSignUp ? 'Create Vendor Account' : 'Welcome Back'}
          </h1>
          <p className="text-xs text-neutral-400">
            {isSignUp
              ? 'Register your store to manage menus & orders'
              : 'Log in to access your store admin panel'}
          </p>
        </div>

        {message && (
          <div
            className={`p-3 border rounded-xl text-xs font-semibold text-center ${
              message.includes('created')
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Store / Vendor Name *
              </label>
              <input
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="e.g. Campus Grill"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="vendor@campus.ac.za"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Vendor Account' : 'Log In'}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs border-t border-neutral-800 pt-4">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
            }}
            className="text-orange-400 font-bold hover:underline"
          >
            {isSignUp ? 'Already have an account? Log in' : "New vendor? Create an account"}
          </button>
          <Link href="/" className="text-neutral-500 hover:text-neutral-300 transition-colors">
            ← Home
          </Link>
        </div>
      </div>
    </main>
  );
}