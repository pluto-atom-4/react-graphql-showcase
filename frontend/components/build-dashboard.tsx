'use client';

import { useState, useMemo, useRef } from 'react';
import type { ReactElement } from 'react';
import { useBuilds, useCreateBuild } from '@/lib/apollo-hooks';
import BuildDetailModal from './build-detail-modal';
import { CreateBuildModal } from './create-build-modal';
import { TableSkeleton } from './SkeletonLoader/TableSkeleton';
import Pagination from './Pagination';
import { EmptyState } from './EmptyState';
import { StatusBadge } from './StatusBadge';
import { DashboardMetrics } from './DashboardMetrics';
import type { Build } from '@/lib/generated/graphql';
import { BuildStatus } from '@/lib/status-vocabulary';

interface BuildsTableProps {
  initialBuilds?: Build[];
}

/**
 * Inner component for builds table with SSR support
 *
 * Benefits from Issue #85 (Type Safety):
 * - Explicit Build[] type ensures no re-renders from type mismatches on hydration
 * - Cache-first strategy when initialBuilds provided prevents unnecessary queries
 */
function BuildsTable({ initialBuilds }: BuildsTableProps): ReactElement {
  const {
    builds: fetchedBuilds,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    setPageSize,
  } = useBuilds();
  const { createBuild } = useCreateBuild();
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Focus management: store focus when opening modal, restore when closing
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  
  const handleOpenModal = (buildId: string): void => {
    previousActiveElementRef.current = document.activeElement as HTMLElement;
    setSelectedBuildId(buildId);
  };
  
  const handleCloseModal = (): void => {
    setSelectedBuildId(null);
    // Restore focus to button that opened modal
    setTimeout(() => {
      previousActiveElementRef.current?.focus();
    }, 0);
  };

  // Prefer fresh client-fetched data over stale server-provided initial data.
  // This ensures mutations that call refetch() show new data immediately.
  // On initial page load, fetchedBuilds may be empty, so we fall back to initialBuilds.
  // Post-hydration, after any refetch(), fetchedBuilds has priority (fresh data).
  const builds = useMemo(() => {
    // If we have fetched data (from refetch or initial client fetch), prefer it
    // This ensures mutations that update the server immediately reflect in the UI
    if (fetchedBuilds && fetchedBuilds.length > 0) return fetchedBuilds;

    // Otherwise fall back to server-provided data only on initial load
    // before any client-side fetch happens
    return initialBuilds || [];
  }, [initialBuilds, fetchedBuilds]);

  // When initialBuilds are provided, we shouldn't show loading state
  // since data is already available from server
  const shouldShowLoading = !initialBuilds && loading;

  const handleCreateBuild = async (name: string): Promise<void> => {
    try {
      setIsCreating(true);
      await createBuild(name);
      // ✅ Don't call refetch()—Apollo cache already updated optimistically
      // ✅ Close modal after successful creation
      setIsCreateModalOpen(false);
    } catch (err) {
      const message = typeof err === 'string' ? err : String(err);
      console.error('Failed to create build:', message);
      // After #31 merges, replace with: showToast('error', message)
    } finally {
      setIsCreating(false);
    }
  };

  if (shouldShowLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <TableSkeleton rows={5} />
      </div>
    );
  }

  const errorMessage =
    error instanceof Error ? error.message : 'An unexpected error occurred';
  if (error && !initialBuilds) {
    return (
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <p className="text-red-600 px-4 py-4 bg-red-100 border border-red-400 rounded">Error: {errorMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Dashboard Metrics Section */}
      <DashboardMetrics />

      <div className="flex justify-between items-center mb-8">
        <h1 className="m-0 text-4xl text-gray-800">Build Dashboard</h1>
        <button
          onClick={() => {
            previousActiveElementRef.current = document.activeElement as HTMLElement;
            setIsCreateModalOpen(true);
          }}
          disabled={isCreating}
          data-testid="create-build-button"
          aria-label="Create new build"
          className="px-5 py-2.5 border-0 rounded bg-blue-600 text-white font-medium cursor-pointer transition-all duration-200 hover:bg-blue-800 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-offset-2"
        >
          {isCreating ? 'Creating...' : 'Create Build'}
        </button>
      </div>

      {builds.length === 0 ? (
        <EmptyState
          title="No builds yet"
          description="Create your first build to get started"
          ctaText="Create Build"
          onCTA={() => {
            previousActiveElementRef.current = document.activeElement as HTMLElement;
            setIsCreateModalOpen(true);
          }}
          className="border border-gray-200 rounded-lg bg-white shadow-md"
        />
      ) : (
        <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden" data-testid="builds-list">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-4 text-left font-semibold text-gray-700">Name</th>
              <th className="px-4 py-4 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-4 text-left font-semibold text-gray-700">Created</th>
              <th className="px-4 py-4 text-left font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {builds.map((build: Build) => {
              const statusClassName = `border-l-4 ${
                build.status.toLowerCase() === 'pending' ? 'border-l-yellow-400' :
                build.status.toLowerCase() === 'running' ? 'border-l-blue-400' :
                build.status.toLowerCase() === 'complete' ? 'border-l-green-400' :
                'border-l-red-400'
              }`;
              return (
                <tr
                  key={build.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-all duration-200 ease-in-out ${statusClassName}`}
                  style={{ minHeight: '56px' }}
                  data-testid={`build-${build.id}`}
                >
                  <td className="px-4 py-4 border-b border-gray-100" data-testid="build-name">{build.name}</td>
                  <td className="px-4 py-4 border-b border-gray-100">
                    <StatusBadge 
                      status={build.status ?? BuildStatus.Pending} 
                    />
                  </td>
                  <td className="px-4 py-4 border-b border-gray-100">{new Date(build.createdAt as string | number).toLocaleDateString()}</td>
                  <td className="px-4 py-4 border-b border-gray-100">
                    <button
                      onClick={(): void => handleOpenModal(build.id)}
                      aria-label={`View details for build ${build.name}`}
                      className="px-5 py-2.5 border-0 rounded bg-gray-600 text-white font-medium cursor-pointer transition-all duration-200 hover:bg-gray-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onNextPage={goToNextPage}
        onPreviousPage={goToPreviousPage}
        onPageSizeChange={setPageSize}
        isNextDisabled={!hasNextPage}
        isPrevDisabled={!hasPreviousPage}
      />

      {selectedBuildId && (
        <BuildDetailModal
          buildId={selectedBuildId}
          onClose={handleCloseModal}
        />
      )}

      <CreateBuildModal
        key={`modal-${isCreateModalOpen}`}
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          // Restore focus to button that opened modal
          setTimeout(() => {
            previousActiveElementRef.current?.focus();
          }, 0);
        }}
        onSubmit={handleCreateBuild}
        isLoading={isCreating}
      />
    </>
  );
}

interface BuildDashboardProps {
  initialBuilds?: Build[];
  serverError?: string | null;
}

/**
 * Root dashboard component with SSR support
 *
 * When called from async Server Component (page.tsx):
 * - initialBuilds prop contains server-fetched data
 * - No additional GraphQL query on hydration (cache-first strategy)
 * - Zero hydration re-renders due to type-safe Build[] type from Issue #85
 *
 * When called without props (fallback):
 * - BuildsTable fetches via useBuilds() hook
 * - Normal client-side rendering with loading states
 */
export default function BuildDashboard({
  initialBuilds,
  serverError,
}: BuildDashboardProps): ReactElement {
  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8">
      {serverError && (
        <div className="flex justify-between items-center gap-4 mb-4 px-4 py-4 bg-yellow-100 border border-yellow-400 rounded">
          <p>Server error loading builds: {serverError}. Attempting to load client-side...</p>
        </div>
      )}
      <BuildsTable initialBuilds={initialBuilds} />
    </div>
  );
}
