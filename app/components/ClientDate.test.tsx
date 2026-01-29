import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ClientDate from './ClientDate'

describe('ClientDate Component', () => {
  it('renders the formatted date after mounting', async () => {
    render(<ClientDate timestamp="2026-01-29T12:00:00Z" />)
    
    await waitFor(() => {
      const dateElement = screen.getByText((content) => {
        return content.includes('1/29/2026') || content.includes('29/01/2026')
      })
      expect(dateElement).toBeInTheDocument()
    })
  })
})
