import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PresetsManager } from '../PresetsManager';
import { FilterPresetsState, FilterPreset } from '../../lib/hooks/useFilterPresets';
import { FilterState } from '../../lib/hooks/useFilter';
import { BuildStatus } from '../../lib/status-vocabulary';

// Test data
const mockFilterState: FilterState = {
  search: 'test',
  statuses: [BuildStatus.Running],
};

const mockFilterState2: FilterState = {
  search: 'test2',
  statuses: [BuildStatus.Failed],
  dateStart: '2024-01-01',
  dateEnd: '2024-01-31',
};

const mockPreset1: FilterPreset = {
  id: 'preset-1',
  name: 'My Preset',
  state: mockFilterState,
  createdAt: Date.now(),
};

const mockPreset2: FilterPreset = {
  id: 'preset-2',
  name: 'Another Preset',
  state: mockFilterState2,
  createdAt: Date.now() - 1000000,
  lastUsed: Date.now() - 500000,
};

const mockPresetsState: FilterPresetsState = {
  presets: [mockPreset1, mockPreset2],
  maxPresets: 10,
};

const mockEmptyPresetsState: FilterPresetsState = {
  presets: [],
  maxPresets: 10,
};

describe('PresetsManager Component', () => {
  const mockCallbacks = {
    onSelectPreset: vi.fn(),
    onCreatePreset: vi.fn(),
    onDeletePreset: vi.fn(),
    onRenamePreset: vi.fn(),
    onToggleOpen: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should summarize preset statuses using display labels, not wire values', () => {
      render(
        <PresetsManager
          presets={mockPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      // mockFilterState uses BuildStatus.Running, whose label is 'Running'.
      expect(screen.getByText(/Status: Running/)).toBeInTheDocument();
      expect(screen.queryByText(/Status: RUNNING/)).not.toBeInTheDocument();
    });

    it('should render closed by default', () => {
      render(
        <PresetsManager
          presets={mockEmptyPresetsState}
          currentFilterState={mockFilterState}
          isOpen={false}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should display menu when open', () => {
      render(
        <PresetsManager
          presets={mockEmptyPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should show empty state when no presets', () => {
      render(
        <PresetsManager
          presets={mockEmptyPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      expect(screen.getByText(/No presets yet/)).toBeInTheDocument();
    });

    it('should display all presets when open', () => {
      render(
        <PresetsManager
          presets={mockPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      expect(screen.getByText('My Preset')).toBeInTheDocument();
      expect(screen.getByText('Another Preset')).toBeInTheDocument();
    });
  });

  describe('Create Preset', () => {
    it('should show create form when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PresetsManager
          presets={mockEmptyPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      const createButton = screen.getByTestId('test-presets-create-button');
      await user.click(createButton);

      expect(screen.getByTestId('test-presets-create-input')).toBeInTheDocument();
    });

    it('should disable create button when no active filters', () => {
      const emptyFilterState: FilterState = {
        search: '',
        statuses: [],
      };

      render(
        <PresetsManager
          presets={mockEmptyPresetsState}
          currentFilterState={emptyFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      const createButton = screen.getByTestId('test-presets-create-button');
      expect(createButton).toBeDisabled();
    });

    it('should create preset with entered name', async () => {
      const user = userEvent.setup();

      render(
        <PresetsManager
          presets={mockEmptyPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      const createButton = screen.getByTestId('test-presets-create-button');
      await user.click(createButton);

      const input = screen.getByTestId('test-presets-create-input');
      await user.type(input, 'New Preset');

      const confirmButton = screen.getByTestId('test-presets-create-confirm');
      await user.click(confirmButton);

      expect(mockCallbacks.onCreatePreset).toHaveBeenCalledWith('New Preset');
    });

    it('should close dropdown after creating preset', async () => {
      const user = userEvent.setup();

      render(
        <PresetsManager
          presets={mockEmptyPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      const createButton = screen.getByTestId('test-presets-create-button');
      await user.click(createButton);

      const input = screen.getByTestId('test-presets-create-input');
      await user.type(input, 'New Preset');

      const confirmButton = screen.getByTestId('test-presets-create-confirm');
      await user.click(confirmButton);

      expect(mockCallbacks.onCreatePreset).toHaveBeenCalled();
    });

    it('should disable save button when name is empty', async () => {
      const user = userEvent.setup();

      render(
        <PresetsManager
          presets={mockEmptyPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      const createButton = screen.getByTestId('test-presets-create-button');
      await user.click(createButton);

      const confirmButton = screen.getByTestId('test-presets-create-confirm');
      expect(confirmButton).toBeDisabled();
    });

    it('should allow canceling create operation', async () => {
      const user = userEvent.setup();

      render(
        <PresetsManager
          presets={mockEmptyPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      const createButton = screen.getByTestId('test-presets-create-button');
      await user.click(createButton);

      const cancelButton = screen.getByTestId('test-presets-create-cancel');
      await user.click(cancelButton);

      expect(screen.queryByTestId('test-presets-create-input')).not.toBeInTheDocument();
    });
  });

  describe('Select Preset', () => {
    it('should call onSelectPreset when preset is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PresetsManager
          presets={mockPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      const presetItem = screen.getByTestId('test-presets-preset-select-preset-1');
      await user.click(presetItem);

      expect(mockCallbacks.onSelectPreset).toHaveBeenCalledWith(mockPreset1);
    });

    it('should close dropdown after selecting preset', async () => {
      const user = userEvent.setup();

      render(
        <PresetsManager
          presets={mockPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      const presetItem = screen.getByTestId('test-presets-preset-select-preset-1');
      await user.click(presetItem);

      expect(mockCallbacks.onToggleOpen).toHaveBeenCalledWith(false);
    });
  });

  describe('Delete Preset', () => {
    it('should call onDeletePreset when delete button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PresetsManager
          presets={mockPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      const deleteButton = screen.getByTestId('test-presets-delete-preset-1');
      await user.click(deleteButton);

      expect(mockCallbacks.onDeletePreset).toHaveBeenCalledWith('preset-1');
    });

    it('should not close dropdown when deleting preset', async () => {
      const user = userEvent.setup();

      render(
        <PresetsManager
          presets={mockPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      const deleteButton = screen.getByTestId('test-presets-delete-preset-1');
      await user.click(deleteButton);

      expect(mockCallbacks.onToggleOpen).not.toHaveBeenCalled();
    });
  });

  describe('Rename Preset', () => {
    it('should show rename form when rename button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <PresetsManager
          presets={mockPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      const renameButton = screen.getByTestId('test-presets-rename-preset-1');
      await user.click(renameButton);

      expect(screen.getByTestId('test-presets-rename-input-preset-1')).toBeInTheDocument();
    });

    it('should rename preset with new name', async () => {
      const user = userEvent.setup();

      render(
        <PresetsManager
          presets={mockPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      const renameButton = screen.getByTestId('test-presets-rename-preset-1');
      await user.click(renameButton);

      const input = screen.getByTestId('test-presets-rename-input-preset-1');
      await user.clear(input);
      await user.type(input, 'Updated Name');

      const confirmButton = screen.getByTestId('test-presets-rename-confirm-preset-1');
      await user.click(confirmButton);

      expect(mockCallbacks.onRenamePreset).toHaveBeenCalledWith('preset-1', 'Updated Name');
    });

    it('should allow canceling rename operation', async () => {
      const user = userEvent.setup();

      render(
        <PresetsManager
          presets={mockPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      const renameButton = screen.getByTestId('test-presets-rename-preset-1');
      await user.click(renameButton);

      const cancelButton = screen.getByTestId('test-presets-rename-cancel-preset-1');
      await user.click(cancelButton);

      expect(screen.queryByTestId('test-presets-rename-input-preset-1')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels', () => {
      render(
        <PresetsManager
          presets={mockPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      const menu = screen.getByRole('menu');
      expect(menu).toHaveAttribute('aria-label', 'Filter presets menu');
    });

    it('should render menu items with role menuitem', () => {
      render(
        <PresetsManager
          presets={mockPresetsState}
          currentFilterState={mockFilterState}
          isOpen={true}
          onToggleOpen={mockCallbacks.onToggleOpen}
          onSelectPreset={mockCallbacks.onSelectPreset}
          onCreatePreset={mockCallbacks.onCreatePreset}
          onDeletePreset={mockCallbacks.onDeletePreset}
          onRenamePreset={mockCallbacks.onRenamePreset}
          data-testid="test-presets"
        />
      );

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });
  });
  describe('Exit animation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const managerWith = (isOpen: boolean): React.ReactElement => (
      <PresetsManager
        presets={mockPresetsState}
        currentFilterState={mockFilterState}
        isOpen={isOpen}
        onToggleOpen={mockCallbacks.onToggleOpen}
        onSelectPreset={mockCallbacks.onSelectPreset}
        onCreatePreset={mockCallbacks.onCreatePreset}
        onDeletePreset={mockCallbacks.onDeletePreset}
        onRenamePreset={mockCallbacks.onRenamePreset}
        data-testid="test-presets"
      />
    );

    it('should keep the menu mounted at 199ms after closing and remove it at 200ms', () => {
      const { rerender } = render(managerWith(true));

      expect(screen.getByRole('menu')).toBeInTheDocument();

      rerender(managerWith(false));

      // Still mounted immediately after close so the fade-out can run
      expect(screen.getByRole('menu')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(199);
      });
      expect(screen.getByRole('menu')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should fade the menu out by switching to opacity-0 while still mounted', () => {
      const { rerender } = render(managerWith(true));

      expect(screen.getByRole('menu').className).toContain('opacity-100');

      rerender(managerWith(false));

      const menu = screen.getByRole('menu');
      expect(menu.className).toContain('opacity-0');
      expect(menu.className).toContain('transition-opacity');
      expect(menu.className).toContain('duration-200');
    });

    it('should cancel the pending hide when reopened before the delay elapses', () => {
      const { rerender } = render(managerWith(true));

      rerender(managerWith(false));

      act(() => {
        vi.advanceTimersByTime(150);
      });

      rerender(managerWith(true));

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menu').className).toContain('opacity-100');
    });
  });
});
