import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    if (!email || !email.endsWith('@symbria.com')) {
      return NextResponse.json(
        { error: 'Unauthorized: Only @symbria.com emails are allowed.' }, 
        { status: 400 }
      );
    }

    // 1. Save to Database
    const newFeedback = await prisma.feedback.create({
      data: {
        name,
        email,
        message,
      },
    });

    // 2. Send Email Notification to You
    // Note: We use process.env.NEXT_PUBLIC_APP_URL for the link, or fallback to localhost
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginLink = `${appUrl}/auth/login`; 
    
    await resend.emails.send({
      from: 'onboarding@resend.dev', // Use this default until you verify your own domain
      to: 'idongesit_essien@ymail.com', 
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

    return NextResponse.json(newFeedback, { status: 200 });

  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Error submitting feedback' }, { status: 500 });
  }
}
