import { ReactElement, ReactNode } from 'react';
import { MockedProvider, type MockedProviderProps } from '@apollo/client/testing/react';
import type { RenderResult, Queries } from '@testing-library/react';

/**
 * Test utility to wrap components with MockedProvider
 * Handles Apollo Client setup for component testing
 */
export function createApolloWrapper(
  mocks: MockedProviderProps['mocks'] = [],
): (props: { children: ReactNode }) => ReactElement {
  return function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <MockedProvider mocks={mocks}>
        {children}
      </MockedProvider>
    );
  };
}

/**
 * Test utility to render components with Apollo wrapper
 * Usage: const { getByText } = renderWithApollo(<Component />, mocks);
 * This function uses dynamic import internally since render comes from React Testing Library.
 */
export async function renderWithApollo(
  ui: ReactElement,
  mocks: MockedProviderProps['mocks'] = [],
): Promise<RenderResult<Queries, HTMLElement, HTMLElement>> {
  const { render } = await import('@testing-library/react');
  const wrapper = createApolloWrapper(mocks);
  return render(ui, { wrapper });
}
