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
    
    // There are two login links (Desktop and Mobile)
    const loginLinks = screen.getAllByRole('link', { name: /Login/i })
    expect(loginLinks.length).toBeGreaterThan(0)
    
    // Should NOT show Dashboard link
    expect(screen.queryByRole('link', { name: /Dashboard/i })).not.toBeInTheDocument()
  })

  it('renders dashboard links when authenticated', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '123' } } } })
    
    render(<Nav />)
    
    await waitFor(() => {
      // There are two dashboard links (Desktop and Mobile)
      const dashboardLinks = screen.getAllByRole('link', { name: /Dashboard/i })
      expect(dashboardLinks.length).toBeGreaterThan(0)
      
      const feedbackLinks = screen.getAllByRole('link', { name: /Feedback/i })
      expect(feedbackLinks.length).toBeGreaterThan(0)

      const contactsLinks = screen.getAllByRole('link', { name: /Contacts/i })
      expect(contactsLinks.length).toBeGreaterThan(0)
      
      const logoutBtns = screen.getAllByRole('button', { name: /Logout/i })
      expect(logoutBtns.length).toBeGreaterThan(0)
    })
  })

  it('handles logout correctly', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '123' } } } })
    
    render(<Nav />)
    
    await waitFor(() => {
      const logoutBtns = screen.getAllByRole('button', { name: /Logout/i })
      fireEvent.click(logoutBtns[0]) // Click the first one found
    })

    expect(mockSignOut).toHaveBeenCalled()
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/')
    })
  })
})
