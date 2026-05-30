import type { GraphQLResolveInfo } from 'graphql';
import { wrapResolvers } from '../lib/field-span-wrapper';
import type { BuildParent, GraphQLContext } from '../types';

const buildFields = {
      async parts(
        parent: BuildParent,
        _args: unknown,
        context: GraphQLContext,
        _info: GraphQLResolveInfo
      ) {
        return context.buildPartLoader.load(parent.id);
      },

      async testRuns(
        parent: BuildParent,
        _args: unknown,
        context: GraphQLContext,
        _info: GraphQLResolveInfo
      ) {
        return context.buildTestRunLoader.load(parent.id);
      },
};

export const buildResolver = {
  Build: wrapResolvers(buildFields, 'Build') as typeof buildFields,
};
