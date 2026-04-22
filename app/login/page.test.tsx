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

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login view by default', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Admin Login' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('calls signInWithPassword on login submission', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'lholden@symbria.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Symbria123' } });
    
    const submitBtn = screen.getByRole('button', { name: 'Login' });
    fireEvent.click(submitBtn);
    
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'lholden@symbria.com',
      password: 'Symbria123'
    });
    
    await waitFor(() => {
      expect(screen.getByText('Success! Logging you in...')).toBeInTheDocument();
      expect(pushMock).toHaveBeenCalledWith('/trip-log');
    });
  });

  it('rejects unauthorized emails', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'unauthorized@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Symbria123' } });
    
    const submitBtn = screen.getByRole('button', { name: 'Login' });
    fireEvent.click(submitBtn);
    
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    
    await waitFor(() => {
      expect(screen.getByText('Error: Unauthorized email. Please use the public dashboard access.')).toBeInTheDocument();
    });
  });
});