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

  it('can toggle to register view', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Register here' }));
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up with Email' })).toBeInTheDocument();
  });

  it('calls signInWithOtp on login submission', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@symbria.com' } });
    
    const submitBtn = screen.getByRole('button', { name: 'Send Magic Link' });
    fireEvent.click(submitBtn);
    
    expect(mockSignInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@symbria.com',
        options: expect.objectContaining({ 
          shouldCreateUser: false,
          emailRedirectTo: expect.stringContaining('/auth/callback?next=/dashboard')
        })
      })
    );
    
    await waitFor(() => {
      expect(screen.getByText('Success! Please check your email for a magic link to log in.')).toBeInTheDocument();
    });
  });

  it('calls signInWithOtp on register submission', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    render(<LoginPage />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Register here' }));
    
    fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Phone Number (Ex: 555-123-4567)'), { target: { value: '555-555-5555' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'jdoe@symbria.com' } });
    
    const submitBtn = screen.getByRole('button', { name: 'Sign Up with Email' });
    fireEvent.click(submitBtn);
    
    expect(mockSignInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'jdoe@symbria.com',
        options: expect.objectContaining({ 
          shouldCreateUser: true,
          emailRedirectTo: expect.stringContaining('/auth/callback?next=/dashboard')
        })
      })
    );
    
    await waitFor(() => {
      expect(screen.getByText('Success! Please check your email for a login link.')).toBeInTheDocument();
    });
  });
});