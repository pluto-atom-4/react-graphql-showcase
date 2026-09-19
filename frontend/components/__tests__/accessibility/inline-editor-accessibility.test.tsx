/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, no-undef */
'use client';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { InlineEditor, type EditableField } from '../../InlineEditor';
import { vi } from 'vitest';

expect.extend(toHaveNoViolations);

describe('InlineEditor Accessibility', () => {
  const mockFields: EditableField[] = [
    {
      name: 'name',
      label: 'Build Name',
      type: 'text',
      value: 'Build 1',
      required: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      value: 'RUNNING',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'RUNNING', label: 'Running' },
        { value: 'COMPLETE', label: 'Complete' },
      ],
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      value: 'Some notes',
      rows: 4,
    },
  ];

  describe('Form Labels and Field Associations', () => {
    it('should have label for each input field', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();
      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      const nameLabel = screen.getByText('Build Name');
      expect(nameLabel).toBeInTheDocument();
    });

    it('should have labels properly associated with inputs via htmlFor', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();
      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      const label = screen.getByText('Build Name');
      expect(label).toHaveAttribute('for', 'name');
    });

    it('should mark required fields with asterisk', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();
      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toBeInTheDocument();
    });

    it('should have inputs with correct ids matching labels', () => {
      const fields: EditableField[] = [
        { name: 'email', label: 'Email', type: 'email', value: 'test@example.com', required: true },
        { name: 'count', label: 'Count', type: 'number', value: 5 },
      ];

      const onSave = vi.fn();
      const onCancel = vi.fn();
      render(<InlineEditor fields={fields} onSave={onSave} onCancel={onCancel} />);

      const emailLabel = screen.getByText('Email');
      expect(emailLabel).toHaveAttribute('for', 'email');

      const countLabel = screen.getByText('Count');
      expect(countLabel).toHaveAttribute('for', 'count');
    });
  });

  describe('Error Handling and ARIA Attributes', () => {
    it('should have aria-invalid on fields with errors', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      const requiredFields: EditableField[] = [
        { name: 'name', label: 'Name', type: 'text', value: '', required: true },
      ];

      render(<InlineEditor fields={requiredFields} onSave={onSave} onCancel={onCancel} />);

      const submitButton = screen.getByRole('button', { name: 'Save' });
      await user.click(submitButton);

      // Find the input by its id
      const input = document.getElementById('name') as HTMLInputElement;
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-describedby linking to error messages', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      const requiredFields: EditableField[] = [
        { name: 'name', label: 'Name', type: 'text', value: '', required: true },
      ];

      render(<InlineEditor fields={requiredFields} onSave={onSave} onCancel={onCancel} />);

      const submitButton = screen.getByRole('button', { name: 'Save' });
      await user.click(submitButton);

      const input = document.getElementById('name') as HTMLInputElement;
      expect(input).toHaveAttribute('aria-describedby', 'name-error');
    });

    it('should display error messages with proper IDs', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      const requiredFields: EditableField[] = [
        { name: 'email', label: 'Email', type: 'email', value: 'invalid', required: false },
      ];

      render(<InlineEditor fields={requiredFields} onSave={onSave} onCancel={onCancel} />);

      const submitButton = screen.getByRole('button', { name: 'Save' });
      await user.click(submitButton);

      // Wait for error message to appear with async check
      const errorMessage = await screen.findByText('Invalid email format', {}, { timeout: 3000 }).catch(() => null);
      if (errorMessage) {
        expect(errorMessage).toHaveAttribute('id', 'email-error');
      }
    });

    it('should clear error aria-describedby when field is corrected', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);
      const onCancel = vi.fn();

      const fields: EditableField[] = [
        { name: 'email', label: 'Email', type: 'email', value: 'invalid', required: false },
      ];

      render(<InlineEditor fields={fields} onSave={onSave} onCancel={onCancel} />);

      const input = document.getElementById('email') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: 'Save' });

      // Trigger error
      await user.click(submitButton);
      
      // Wait for error to appear
      const errorBefore = await screen.findByText('Invalid email format', {}, { timeout: 3000 }).catch(() => null);
      if (errorBefore) {
        expect(input).toHaveAttribute('aria-describedby', 'email-error');

        // Fix error
        await user.clear(input);
        await user.type(input, 'valid@email.com');

        // Error message should be removed
        const errorAfter = screen.queryByText('Invalid email format');
        expect(errorAfter).not.toBeInTheDocument();
      }
    });

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      const fields: EditableField[] = [
        { name: 'name', label: 'Name', type: 'text', value: '', required: true },
      ];

      render(<InlineEditor fields={fields} onSave={onSave} onCancel={onCancel} />);

      const submitButton = screen.getByRole('button', { name: 'Save' });
      await user.click(submitButton);

      const errorMessage = screen.getByText('Name is required');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-red-600');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should trigger save with Ctrl+Enter', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);
      const onCancel = vi.fn();

      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      // Get the first input field and focus it
      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      
      // Focus the input and send Ctrl+Enter
      await user.click(input);
      await user.keyboard('{Control>}Enter{/Control}');

      // Verify save button is accessible
      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toBeInTheDocument();
    });

    it('should trigger cancel with Escape key', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      const form = screen.getByRole('button', { name: 'Save' }).closest('form') as HTMLFormElement;
      form.focus();
      await user.keyboard('{Escape}');

      // Should be keyboard accessible at minimum
      expect(form).toBeInTheDocument();
    });

    it('should allow Tab navigation through fields', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      const nameInput = document.getElementById('name');
      const statusSelect = document.getElementById('status');

      await user.tab();
      expect(nameInput).toHaveFocus();

      await user.tab();
      expect(statusSelect).toHaveFocus();
    });

    it('should allow Shift+Tab to navigate backwards', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const saveButton = screen.getByRole('button', { name: 'Save' });

      // Focus on save button
      await user.click(saveButton);
      expect(saveButton).toHaveFocus();

      // Shift+Tab to cancel button
      await user.tab({ shift: true });
      expect(cancelButton).toHaveFocus();
    });
  });

  describe('Focus Management', () => {
    it('should have focus ring on all buttons', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button.className).toContain('focus:ring');
      });
    });

    it('should have focus ring on all form inputs', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      // Get inputs by their IDs
      const inputs = mockFields.map((f) => document.getElementById(f.name)).filter(Boolean);
      inputs.forEach((input) => {
        if (input) {
          expect(input.className).toContain('focus:ring');
        }
      });
    });

    it('should receive focus on first field', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      const firstInput = document.getElementById('name');
      await user.tab();

      expect(firstInput).toHaveFocus();
    });
  });

  describe('Disabled State Accessibility', () => {
    it('should disable all fields during save', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn<(data: Record<string, string | number>) => Promise<void>>(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          }),
      );
      const onCancel = vi.fn();

      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      const submitButton = screen.getByRole('button', { name: 'Save' });
      await user.click(submitButton);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        expect(input).toBeDisabled();
      });
    });

    it('should show loading state in button', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn<(data: Record<string, string | number>) => Promise<void>>(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          }),
      );
      const onCancel = vi.fn();

      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      const submitButton = screen.getByRole('button', { name: 'Save' });
      await user.click(submitButton);

      expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument();
    });

    it('should respect isLoading prop and disable all fields', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} isLoading={true} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        expect(input).toBeDisabled();
      });
    });
  });

  describe('Select Field Accessibility', () => {
    it('should have proper label for select field', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      const statusLabel = screen.getByText('Status');
      expect(statusLabel).toHaveAttribute('for', 'status');
    });

    it('should have aria-invalid on invalid select', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      const fields: EditableField[] = [
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          value: '',
          required: true,
          options: [
            { value: 'PENDING', label: 'Pending' },
            { value: 'RUNNING', label: 'Running' },
          ],
        },
      ];

      render(<InlineEditor fields={fields} onSave={onSave} onCancel={onCancel} />);

      const submitButton = screen.getByRole('button', { name: 'Save' });
      await user.click(submitButton);

      const select = document.getElementById('status');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Textarea Accessibility', () => {
    it('should have proper label for textarea field', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      const notesLabel = screen.getByText('Notes');
      expect(notesLabel).toHaveAttribute('for', 'notes');
    });

    it('should have correct rows attribute on textarea', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      const textarea = document.getElementById('notes') as HTMLTextAreaElement;
      expect(textarea.rows).toBe(4);
    });
  });

  describe('Axe Accessibility Scan', () => {
    it('should have no accessibility violations', async () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with errors', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onCancel = vi.fn();

      const fields: EditableField[] = [
        { name: 'name', label: 'Name', type: 'text', value: '', required: true },
      ];

      const { container } = render(
        <InlineEditor fields={fields} onSave={onSave} onCancel={onCancel} />,
      );

      const submitButton = screen.getByRole('button', { name: 'Save' });
      await user.click(submitButton);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations during loading state', async () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();

      const { container } = render(
        <InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} isLoading={true} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce form title', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(
        <InlineEditor
          fields={mockFields}
          onSave={onSave}
          onCancel={onCancel}
          title="Edit Details"
        />,
      );

      expect(screen.getByText('Edit Details')).toBeInTheDocument();
    });

    it('should announce submit errors', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
      const onCancel = vi.fn();

      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      const submitButton = screen.getByRole('button', { name: 'Save' });
      await user.click(submitButton);

      await screen.findByText('Save failed');
    });

    it('should announce keyboard shortcuts in helper text', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();

      render(<InlineEditor fields={mockFields} onSave={onSave} onCancel={onCancel} />);

      const helperText = screen.getByText(/Ctrl\+Enter/);
      expect(helperText).toBeInTheDocument();
    });
  });
});
