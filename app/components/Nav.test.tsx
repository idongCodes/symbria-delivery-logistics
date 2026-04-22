import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Nav from './Nav'

// Mock next/navigation
const pushMock = vi.fn()
const refreshMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
  usePathname: () => '/',
}))

// Mock Supabase
const mockSignOut = vi.fn()
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}))

describe('Nav Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  })

  it('renders login link when not authenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    
    render(<Nav />)
    
    // Open the menu
    const menuBtn = screen.getByRole('button', { name: /Menu/i })
    fireEvent.click(menuBtn)
    
    // Verify menu items are visible
    expect(screen.getByRole('link', { name: /Complete Pre\/Post-Trip/i })).toBeInTheDocument()
    
    // Simulate click outside
    fireEvent.mouseDown(document.body)
    
    // Verify menu items are no longer visible
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /Complete Pre\/Post-Trip/i })).not.toBeInTheDocument()
    })
    
    // Should NOT show Trip Log link (from desktop authenticated view)
    expect(screen.queryByRole('link', { name: /Trip Log/i, hidden: false })).not.toBeInTheDocument()
    
    // Should NOT show Contacts link directly (it's inside the menu)
    expect(screen.queryByRole('link', { name: /Contacts/i, hidden: false })).not.toBeInTheDocument()
  })

  it('renders dashboard links when authenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '123' } } } })
    
    render(<Nav />)
    
    // Wait for the auth session to set loggedIn to true
    await waitFor(() => {
      // Find the menu button. It's the same button for both states now.
      const menuBtn = screen.getByRole('button', { name: /Menu/i })
      expect(menuBtn).toBeInTheDocument()
    })

    // Open the menu
    const menuBtn = screen.getByRole('button', { name: /Menu/i })
    fireEvent.click(menuBtn)
    
    await waitFor(() => {
      // There is now only one of each link since desktop inline and mobile bottom are gone
      const dashboardLink = screen.getByRole('link', { name: /Trip Log/i })
      expect(dashboardLink).toBeInTheDocument()
      
      const feedbackLink = screen.getByRole('link', { name: /Feedback/i })
      expect(feedbackLink).toBeInTheDocument()

      const contactsLink = screen.getByRole('link', { name: /Contacts/i })
      expect(contactsLink).toBeInTheDocument()
      
      const logoutBtn = screen.getByRole('button', { name: /Logout/i })
      expect(logoutBtn).toBeInTheDocument()
    })
  })

  it('handles logout correctly', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '123' } } } })
    
    render(<Nav />)
    
    // Wait for the auth session to resolve
    await waitFor(() => {
      const menuBtn = screen.getByRole('button', { name: /Menu/i })
      expect(menuBtn).toBeInTheDocument()
    })

    // Open the menu
    const menuBtn = screen.getByRole('button', { name: /Menu/i })
    fireEvent.click(menuBtn)
    
    await waitFor(() => {
      const logoutBtn = screen.getByRole('button', { name: /Logout/i })
      fireEvent.click(logoutBtn) 
    })

    expect(mockSignOut).toHaveBeenCalled()
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/')
    })
  })
})
