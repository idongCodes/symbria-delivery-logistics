import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

// Ideally, instantiate Prisma outside the handler in a separate file (lib/prisma.ts)
// to prevent "Too many connections" errors in development.
const prisma = new PrismaClient();

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginLink = `${appUrl}/admin/feedback`; 

    // Capture the response
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', 
      to: 'i.d.essien@gmail.com', 
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
          Login to Admin Dashboard
        </a>
      `,
    });

    // If Resend gave us an error, throw it so the catch block sees it.
    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json(
        { error: 'Feedback saved, but email failed to send.' }, 
        { status: 500 }
      );
    }

    // If we get here, both Database and Email succeeded
    return NextResponse.json(newFeedback, { status: 200 });

  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Error submitting feedback' }, { status: 500 });
  }
}
