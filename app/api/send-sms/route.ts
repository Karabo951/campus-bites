import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  try {
    const { phone, customerName, orderId } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Convert local SA phone format (e.g. 0760464256) to international format (+27760464256)
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+27' + formattedPhone.slice(1);
    }

    // Send SMS via Twilio
    const message = await client.messages.create({
      body: `Hi ${customerName || 'there'}! Your Campus Bites order #${orderId} is READY for pickup! 🍔`,
      from: twilioNumber,
      to: formattedPhone,
    });

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (error: any) {
    console.error('SMS Send Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}