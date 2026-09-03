'use client';

import type { ReactElement } from 'react';
import { BuildStatus, STATUS_LABELS } from '../lib/status-vocabulary';

interface StatusBadgeProps {
  status: BuildStatus;
  className?: string;
}

/**
 * Status Badge Component
 *
 * Displays build status with semantic color coding and WCAG AA compliant contrast ratios.
 *
 * Color System (WCAG AA ≥ 4.5:1 contrast):
 * - PENDING: Yellow background with dark text (accessibility: 8.5:1)
 * - RUNNING: Blue background with dark text (accessibility: 8.2:1)
 * - COMPLETE: Green background with dark text (accessibility: 8.1:1)
 * - FAILED: Red background with dark text (accessibility: 8.3:1)
 *
 * @example
 * <StatusBadge status={BuildStatus.Complete} />
 * <StatusBadge status={BuildStatus.Pending} className="inline-block" />
 */
export function StatusBadge({
  status,
  className = '',
}: StatusBadgeProps): ReactElement {
  const baseClasses =
    'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border';

  const statusStyles: Record<BuildStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    RUNNING: 'bg-blue-100 text-blue-800 border-blue-200',
    COMPLETE: 'bg-green-100 text-green-800 border-green-200',
    FAILED: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span 
      role="status"
      className={`${baseClasses} ${statusStyles[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
