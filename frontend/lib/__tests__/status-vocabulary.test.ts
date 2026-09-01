import { describe, it, expect } from 'vitest';
import {
  BuildStatus,
  STATUS_ORDER,
  AVAILABLE_STATUSES,
  STATUS_LABELS,
  isBuildStatus,
  sanitizeStatuses,
} from '../status-vocabulary';
import { BuildStatus as GeneratedBuildStatus } from '../generated/graphql';

describe('status-vocabulary', () => {
  describe('BuildStatus re-export', () => {
    it('re-exports the generated enum rather than a hand-maintained copy', () => {
      expect(BuildStatus).toBe(GeneratedBuildStatus);
    });

    it('exposes the schema wire values', () => {
      expect(BuildStatus.Pending).toBe('PENDING');
      expect(BuildStatus.Running).toBe('RUNNING');
      expect(BuildStatus.Complete).toBe('COMPLETE');
      expect(BuildStatus.Failed).toBe('FAILED');
    });
  });

  describe('STATUS_ORDER', () => {
    it('is the lifecycle order pending -> running -> complete -> failed', () => {
      expect(STATUS_ORDER).toEqual(['PENDING', 'RUNNING', 'COMPLETE', 'FAILED']);
    });

    it('covers every member of the generated enum', () => {
      expect([...STATUS_ORDER].sort()).toEqual(Object.values(GeneratedBuildStatus).sort());
    });

    it('contains no duplicates', () => {
      expect(new Set(STATUS_ORDER).size).toBe(STATUS_ORDER.length);
    });

    it('is not alphabetical, so it cannot be Object.values(BuildStatus)', () => {
      const alphabetical = [...STATUS_ORDER].sort();
      expect(STATUS_ORDER).not.toEqual(alphabetical);
      expect(alphabetical).toEqual(['COMPLETE', 'FAILED', 'PENDING', 'RUNNING']);
    });

    it('does not contain the retired pre-#347 vocabulary', () => {
      const retired: string[] = ['Active', 'Idle', 'Completed', 'Failed'];
      for (const value of retired) {
        expect(STATUS_ORDER as readonly string[]).not.toContain(value);
      }
    });
  });

  describe('AVAILABLE_STATUSES', () => {
    it('is STATUS_ORDER, so filter pills follow lifecycle order', () => {
      expect(AVAILABLE_STATUSES).toBe(STATUS_ORDER);
    });
  });

  describe('STATUS_LABELS', () => {
    it('maps each wire value to its display label', () => {
      expect(STATUS_LABELS).toEqual({
        PENDING: 'Pending',
        RUNNING: 'Running',
        COMPLETE: 'Complete',
        FAILED: 'Failed',
      });
    });

    it('has a label for every status in STATUS_ORDER', () => {
      for (const status of STATUS_ORDER) {
        expect(STATUS_LABELS[status]).toBeTypeOf('string');
        expect(STATUS_LABELS[status].length).toBeGreaterThan(0);
      }
    });

    it('has distinct labels, so a label maps back to exactly one wire value', () => {
      const labels = Object.values(STATUS_LABELS);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it('drops the Active/Idle copy that never matched a wire value', () => {
      const labels = Object.values(STATUS_LABELS);
      expect(labels).not.toContain('Active');
      expect(labels).not.toContain('Idle');
    });
  });

  describe('isBuildStatus', () => {
    it('accepts every wire value', () => {
      expect(isBuildStatus('PENDING')).toBe(true);
      expect(isBuildStatus('RUNNING')).toBe(true);
      expect(isBuildStatus('COMPLETE')).toBe(true);
      expect(isBuildStatus('FAILED')).toBe(true);
    });

    it('rejects the retired pre-#347 vocabulary', () => {
      expect(isBuildStatus('Active')).toBe(false);
      expect(isBuildStatus('Idle')).toBe(false);
      expect(isBuildStatus('Completed')).toBe(false);
    });

    it('rejects display labels, which are copy rather than wire values', () => {
      expect(isBuildStatus('Pending')).toBe(false);
      expect(isBuildStatus('Running')).toBe(false);
    });

    it('is case-sensitive', () => {
      expect(isBuildStatus('failed')).toBe(false);
      expect(isBuildStatus('Failed')).toBe(false);
    });

    it('rejects non-string values', () => {
      expect(isBuildStatus(null)).toBe(false);
      expect(isBuildStatus(undefined)).toBe(false);
      expect(isBuildStatus(0)).toBe(false);
      expect(isBuildStatus('')).toBe(false);
      expect(isBuildStatus(['FAILED'])).toBe(false);
      expect(isBuildStatus({ status: 'FAILED' })).toBe(false);
    });
  });

  describe('sanitizeStatuses', () => {
    it('drops unknown statuses and keeps the recognised ones', () => {
      expect(sanitizeStatuses(['Active', 'FAILED'])).toEqual(['FAILED']);
    });

    it('preserves the original order of the surviving statuses', () => {
      expect(sanitizeStatuses(['RUNNING', 'Idle', 'PENDING'])).toEqual(['RUNNING', 'PENDING']);
    });

    it('returns an empty array when nothing is recognised', () => {
      expect(sanitizeStatuses(['Active', 'Idle', 'Completed'])).toEqual([]);
    });

    it('returns an empty array for non-array input', () => {
      expect(sanitizeStatuses('FAILED')).toEqual([]);
      expect(sanitizeStatuses(undefined)).toEqual([]);
      expect(sanitizeStatuses(null)).toEqual([]);
      expect(sanitizeStatuses({ 0: 'FAILED' })).toEqual([]);
    });

    it('keeps duplicates, leaving de-duplication to the reducer', () => {
      expect(sanitizeStatuses(['FAILED', 'FAILED'])).toEqual(['FAILED', 'FAILED']);
    });
  });
});
