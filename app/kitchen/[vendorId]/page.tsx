'use client';
import { useState, useEffect, useRef, use } from 'react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  order_number: number;
  student_name: string;
  total_amount: number;
  status: string;
}

export default function KitchenView({ params }
  
  : { params: Promise<{ vendorId: string }> }) {
  const resolvedParams = use(params);
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Web Audio Context setup
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setSoundEnabled(true);
  };

  // Play high-pitch double chime for incoming orders
  const playNotificationSound = () => {
    if (!audioCtxRef.current) return;

    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      // Note 1 (High C - 523.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2 (High E - 659.25Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.15);
      gain2.gain.setValueAtTime(0.4, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.5);
    } catch (err) {
      console.error('Failed to play notification audio:', err);
    }
  };

  useEffect(() => {
    // 1. Initial order fetch
    supabase
      .from('orders')
      .select('*')
      .eq('vendor_id', resolvedParams.vendorId)
      .neq('status', 'completed')
      .then(({ data }) => {
        if (data) setOrders(data);
      });

    // 2. Real-time subscription for incoming orders
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${resolvedParams.vendorId}`,
        },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders((prev) => [newOrder, ...prev]);

          // Play audio notification on new order
          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedParams.vendorId]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    if (status === 'completed') {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } else {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans text-slate-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black uppercase text-slate-800">Kitchen Display System (KDS)</h1>

        {/* Audio Toggle Button */}
        {!soundEnabled ? (
          <button
            onClick={initAudio}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-sm shadow animate-bounce"
          >
            🔔 Enable Sound Alerts
          </button>
        ) : (
          <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Sound Alerts Active
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <p className="text-slate-500 font-bold">No active orders right now.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className={`p-5 rounded-2xl border-2 ${
                o.status === 'ready' ? 'border-emerald-500 bg-emerald-50' : 'border-amber-500 bg-amber-50'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-4xl font-black text-slate-900">#{o.order_number}</span>
                <span className="font-bold text-lg text-slate-700">R{Number(o.total_amount).toFixed(2)}</span>
              </div>
              <p className="text-lg font-semibold text-slate-800 mb-4">{o.student_name}</p>
              <div className="flex gap-2">
                {o.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(o.id, 'ready')}
                    className="flex-1 bg-amber-500 text-white font-bold py-3 rounded-xl shadow hover:bg-amber-600"
                  >
                    Mark Ready
                  </button>
                )}
                {o.status === 'ready' && (
                  <button
                    onClick={() => updateStatus(o.id, 'completed')}
                    className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl shadow hover:bg-emerald-700"
                  >
                    Collected / Done
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}