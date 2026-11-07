import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReadingFormModal from '../components/ReadingFormModal';

// Mock api service
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn()
  }
}));

describe('ReadingFormModal Component', () => {
  it('renders modal with required form fields when isOpen is true', () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(screen.getByText(/Log Blood Glucose Reading/i)).toBeInTheDocument();
    expect(screen.getByText('Morning (fasting)')).toBeInTheDocument();
    expect(screen.getByText('After breakfast')).toBeInTheDocument();
    expect(screen.getByText('After lunch')).toBeInTheDocument();
    expect(screen.getByText('After dinner')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. 110/i)).toBeInTheDocument();
  });

  it('shows error when glucose value is empty', async () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Save Reading/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Please enter a glucose value.')).toBeInTheDocument();
    });
  });

  it('shows error when glucose value is less than 40 or greater than 600', async () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/e.g. 110/i);
    const submitBtn = screen.getByRole('button', { name: /Save Reading/i });

    // Under 40
    fireEvent.change(input, { target: { value: '25' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    });

    // Over 600
    fireEvent.change(input, { target: { value: '650' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    });
  });

  it('shows error when date is in the future', async () => {
    render(
      <ReadingFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    const dateInput = screen.getByLabelText(/Reading Date/i);
    const valueInput = screen.getByPlaceholderText(/e.g. 110/i);
    const submitBtn = screen.getByRole('button', { name: /Save Reading/i });

    // Set a future year date
    fireEvent.change(dateInput, { target: { value: '2099-12-31' } });
    fireEvent.change(valueInput, { target: { value: '110' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Date cannot be in the future.')).toBeInTheDocument();
    });
  });
});
