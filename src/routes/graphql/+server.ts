import { createYoga, createSchema } from 'graphql-yoga';
import { useGraphQlJit } from '@envelop/graphql-jit';

import type { RequestEvent } from '@sveltejs/kit';

import { users } from '$lib/data';

import schema from '$lib/schema.gql';

// modify the resolver to allow users to accept the first and after for pagination
const yogaApp = createYoga<RequestEvent>({
	schema: createSchema({
		typeDefs: schema,
		resolvers: {
			Query: {
				users: (source, args, context, info) => {
					// define first and after as valid arguments for users
					const { first, after } = args
					if (after >= users.length) {
						return console.error(err)
					} else if (first > users.length - after) {
						return users.slice(after, users.length)
					}
					return users.slice(after, after + first)
				}
			}
		}
	}),
	plugins: [useGraphQlJit()],
	fetchAPI: globalThis
});

export { yogaApp as GET, yogaApp as POST };
