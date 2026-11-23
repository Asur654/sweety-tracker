import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReadingModal } from './ReadingModal';

describe('ReadingModal Component Validations', () => {
  const mockOnClose = vi.fn();
  const mockOnSaved = vi.fn();

  it('should render all form controls and slot choices', () => {
    render(
      <ReadingModal
        isOpen={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    expect(screen.getByText('Log Blood Glucose')).toBeInTheDocument();
    expect(screen.getByText('Morning (fasting)')).toBeInTheDocument();
    expect(screen.getByText('After breakfast')).toBeInTheDocument();
    expect(screen.getByText('After lunch')).toBeInTheDocument();
    expect(screen.getByText('After dinner')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 110')).toBeInTheDocument();
  });

  it('Rule 1: should display error when value is empty', () => {
    render(
      <ReadingModal
        isOpen={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Record Reading/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Please enter a glucose value.')).toBeInTheDocument();
  });

  it('Rule 2a: should display error when value is below 40', () => {
    render(
      <ReadingModal
        isOpen={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    const input = screen.getByPlaceholderText('e.g. 110');
    fireEvent.change(input, { target: { value: '35' } });

    const submitBtn = screen.getByRole('button', { name: /Record Reading/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
  });

  it('Rule 2b: should display error when value is above 600', () => {
    render(
      <ReadingModal
        isOpen={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    const input = screen.getByPlaceholderText('e.g. 110');
    fireEvent.change(input, { target: { value: '650' } });

    const submitBtn = screen.getByRole('button', { name: /Record Reading/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
  });
});
