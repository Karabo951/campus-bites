import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vendorId, itemName, price, paymentMethod, userId, customerName, customerPhone } = body;

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
          user_id: userId || null,
          customer_name: customerName || 'Guest Student',
          customer_phone: customerPhone || 'N/A',
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