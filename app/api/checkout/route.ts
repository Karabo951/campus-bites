import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vendorId, itemName, price, paymentMethod } = body;

    // 1. Simulate payment gateway verification (Stripe / PayFast / Card verification)
    const isPaymentSuccessful = true; // Set to true after gateway hook

    if (!isPaymentSuccessful) {
      return NextResponse.json(
        { error: 'Payment failed or was declined.' },
        { status: 400 }
      );
    }

    // 2. Insert verified order into Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          vendor_id: vendorId,
          item_name: itemName,
          price: price,
          status: 'pending',
          payment_status: 'paid',
          payment_method: paymentMethod || 'card',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}