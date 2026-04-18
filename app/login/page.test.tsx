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
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockResetPasswordForEmail = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}));

describe('LoginPage - Forgot Password Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('can navigate to forgot password view', () => {
    render(<LoginPage />);
    
    // Initially on login view
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    
    // Click Forgot Password? link
    const forgotPasswordBtn = screen.getByRole('button', { name: 'Forgot Password?' });
    fireEvent.click(forgotPasswordBtn);
    
    // Now on reset password view
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Password')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
  });

  it('calls resetPasswordForEmail on form submission', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    render(<LoginPage />);
    
    // Navigate to forgot password
    fireEvent.click(screen.getByRole('button', { name: 'Forgot Password?' }));
    
    // Fill out email
    const emailInput = screen.getByPlaceholderText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@symbria.com' } });
    
    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Send Reset Link' });
    fireEvent.click(submitBtn);
    
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'test@symbria.com',
      expect.objectContaining({ redirectTo: expect.stringContaining('/auth/callback?next=/update-password') })
    );
    
    await waitFor(() => {
      expect(screen.getByText('Success! Password reset instructions sent to your email.')).toBeInTheDocument();
    });
  });

  it('handles error when resetPasswordForEmail fails', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'User not found' } });
    render(<LoginPage />);
    
    // Navigate to forgot password
    fireEvent.click(screen.getByRole('button', { name: 'Forgot Password?' }));
    
    // Fill out email
    const emailInput = screen.getByPlaceholderText('Email');
    fireEvent.change(emailInput, { target: { value: 'notfound@symbria.com' } });
    
    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Send Reset Link' });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Error: User not found')).toBeInTheDocument();
    });
  });
});
