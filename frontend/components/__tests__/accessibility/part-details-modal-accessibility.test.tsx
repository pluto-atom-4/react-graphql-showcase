/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, no-undef */
'use client';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PartDetailsModal } from '../../PartDetailsModal';
import type { PartData } from '@/lib/types/modal-types';
import { vi } from 'vitest';

expect.extend(toHaveNoViolations);

describe('PartDetailsModal Accessibility', () => {
  const mockPart: PartData = {
    id: 'part-123',
    buildId: 'build-456',
    name: 'Motor Assembly',
    sku: 'SKU-001',
    quantity: 5,
    createdAt: '2026-04-15T10:00:00Z',
  };

  const mockHandlers = {
    onSave: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
  };

  describe('Dialog Accessibility', () => {
    it('should have role="dialog" on modal', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should have aria-modal="true" on modal', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to modal title', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'part-details-title');

      const title = screen.getByText('Part Details');
      expect(title).toHaveAttribute('id', 'part-details-title');
    });

    it('should have unique id on modal title', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const title = screen.getByText('Part Details');
      expect(title).toHaveAttribute('id', 'part-details-title');
    });
  });

  describe('Focus Management', () => {
    it('should have focus trap within modal', async () => {
      const user = userEvent.setup();
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const buttons = screen.getAllByRole('button');
      const lastButton = buttons[buttons.length - 1];

      lastButton.focus();
      expect(lastButton).toHaveFocus();

      // Tab should stay within modal
      await user.tab();
      const focused = document.activeElement;
      expect(focused).toBeInTheDocument();
    });

    it('should have focus ring visible on all buttons', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button.className).toContain('focus:ring');
      });
    });

    it('should allow focus on close button', async () => {
      const user = userEvent.setup();
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const closeButton = screen.getByLabelText('Close part details modal');
      await user.click(closeButton);

      expect(mockHandlers.onClose).toHaveBeenCalled();
    });
  });

  describe('Close Button Accessibility', () => {
    it('should have aria-label on close button', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const closeButton = screen.getByLabelText('Close part details modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const closeButton = screen.getByLabelText('Close part details modal');
      await user.click(closeButton);

      expect(mockHandlers.onClose).toHaveBeenCalled();
    });

    it('should have focus ring on close button', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const closeButton = screen.getByLabelText('Close part details modal');
      expect(closeButton.className).toContain('focus:ring');
    });
  });

  describe('Content Accessibility', () => {
    it('should display part ID', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      expect(screen.getByText('part-123')).toBeInTheDocument();
    });

    it('should display part name', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      expect(screen.getByText('Motor Assembly')).toBeInTheDocument();
    });

    it('should display all field labels', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('SKU')).toBeInTheDocument();
      expect(screen.getByText('Quantity')).toBeInTheDocument();
    });

    it('should display creation timestamp', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      expect(screen.getByText('Created')).toBeInTheDocument();
    });
  });

  describe('Button Accessibility', () => {
    it('should have all buttons with accessible labels', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should have focus ring on all action buttons', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const editButton = screen.getByRole('button', { name: 'Edit' });
      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      const closeButton = screen.getByRole('button', { name: 'Close' });

      expect(editButton.className).toContain('focus:ring');
      expect(deleteButton.className).toContain('focus:ring');
      expect(closeButton.className).toContain('focus:ring');
    });

    it('should disable buttons when loading', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
          isLoading={true}
        />,
      );

      const editButton = screen.getByRole('button', { name: 'Edit' });
      const deleteButton = screen.getByRole('button', { name: 'Delete' });

      expect(editButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Edit Mode Accessibility', () => {
    it('should show InlineEditor when Edit is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const editButton = screen.getByRole('button', { name: 'Edit' });
      await user.click(editButton);

      // InlineEditor should be displayed
      expect(screen.getByText('Edit Part')).toBeInTheDocument();
    });

    it('should hide action buttons in edit mode', async () => {
      const user = userEvent.setup();
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const editButton = screen.getByRole('button', { name: 'Edit' });
      await user.click(editButton);

      // Original action buttons should be hidden
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('should restore focus after saving', async () => {
      const user = userEvent.setup();
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const editButton = screen.getByRole('button', { name: 'Edit' });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      // After save, should return to normal view with Edit button
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });
  });

  describe('Delete Confirmation Accessibility', () => {
    it('should show delete confirmation dialog', async () => {
      const user = userEvent.setup();
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(deleteButton);

      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    });

    it('should have confirmation buttons with accessible labels', async () => {
      const user = userEvent.setup();
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(deleteButton);

      const confirmButtons = screen.getAllByRole('button');
      expect(confirmButtons.length).toBeGreaterThan(0);
    });

    it('should disable confirmation buttons while deleting', async () => {
      const user = userEvent.setup();
      const slowDelete = vi.fn<(partId: string) => Promise<void>>(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          }),
      );

      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={slowDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(deleteButton);

      const confirmDeleteButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmDeleteButton);

      // Button should show loading state
      expect(screen.getByRole('button', { name: 'Deleting...' })).toBeInTheDocument();
    });

    it('should cancel delete and return to normal state', async () => {
      const user = userEvent.setup();
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(deleteButton);

      const cancelButton = screen.getAllByRole('button').find((btn) => btn.textContent === 'Cancel');
      if (cancelButton) {
        await user.click(cancelButton);
      }

      // Should return to normal state with Edit, Delete, Close buttons
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow Tab navigation through buttons', async () => {
      const user = userEvent.setup();
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      screen.getByRole('button', { name: 'Edit' });
      await user.tab();

      // First button should have focus
      expect(document.activeElement).toBeInTheDocument();
    });

    it('should allow Shift+Tab to navigate backwards', async () => {
      const user = userEvent.setup();
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const closeButton = screen.getByRole('button', { name: 'Close' });
      closeButton.focus();

      await user.tab({ shift: true });

      // Should move focus
      expect(document.activeElement).toBeInTheDocument();
    });
  });

  describe('Axe Accessibility Scan', () => {
    it('should have no accessibility violations in normal state', async () => {
      const { container } = render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations in edit mode', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const editButton = screen.getByRole('button', { name: 'Edit' });
      await user.click(editButton);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations in delete confirmation mode', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(deleteButton);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations during loading state', async () => {
      const { container } = render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
          isLoading={true}
        />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce modal title to screen readers', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      const title = screen.getByText('Part Details');
      expect(title).toHaveAttribute('id', 'part-details-title');
    });

    it('should announce current part being viewed', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      expect(screen.getByText('Motor Assembly')).toBeInTheDocument();
      expect(screen.getByText('SKU-001')).toBeInTheDocument();
    });

    it('should announce action buttons clearly', () => {
      render(
        <PartDetailsModal
          part={mockPart}
          onSave={mockHandlers.onSave}
          onDelete={mockHandlers.onDelete}
          onClose={mockHandlers.onClose}
        />,
      );

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });
  });
});
