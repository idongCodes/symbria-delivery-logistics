import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Master account credentials
const MASTER_EMAIL = 'idongesit_essien@ymail.com';
const MASTER_PASSWORD = 'Symbr!@3S0P';
const JWT_SECRET = process.env.JWT_SECRET || 'symbria-secret-key-change-in-production';

// Simple in-memory user store (replace with database in production)
const users: Record<string, { email: string; password: string; firstName: string; lastName: string }> = {
  [MASTER_EMAIL]: {
    email: MASTER_EMAIL,
    password: bcrypt.hashSync(MASTER_PASSWORD, 10),
    firstName: 'Master',
    lastName: 'Account',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = users[email];

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { email: user.email, firstName: user.firstName, lastName: user.lastName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 200 }
    );

    // Set token in httpOnly cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
