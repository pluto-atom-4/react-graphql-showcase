'use client';

import React, { useRef, useEffect, useState } from 'react';
import { FilterPreset, FilterPresetsState } from '../lib/hooks/useFilterPresets';
import { FilterState } from '../lib/hooks/useFilter';
import { useDelayedVisibility } from '../lib/hooks/useDelayedVisibility';
import { STATUS_LABELS } from '../lib/status-vocabulary';

/**
 * Props for PresetsManager component
 */
export interface PresetsManagerProps {
  /** Presets state containing items to display */
  presets: FilterPresetsState;
  /** Current filter state (for creating new preset) */
  currentFilterState: FilterState;
  /** Callback when a preset is selected/used */
  onSelectPreset: (preset: FilterPreset) => void;
  /** Callback to create a new preset */
  onCreatePreset: (name: string) => void;
  /** Callback to delete a preset */
  onDeletePreset: (id: string) => void;
  /** Callback to rename a preset */
  onRenamePreset: (id: string, newName: string) => void;
  /** Whether dropdown is open */
  isOpen: boolean;
  /** Callback to toggle dropdown open/close */
  onToggleOpen: (open: boolean) => void;
  /** Optional CSS class name */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Format timestamp to readable string
 *
 * @param timestamp Milliseconds since epoch
 * @returns Formatted date/time string
 */
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();

  // Same day: show time only
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  // This week: show day and time
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }

  // Older: show date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Summarize filter state for display
 *
 * @param state Filter state to summarize
 * @returns Human-readable summary
 */
const summarizeFilters = (state: FilterState): string => {
  const parts: string[] = [];

  if (state.search) {
    parts.push(`"${state.search}"`);
  }

  if (state.statuses && state.statuses.length > 0) {
    // Display labels, not wire values: this string is read by a human.
    parts.push(`Status: ${state.statuses.map((s) => STATUS_LABELS[s]).join(', ')}`);
  }

  if (state.dateStart || state.dateEnd) {
    const dateStr = `${state.dateStart || '?'} to ${state.dateEnd || '?'}`;
    parts.push(`Dates: ${dateStr}`);
  }

  return parts.length > 0 ? parts.join(' • ') : 'No filters';
};

/**
 * PresetsManager Component - Create and manage filter presets
 *
 * Features:
 * - Display saved filter presets (up to 10)
 * - Click to apply a preset to current filters
 * - Create new presets from current filter state
 * - Rename existing presets
 * - Delete individual presets
 * - Shows creation date and last used time
 * - Click-outside handling to close dropdown
 * - Keyboard support (Escape to close)
 * - Responsive dropdown positioning
 * - Accessible with aria-labels
 * - Shows current filter state summary for creating new preset
 *
 * @example
 * <PresetsManager
 *   presets={presetsState}
 *   currentFilterState={filterState}
 *   onSelectPreset={handleSelectPreset}
 *   onCreatePreset={handleCreatePreset}
 *   onDeletePreset={handleDeletePreset}
 *   onRenamePreset={handleRenamePreset}
 *   isOpen={isOpen}
 *   onToggleOpen={setIsOpen}
 * />
 */
export const PresetsManager: React.FC<PresetsManagerProps> = ({
  presets,
  currentFilterState,
  onSelectPreset,
  onCreatePreset,
  onDeletePreset,
  onRenamePreset,
  isOpen,
  onToggleOpen,
  className = '',
  'data-testid': dataTestId = 'presets-manager',
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Keeps the menu mounted for the 200ms exit fade (see useDelayedVisibility)
  const isVisible = useDelayedVisibility(isOpen);
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggleOpen(false);
        setIsCreating(false);
        setEditingId(null);
      }
    };

    // Handle Escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onToggleOpen(false);
        setIsCreating(false);
        setEditingId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onToggleOpen]);

  const handleCreatePreset = () => {
    const name = newPresetName.trim();
    if (name.length === 0) {
      console.warn('[PresetsManager] Preset name cannot be empty');
      return;
    }

    onCreatePreset(name);
    setNewPresetName('');
    setIsCreating(false);
  };

  const handleSaveRename = (id: string) => {
    const name = editingName.trim();
    if (name.length === 0) {
      console.warn('[PresetsManager] Preset name cannot be empty');
      return;
    }

    onRenamePreset(id, name);
    setEditingId(null);
    setEditingName('');
  };

  const hasPresets = presets.presets.length > 0;
  const hasActiveFilters =
    currentFilterState.search ||
    currentFilterState.statuses.length > 0 ||
    currentFilterState.dateStart ||
    currentFilterState.dateEnd;

  return (
    <div
      ref={dropdownRef}
      className={`relative ${className}`}
      data-testid={dataTestId}
    >
      {/* Dropdown Menu */}
      {isVisible && (
        <div
          className={`
            absolute top-full left-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg
            shadow-lg z-50 max-h-96 overflow-y-auto
            transition-opacity duration-200
            ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          role="menu"
          aria-label="Filter presets menu"
          data-testid={`${dataTestId}-menu`}
        >
          {/* Create New Preset Section */}
          <div className="border-b border-gray-200 p-3 bg-blue-50">
            {!isCreating ? (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                disabled={!hasActiveFilters}
                className={`
                  w-full px-3 py-2 text-sm font-medium rounded-md
                  transition-colors
                  ${
                    hasActiveFilters
                      ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                `}
                aria-label="Save current filters as preset"
                data-testid={`${dataTestId}-create-button`}
              >
                <svg
                  className="w-4 h-4 inline mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Save as Preset
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Preset name..."
                  maxLength={50}
                  className={`
                    flex-1 px-2 py-1 text-sm border border-gray-300 rounded
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  `}
                  autoFocus
                  data-testid={`${dataTestId}-create-input`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreatePreset();
                    } else if (e.key === 'Escape') {
                      setIsCreating(false);
                      setNewPresetName('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreatePreset}
                  className={`
                    px-2 py-1 text-sm font-medium bg-green-600 text-white rounded
                    hover:bg-green-700 active:bg-green-800
                    focus:outline-none focus:ring-2 focus:ring-green-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  disabled={newPresetName.trim().length === 0}
                  aria-label="Confirm preset name"
                  data-testid={`${dataTestId}-create-confirm`}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setNewPresetName('');
                  }}
                  className={`
                    px-2 py-1 text-sm font-medium bg-gray-400 text-white rounded
                    hover:bg-gray-500 active:bg-gray-600
                    focus:outline-none focus:ring-2 focus:ring-gray-400
                  `}
                  aria-label="Cancel preset creation"
                  data-testid={`${dataTestId}-create-cancel`}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Presets List */}
          {!hasPresets ? (
            <div
              className="p-4 text-center text-gray-500 text-sm"
              data-testid={`${dataTestId}-empty`}
            >
              No presets yet. Save your first preset above.
            </div>
          ) : (
            <div className="border-b border-gray-200">
              {presets.presets.map((preset, index) => (
                <div
                  key={preset.id}
                  className={`
                    px-4 py-3 transition-colors
                    ${index > 0 ? 'border-t border-gray-100' : ''}
                  `}
                  data-testid={`${dataTestId}-item-${preset.id}`}
                >
                  {/* Editing Mode */}
                  {editingId === preset.id ? (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        maxLength={50}
                        className={`
                          flex-1 px-2 py-1 text-sm border border-gray-300 rounded
                          focus:outline-none focus:ring-2 focus:ring-blue-500
                        `}
                        autoFocus
                        data-testid={`${dataTestId}-rename-input-${preset.id}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveRename(preset.id);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditingName('');
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(preset.id)}
                        className={`
                          px-2 py-1 text-xs font-medium bg-green-600 text-white rounded
                          hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                        `}
                        aria-label="Confirm rename"
                        data-testid={`${dataTestId}-rename-confirm-${preset.id}`}
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName('');
                        }}
                        className={`
                          px-2 py-1 text-xs font-medium bg-gray-400 text-white rounded
                          hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400
                        `}
                        aria-label="Cancel rename"
                        data-testid={`${dataTestId}-rename-cancel-${preset.id}`}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Preset Name and Summary */}
                      <div
                        className={`
                          px-3 py-2 cursor-pointer transition-colors rounded mb-2
                          hover:bg-blue-50 active:bg-blue-100
                        `}
                        role="menuitem"
                        tabIndex={0}
                        onClick={() => {
                          onSelectPreset(preset);
                          onToggleOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            onSelectPreset(preset);
                            onToggleOpen(false);
                          }
                        }}
                        data-testid={`${dataTestId}-preset-select-${preset.id}`}
                      >
                        <div className="font-medium text-gray-900 text-sm">
                          {preset.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {summarizeFilters(preset.state)}
                        </div>
                      </div>

                      {/* Timestamps and Actions */}
                      <div className="flex justify-between items-center text-xs text-gray-500 px-3 py-1 gap-2">
                        <div>
                          Created: {formatTime(preset.createdAt)}
                          {preset.lastUsed && (
                            <>
                              <br />
                              Used: {formatTime(preset.lastUsed)}
                            </>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(preset.id);
                              setEditingName(preset.name);
                            }}
                            className={`
                              text-gray-400 hover:text-blue-600 transition-colors
                              focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1
                            `}
                            aria-label={`Rename preset ${preset.name}`}
                            data-testid={`${dataTestId}-rename-${preset.id}`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePreset(preset.id);
                            }}
                            className={`
                              text-gray-400 hover:text-red-600 transition-colors
                              focus:outline-none focus:ring-1 focus:ring-red-500 rounded px-1
                            `}
                            aria-label={`Delete preset ${preset.name}`}
                            data-testid={`${dataTestId}-delete-${preset.id}`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Clear All Button (only if has presets) */}
          {hasPresets && (
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  // Note: This should be handled by parent if needed
                  // For now, we'll clear all via delete actions
                  onToggleOpen(false);
                }}
                className={`
                  w-full px-3 py-2 text-sm font-medium text-red-600 bg-white
                  border border-red-300 rounded-md
                  hover:bg-red-50 active:bg-red-100
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  transition-colors
                `}
                aria-label="Close presets menu"
                data-testid={`${dataTestId}-close`}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

PresetsManager.displayName = 'PresetsManager';

export default PresetsManager;
