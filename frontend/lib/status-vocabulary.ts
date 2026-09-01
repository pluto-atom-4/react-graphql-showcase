/**
 * Canonical build-status vocabulary for the client.
 *
 * This module is the single source of truth for:
 * - which status values exist (the generated GraphQL `BuildStatus` enum),
 * - the order they are presented in (`STATUS_ORDER`),
 * - how they are shown to a human (`STATUS_LABELS`),
 * - how an untrusted value is narrowed to a status (`isBuildStatus`).
 *
 * Rules:
 * - Wire values (`'PENDING'`, `'RUNNING'`, ...) are identifiers. They come from
 *   the GraphQL schema and are what gets compared, persisted and used to build
 *   `data-testid` attributes.
 * - Display labels are copy. They live in `STATUS_LABELS` and nowhere else.
 *   Changing a label must never change a wire value or a test id.
 *
 * Do not re-declare the status union anywhere else — import from here.
 * See `.claude/patterns/search-filter-patterns.md` ("Single source of truth for status").
 */

import { BuildStatus } from './generated/graphql';

export { BuildStatus };

/**
 * Compile-time exhaustiveness guard for `STATUS_ORDER`.
 *
 * Resolves to `T` when `T` covers every member of `BuildStatus`, otherwise to a
 * marker tuple that `STATUS_ORDER`'s initializer cannot be assigned to. Adding a
 * member to the generated enum without ordering it here is therefore a `tsc`
 * error rather than a silently missing filter pill.
 */
type ExhaustiveStatusOrder<T extends readonly BuildStatus[]> = [
  Exclude<BuildStatus, T[number]>,
] extends [never]
  ? T
  : ['STATUS_ORDER is missing BuildStatus member(s):', Exclude<BuildStatus, T[number]>];

const statusOrder = [
  BuildStatus.Pending,
  BuildStatus.Running,
  BuildStatus.Complete,
  BuildStatus.Failed,
] as const;

/**
 * Every build status in lifecycle order: pending -> running -> terminal.
 *
 * Deliberately an explicit tuple rather than `Object.values(BuildStatus)`, which
 * is alphabetical (`COMPLETE, FAILED, PENDING, RUNNING`) and would reorder the
 * UI on any codegen run.
 */
export const STATUS_ORDER: ExhaustiveStatusOrder<typeof statusOrder> = statusOrder;

/**
 * Statuses offered by the multi-select status filter.
 *
 * Aliases `STATUS_ORDER`: everything the schema knows about is selectable.
 */
export const AVAILABLE_STATUSES = STATUS_ORDER;

/**
 * Human-readable label for each status.
 *
 * Typed as a total `Record`, so a new enum member is a `tsc` error here too.
 */
export const STATUS_LABELS: Record<BuildStatus, string> = {
  [BuildStatus.Pending]: 'Pending',
  [BuildStatus.Running]: 'Running',
  [BuildStatus.Complete]: 'Complete',
  [BuildStatus.Failed]: 'Failed',
};

const STATUS_VALUES: ReadonlySet<string> = new Set<string>(STATUS_ORDER);

/**
 * Type guard narrowing an untrusted value (parsed JSON, URL param, API payload)
 * to a `BuildStatus`.
 *
 * @param value Value of unknown origin
 * @returns true if `value` is one of the generated enum's wire values
 *
 * @example
 * const raw: unknown = JSON.parse(stored).status;
 * if (isBuildStatus(raw)) {
 *   // raw is BuildStatus here
 * }
 */
export const isBuildStatus = (value: unknown): value is BuildStatus =>
  typeof value === 'string' && STATUS_VALUES.has(value);

/**
 * Keep only the recognised statuses in an untrusted list.
 *
 * Used when rehydrating persisted filter state: a value written by an older
 * build (or hand-edited in devtools) is dropped rather than causing the whole
 * saved state to be discarded.
 *
 * @param value Value of unknown origin, expected to be an array of statuses
 * @returns The subset of `value` that are valid statuses, in the original order
 *
 * @example
 * sanitizeStatuses(['Active', 'FAILED']); // ['FAILED']
 * sanitizeStatuses('nonsense');           // []
 */
export const sanitizeStatuses = (value: unknown): BuildStatus[] =>
  Array.isArray(value) ? value.filter(isBuildStatus) : [];
