import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UpdatePasswordPage from './page';

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
const mockUpdateUser = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      updateUser: mockUpdateUser,
    },
  }),
}));

describe('UpdatePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders update password form correctly', () => {
    render(<UpdatePasswordPage />);
    
    expect(screen.getByRole('heading', { name: 'Update Password' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Password' })).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    render(<UpdatePasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText('New Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm New Password');
    const submitBtn = screen.getByRole('button', { name: 'Update Password' });

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Error: Passwords do not match.')).toBeInTheDocument();
    });

    // Should not call Supabase
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('calls updateUser and redirects on success', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });
    render(<UpdatePasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText('New Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm New Password');
    const submitBtn = screen.getByRole('button', { name: 'Update Password' });

    fireEvent.change(passwordInput, { target: { value: 'newsecurepass' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newsecurepass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newsecurepass' });
    });

    await waitFor(() => {
      expect(screen.getByText('Success! Your password has been updated. Redirecting...')).toBeInTheDocument();
    });

    // Wait for the 2000ms setTimeout to finish
    await new Promise((resolve) => setTimeout(resolve, 2100));

    expect(pushMock).toHaveBeenCalledWith('/dashboard');
    expect(refreshMock).toHaveBeenCalled();
  });

  it('shows error when updateUser fails', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Password is too weak' } });
    render(<UpdatePasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText('New Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm New Password');
    const submitBtn = screen.getByRole('button', { name: 'Update Password' });

    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'weak' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'weak' });
    });

    await waitFor(() => {
      expect(screen.getByText('Error: Password is too weak')).toBeInTheDocument();
    });
  });
});
