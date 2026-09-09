'use client';

export default function SuspensionNotice({ isSuspended }: { isSuspended: boolean }) {
  if (!isSuspended) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-neutral-950 flex items-center justify-center p-6 select-none font-sans text-neutral-200">
      <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        
        {/* Warning Badge */}
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl font-black">
          🚫
        </div>

        {/* Notice Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            Website Suspended
          </h1>
          <p className="text-xs text-red-400 font-mono uppercase tracking-widest">
            Error Code: 502_PAYMENT_REQUIRED
          </p>
        </div>

        <div className="h-px bg-neutral-800 w-full" />

        {/* Message */}
        <p className="text-sm text-neutral-400 leading-relaxed">
          This account and associated services have been temporarily deactivated due to an outstanding balance or expired hosting agreement.
        </p>

        {/* Detailed Box */}
        <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl text-left space-y-2 text-xs font-mono text-neutral-400">
          <p><span className="text-neutral-500">Status:</span> Pending Owner Settlement</p>
          <p><span className="text-neutral-500">Service:</span> Campus Bites Core Infrastructure</p>
          <p><span className="text-neutral-500">Action:</span> Contact site administrator to restore access</p>
        </div>

        {/* Footer */}
        <div className="pt-2 text-[11px] text-neutral-500">
          If you are the owner of this site, please log into your billing portal to resolve unpaid invoices and reactivate hosting.
        </div>

      </div>
    </div>
  );
}