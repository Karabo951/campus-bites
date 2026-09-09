'use client';

export default function SuspensionNotice({ isSuspended }: { isSuspended: boolean }) {
  if (!isSuspended) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-neutral-950 flex items-center justify-center p-6 select-none font-sans text-neutral-200">
      <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        
        {/* Billing / Invoice Icon */}
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold shadow-lg shadow-amber-500/10">
          💳
        </div>

        {/* Notice Header */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Payment Required
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase pt-1">
            Hosting & Web Services Paused
          </h1>
          <p className="text-xs text-neutral-400">
            The active hosting plan for this website has expired.
          </p>
        </div>

        <div className="h-px bg-neutral-800 w-full" />

        {/* Price Card */}
        <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl space-y-2 text-center">
          <p className="text-xs text-neutral-400 font-medium">Standard Web Hosting Fee</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-black text-white">R120</span>
            <span className="text-xs font-bold text-neutral-400">/ month</span>
          </div>
          <p className="text-[11px] text-amber-400/90 font-mono pt-1">
            Required balance: R120.00 pm to restore and maintain service
          </p>
        </div>

        {/* Action Details */}
        <div className="bg-neutral-950/60 border border-neutral-800 p-4 rounded-xl text-left space-y-2 text-xs font-mono text-neutral-400">
          <p><span className="text-neutral-500">Service:</span> Campus Bites Production Hosting</p>
          <p><span className="text-neutral-500">Status:</span> Pending Developer Settlement</p>
          <p><span className="text-neutral-500">Action:</span> Contact developer to make payment & reactivate</p>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-neutral-500 leading-relaxed">
          If you are the website owner, please arrange the payment with your web developer to avoid permanent deletion of hosted data.
        </p>

      </div>
    </div>
  );
}