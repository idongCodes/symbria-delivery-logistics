import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Simple in-memory user store (replace with database in production)
const users: Record<string, { email: string; password: string; firstName: string; lastName: string }> = {
  'idongesit_essien@ymail.com': {
    email: 'idongesit_essien@ymail.com',
    password: bcrypt.hashSync('Symbr!@3S0P', 10),
    firstName: 'Master',
    lastName: 'Account',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password, passwordConfirm } =
      await request.json();

    if (!firstName || !lastName || !email || !password || !passwordConfirm) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (users[email]) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password and store user
    const hashedPassword = await bcrypt.hash(password, 10);
    users[email] = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. You can now login.',
        user: {
          email,
          firstName,
          lastName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
