import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './page';

// Mock next/navigation
const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

// Mock Supabase
const mockSignInWithOtp = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
    },
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login view by default', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Magic Link' })).toBeInTheDocument();
  });

  it('calls signInWithOtp on login submission', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('Email');
    fireEvent.change(emailInput, { target: { value: 'lholden@symbria.com' } });
    
    const submitBtn = screen.getByRole('button', { name: /Send Magic Link/i });
    fireEvent.click(submitBtn);
    
    expect(mockSignInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'lholden@symbria.com',
        options: expect.objectContaining({ 
          shouldCreateUser: false,
          emailRedirectTo: expect.stringContaining('/auth/callback?next=/trip-log')
        })
      })
    );
    
    await waitFor(() => {
      expect(screen.getByText('Success! Please check your email for a magic link to log in.')).toBeInTheDocument();
    });
  });
});