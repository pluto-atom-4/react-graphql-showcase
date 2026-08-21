import { describe, it, expect } from 'vitest';
import {
  applyFilters,
  createFilterComposer,
  hasActiveFilters,
  countActiveFilters,
  Filterable,
} from '../filterComposers';
import { FilterState } from '../../hooks/useFilter';

describe('Filter Composers', () => {
  // Mock build items for testing
  const mockBuilds: Filterable[] = [
    {
      id: '1',
      name: 'Build A',
      title: 'Important Build',
      status: 'Active',
      createdAt: '2026-01-15',
    },
    {
      id: '2',
      name: 'Build B',
      title: 'Regular Build',
      status: 'Idle',
      createdAt: '2026-06-01',
    },
    {
      id: '3',
      name: 'Build C',
      title: 'Failed Build',
      status: 'Failed',
      createdAt: '2026-03-10',
    },
    {
      id: '4',
      name: 'Build D',
      title: 'Completed Build',
      status: 'Completed',
      createdAt: '2026-12-20',
    },
  ];

  describe('applyFilters - Search Only', () => {
    it('should return all items when search is empty', () => {
      const filters: FilterState = { search: '', statuses: [] };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(4);
    });

    it('should filter by search term in name field', () => {
      const filters: FilterState = { search: 'Build A', statuses: [] };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter by search term in title field', () => {
      const filters: FilterState = { search: 'Important', statuses: [] };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should be case-insensitive', () => {
      const filters: FilterState = { search: 'important', statuses: [] };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(1);
    });

    it('should match partial search terms', () => {
      const filters: FilterState = { search: 'Build', statuses: [] };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(4);
    });
  });

  describe('applyFilters - Status Only', () => {
    it('should return all items when no statuses selected', () => {
      const filters: FilterState = { search: '', statuses: [] };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(4);
    });

    it('should filter by single status', () => {
      const filters: FilterState = { search: '', statuses: ['Active'] };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Active');
    });

    it('should filter by multiple statuses (OR within status, AND with other filters)', () => {
      const filters: FilterState = { search: '', statuses: ['Active', 'Idle'] };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(2);
      expect(result.map((b) => b.status)).toEqual(expect.arrayContaining(['Active', 'Idle']));
    });
  });

  describe('applyFilters - Date Range Only', () => {
    it('should return all items when no dates specified', () => {
      const filters: FilterState = { search: '', statuses: [] };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(4);
    });

    it('should filter by start date only', () => {
      const filters: FilterState = { search: '', statuses: [], dateStart: '2026-06-01' };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(2); // Builds 2 (2026-06-01) and 4 (2026-12-20)
    });

    it('should filter by end date only', () => {
      const filters: FilterState = { search: '', statuses: [], dateEnd: '2026-06-01' };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(3); // Builds 1 (2026-01-15), 2 (2026-06-01), and 3 (2026-03-10)
    });

    it('should filter by date range', () => {
      const filters: FilterState = {
        search: '',
        statuses: [],
        dateStart: '2026-03-01',
        dateEnd: '2026-09-01',
      };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(2); // Builds 2 and 3
    });
  });

  describe('applyFilters - AND Logic (Combined Filters)', () => {
    it('should apply search AND status filters', () => {
      const filters: FilterState = {
        search: 'Build',
        statuses: ['Active', 'Idle'],
      };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(2);
    });

    it('should apply search AND date filters', () => {
      const filters: FilterState = {
        search: 'Build B',
        statuses: [],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should apply status AND date filters', () => {
      const filters: FilterState = {
        search: '',
        statuses: ['Active', 'Idle'],
        dateStart: '2026-06-01',
      };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should apply all filters together (search AND status AND date)', () => {
      const filters: FilterState = {
        search: 'Build',
        statuses: ['Active', 'Idle', 'Failed'],
        dateStart: '2026-01-01',
        dateEnd: '2026-06-30',
      };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(3);
      expect(result.map((b) => b.id)).toEqual(expect.arrayContaining(['1', '2', '3']));
    });

    it('should return empty when filters match nothing', () => {
      const filters: FilterState = {
        search: 'NonExistent',
        statuses: ['Active'],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      const result = applyFilters(mockBuilds, filters);
      expect(result).toHaveLength(0);
    });
  });

  describe('createFilterComposer', () => {
    it('should return a function that filters items', () => {
      const filters: FilterState = { search: 'Build A', statuses: [] };
      const composer = createFilterComposer(filters);
      const result = composer(mockBuilds);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should compose with all filter types', () => {
      const filters: FilterState = {
        search: 'Build',
        statuses: ['Active', 'Idle'],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      const composer = createFilterComposer(filters);
      const result = composer(mockBuilds);
      expect(result).toHaveLength(2);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when all filters are empty', () => {
      const filters: FilterState = { search: '', statuses: [] };
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when search is not empty', () => {
      const filters: FilterState = { search: 'query', statuses: [] };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when statuses are selected', () => {
      const filters: FilterState = { search: '', statuses: ['Active'] };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when start date is set', () => {
      const filters: FilterState = { search: '', statuses: [], dateStart: '2026-01-01' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when end date is set', () => {
      const filters: FilterState = { search: '', statuses: [], dateEnd: '2026-12-31' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when any filter is active', () => {
      const filters: FilterState = {
        search: 'test',
        statuses: ['Active'],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      expect(hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('countActiveFilters', () => {
    it('should return 0 when all filters are empty', () => {
      const filters: FilterState = { search: '', statuses: [] };
      expect(countActiveFilters(filters)).toBe(0);
    });

    it('should count search as 1 filter', () => {
      const filters: FilterState = { search: 'query', statuses: [] };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count each status as 1 filter', () => {
      const filters: FilterState = { search: '', statuses: ['Active', 'Idle'] };
      expect(countActiveFilters(filters)).toBe(2);
    });

    it('should count start date as 1 filter', () => {
      const filters: FilterState = { search: '', statuses: [], dateStart: '2026-01-01' };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count end date as 1 filter', () => {
      const filters: FilterState = { search: '', statuses: [], dateEnd: '2026-12-31' };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count all filters together', () => {
      const filters: FilterState = {
        search: 'test',
        statuses: ['Active', 'Idle'],
        dateStart: '2026-01-01',
        dateEnd: '2026-12-31',
      };
      expect(countActiveFilters(filters)).toBe(5); // 1 + 2 + 1 + 1
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty item array', () => {
      const filters: FilterState = { search: 'test', statuses: ['Active'] };
      const result = applyFilters([], filters);
      expect(result).toHaveLength(0);
    });

    it('should handle items without all fields', () => {
      const partialItems: Filterable[] = [
        { id: '1', name: 'Item' },
        { id: '2', title: 'Another Item' },
        { id: '3' }, // Only ID
      ];
      const filters: FilterState = { search: 'Item', statuses: [] };
      const result = applyFilters(partialItems, filters);
      expect(result).toHaveLength(2);
    });

    it('should handle items with null/undefined values', () => {
      const itemsWithNull: Filterable[] = [
        { id: '1', name: null as unknown as string, status: 'Active', createdAt: '2026-01-01' },
        { id: '2', name: undefined as unknown as string, status: 'Idle', createdAt: '2026-01-01' },
      ];
      const filters: FilterState = { search: '', statuses: ['Active', 'Idle'] };
      const result = applyFilters(itemsWithNull, filters);
      expect(result).toHaveLength(2);
    });
  });
});
