'use client';

import type { ReactElement } from 'react';
import { notFound } from 'next/navigation';
import { SearchProvider, useSearchContext } from '@/lib/SearchContext';
import { FilterBar } from '@/components/FilterBar';

/**
 * TEMPORARY: Demo page for search/filter functionality.
 *
 * This page showcases the SearchProvider and FilterBar integration.
 * It is gated to dev environments only and should be deleted once
 * #265 Phase 2 wires FilterBar into BuildDashboard for real.
 *
 * To test persistence:
 * 1. Type in the search box
 * 2. Select statuses and date ranges
 * 3. Watch chips appear below the search bar
 * 4. Reload the page (F5)
 * 5. Verify that all filters are restored from localStorage
 *
 * Note: status pills show display labels (Pending / Running / Complete /
 * Failed) while the state dump below shows the GraphQL wire values
 * (PENDING / RUNNING / COMPLETE / FAILED). Both come from
 * lib/status-vocabulary.ts; see #347.
 */

function FilterDemoContent(): ReactElement {
  const { state, dispatch } = useSearchContext();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Search & Filter Demo</h1>
      <p className="text-gray-600 mb-6">
        Type in the search box, select filters, and reload to test persistence.
      </p>

      <FilterBar
        filters={state}
        onFilterChange={dispatch}
        searchPlaceholder="Search builds, parts, test runs..."
        contextName="demo"
      />

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="font-bold mb-2">Current Filter State:</h2>
        <p className="text-xs text-gray-600 mb-2">
          Statuses are shown as GraphQL wire values; the pills above show their
          display labels.
        </p>
        <pre className="text-sm overflow-auto max-h-64">
          {JSON.stringify(state, null, 2)}
        </pre>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-900">
        <p>
          <strong>localStorage key:</strong> search-filter:demo
        </p>
        <p className="mt-2">
          Changes persist automatically (500ms debounce).
        </p>
      </div>
    </div>
  );
}

export default function FilterDemoPage(): ReactElement {
  // Gate: only show in dev/preview, not in production
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <SearchProvider contextName="demo">
      <FilterDemoContent />
    </SearchProvider>
  );
}
