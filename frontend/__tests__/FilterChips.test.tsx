/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FilterChips } from '../components/FilterChips';

describe('FilterChips Component', () => {
  describe('Rendering', () => {
    it('should return null when no searchTerm', () => {
      const handleRemove = vi.fn();
      const { container } = render(
        <FilterChips searchTerm="" onRemove={handleRemove} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should display search term as chip', () => {
      const handleRemove = vi.fn();
      render(
        <FilterChips searchTerm="important" onRemove={handleRemove} />
      );

      const chip = screen.getByTestId('filter-chip');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent('important');
    });

    it('should truncate long search terms', () => {
      const handleRemove = vi.fn();
      const longTerm = 'a'.repeat(40);

      render(
        <FilterChips searchTerm={longTerm} onRemove={handleRemove} maxLength={30} />
      );

      const chip = screen.getByTestId('filter-chip');
      expect(chip).toHaveTextContent('a'.repeat(30) + '...');
    });

    it('should display full term in title attribute', () => {
      const handleRemove = vi.fn();
      const longTerm = 'a'.repeat(40);

      render(
        <FilterChips searchTerm={longTerm} onRemove={handleRemove} maxLength={30} />
      );

      const chip = screen.getByTestId('filter-chip');
      expect(chip).toHaveAttribute('title', longTerm);
    });

    it('should have remove button with aria-label', () => {
      const handleRemove = vi.fn();
      render(
        <FilterChips searchTerm="test" onRemove={handleRemove} />
      );

      const removeButton = screen.getByTestId('filter-chip-remove');
      expect(removeButton).toHaveAttribute('aria-label', 'Remove filter: test');
    });
  });

  describe('Remove Functionality', () => {
    it('should call onRemove when remove button clicked', () => {
      const handleRemove = vi.fn();
      render(
        <FilterChips searchTerm="test" onRemove={handleRemove} />
      );

      const removeButton = screen.getByTestId('filter-chip-remove');
      fireEvent.click(removeButton);

      expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    it('should call onRemove with correct search term in aria-label', () => {
      const handleRemove = vi.fn();
      const searchTerm = 'specific-term';

      render(
        <FilterChips searchTerm={searchTerm} onRemove={handleRemove} />
      );

      const removeButton = screen.getByTestId('filter-chip-remove');
      expect(removeButton).toHaveAttribute(
        'aria-label',
        `Remove filter: ${searchTerm}`
      );
    });
  });

  describe('Styling', () => {
    it('should have blue chip styling classes', () => {
      const handleRemove = vi.fn();
      render(
        <FilterChips searchTerm="test" onRemove={handleRemove} />
      );

      const chip = screen.getByTestId('filter-chip');
      expect(chip).toHaveClass('bg-blue-100');
      expect(chip).toHaveClass('text-blue-900');
    });

    it('should render filter-chips container', () => {
      const handleRemove = vi.fn();
      render(
        <FilterChips searchTerm="test" onRemove={handleRemove} />
      );

      const container = screen.getByTestId('filter-chips');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only search term', () => {
      const handleRemove = vi.fn();
      render(
        <FilterChips searchTerm="   " onRemove={handleRemove} />
      );

      const chip = screen.getByTestId('filter-chip');
      expect(chip).toBeInTheDocument();
      // The chip contains the text plus the close button
      expect(chip.textContent).toContain('   ');
    });

    it('should handle very short search term', () => {
      const handleRemove = vi.fn();
      render(
        <FilterChips searchTerm="a" onRemove={handleRemove} />
      );

      const chip = screen.getByTestId('filter-chip');
      expect(chip).toHaveTextContent('a');
    });
  });
});
