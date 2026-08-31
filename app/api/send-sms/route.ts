import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export async function POST(req: Request) {
  try {
    const { phone, customerName, orderId, itemName } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Format phone number (e.g., convert 0761234567 to +27761234567 for South Africa)
    let formattedPhone = phone.trim().replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+27' + formattedPhone.slice(1);
    }

    const message = await client.messages.create({
      body: `Hi ${customerName}! 🍕 Your order #${orderId} (${itemName}) is READY for pickup at Campus Bites!`,
      from: twilioPhone,
      to: formattedPhone,
    });

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (error: any) {
    console.error('SMS Send Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send SMS' }, { status: 500 });
  }
}