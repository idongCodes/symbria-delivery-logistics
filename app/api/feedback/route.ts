// app/api/feedback/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Ensure you are using the helper we made
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const loginLink = `${baseUrl}/admin/feedback`;
    
    // Configure Transporter using Environment Variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Symbria Logistics" <no-reply@symbria.com>',
      to: ['idongesit_essien@ymail.com', 'ressien1@symbria.com'], 
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

    return NextResponse.json(newFeedback, { status: 200 });

  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Error submitting feedback' }, { status: 500 });
  }
}