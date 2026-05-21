import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ImageUploadInput from './ImageUploadInput';

// Mock URL.createObjectURL and URL.revokeObjectURL
beforeAll(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
});

describe('ImageUploadInput Component', () => {
  it('renders correctly with label', () => {
    render(<ImageUploadInput label="Test Label" onChange={() => {}} />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose file/i })).toBeInTheDocument();
    expect(screen.getByText('No file chosen')).toBeInTheDocument();
  });

  it('opens popup when Choose File is clicked', () => {
    render(<ImageUploadInput onChange={() => {}} />);
    
    // Popup should not be visible initially
    expect(screen.queryByText('Select Image Source')).not.toBeInTheDocument();
    
    // Click Choose File
    fireEvent.click(screen.getByRole('button', { name: /choose file/i }));
    
    // Popup should now be visible
    expect(screen.getByText('Select Image Source')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload photo/i })).toBeInTheDocument();
  });

  it('closes popup when Cancel is clicked', () => {
    render(<ImageUploadInput onChange={() => {}} />);
    
    // Open popup
    fireEvent.click(screen.getByRole('button', { name: /choose file/i }));
    expect(screen.getByText('Select Image Source')).toBeInTheDocument();
    
    // Click Cancel
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    
    // Popup should be closed
    expect(screen.queryByText('Select Image Source')).not.toBeInTheDocument();
  });

  it('displays the file name and preview when a file is provided', () => {
    const mockFile = new File(['mock content'], 'test-image.png', { type: 'image/png' });
    
    render(<ImageUploadInput onChange={() => {}} file={mockFile} />);
    
    expect(screen.getByText('test-image.png')).toBeInTheDocument();
    
    // The preview image should be rendered
    const img = screen.getByAltText('Preview');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'blob:mock-url');
  });
});
