// app/api/feedback/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Ensure you are using the helper we made
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const body = await req.json();
    const { name, email, message } = body;

    // 1. Validation
    if (!email || !email.endsWith('@symbria.com')) {
      return NextResponse.json(
        { error: 'Unauthorized: Only @symbria.com emails are allowed.' }, 
        { status: 400 }
      );
    }

    // 2. Save to Database
    const newFeedback = await prisma.feedback.create({
      data: {
        name,
        email,
        message,
      },
    });

    // 3. Send Email Notification
    // 👇 UPDATED: Hardcoded link to your production Vercel app
    const loginLink = "https://symbria-delivery-logistics.vercel.app/admin/feedback"; 
    
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', 
      to: 'i.d.essien@gmail.com', // Keep this as your test email for now
      subject: `New Feedback from ${name}`,
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Message:</strong></p>
        <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #ccc;">
          ${message}
        </blockquote>
        <br />
        <a href="${loginLink}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View in Admin Dashboard
        </a>
      `,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json(
        { error: 'Feedback saved, but email failed to send.' }, 
        { status: 500 }
      );
    }

    return NextResponse.json(newFeedback, { status: 200 });

  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Error submitting feedback' }, { status: 500 });
  }
}
