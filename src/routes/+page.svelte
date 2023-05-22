<script lang="ts">
import { cacheExchange, createClient, fetchExchange, gql, queryStore } from '@urql/svelte';
import Loader from 'components/Loader.svelte';
import User from 'components/User.svelte';
const Users = ('components/User.svelte');
import { users } from 'lib/data';
import type { UserType } from 'lib/types';
import { onMount } from 'svelte';
import { paginationConfig } from 'lib/paginationConfig'

const client = createClient({
	url: '/graphql',
	exchanges: [cacheExchange, fetchExchange]
});

// declare the initially loaded users and users per request from the paginationConfig file
const { usersPerRequest } = paginationConfig;

const query = gql`
	query Users($first: Int!, $after: Int!){
		users(first: $first, after: $after) {
			id
			name
			avatar
			email
		}
	}
`;

  // add variables property to assign the first argument to the number of users to load
  const result = queryStore<{ users: UserType[] }>({
    client,
    query,
    variables: {
      first: usersPerRequest,
      after: 0
    }
  });
	
	// declare a variable to track scroll
	let scroll: number;

	// declare a variable that keeps track if there is more data that can be queried
	let moreUsersAvailable: boolean = true;

	// declare a reactive array that will hold users returned from queries
	$: queriedUsers = [];
	
  // declare variable to track current load instance; this will help with subsequent data queries to only query the next set of data
  let currentLoad: number = 1;

	// declare a variable that defines the number of users to be queried
	const limit: number  = usersPerRequest;
	// declare a variable to find the starting index of users that need to be queried on the current request
  let startAt = (currentLoad - 1) * usersPerRequest;

  // declare an async function to get more users
  async function getMoreUsers() {
    try {
      // don't load if already loading
      if ($result.fetching) return;

			// increment the current load
			currentLoad++;

			// update the value of startAt because the value of currentLoad has updated
			startAt = (currentLoad - 1) * limit;
			console.log(currentLoad, 'th load incoming');

      // await the response
      const res = await client.query(query, {
        first: limit,
        after: startAt
      });

			// grab the users from the response data
      const { data } = res;
			
      console.log('response from db:', res);
      console.log('user list:', data);

      if (data && data.users) {
				// push the response user data into the queryStore's list of users
        $result.data.users.push(...data.users);
        console.log('promise completed, pushed user list:', $result.data.users);
				queriedUsers.push(...data.users)
      } else {
				moreUsersAvailable = false;
			}
    }
    catch(err) {
      console.error(err);
    }
  }

	// removed ascync from the scrollHandler function, may want to put back later
  // mount the event listener
  onMount(() => {
		// declare a scroll handler function
    const scrollHandler = () => {
      let scrollPosition = window.innerHeight + window.pageYOffset;
      let pageBottom = document.body.offsetHeight;

      if ((scrollPosition >= pageBottom) && !$result.fetching) {
        console.log('reached the bottom');
        getMoreUsers();
      }
    };

		// attach the scroll handler to a window event listener
    window.addEventListener('scroll', async () => {
      scrollHandler();
    });
		console.log('scroll-handler mounted');

    return () => {
      window.removeEventListener('scroll', () => scrollHandler());
    };
  });

	// reactive declaration 
	$: {
		if ($result.data && $result.data.users) {
			$result.data.users;
		}
		if (queriedUsers.length) {
			queriedUsers
		}
	}
</script>

<style lang="postcss">
  .grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .grid-item {
    @apply flex-auto;
    @apply w-1/2;
    @apply p-4;
  }

	.loader {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 8px;
  }
</style>

<!-- bind the scroll variable to scrollY with a svelte:window element -->
<svelte:window bind:scrollY={scroll} />
{scroll}

<div class="w-full h-full overflow-scroll">
  <div class="grid p-4">
    <!-- {console.log('current query store:', $result)} -->
    {#if $result.data && $result.data.users}
		<!-- {console.log('current user list:', $result.data.users)} -->
      {#each $result.data.users as user (user.id)}
				<div class="grid-item">
					<User {user} />
				</div>
      {/each}
			<!-- {:else if $result.fetching && moreUsersAvailable}
      <Loader /> -->
    {/if}
		<div class="loader">
			{#if $result.fetching && moreUsersAvailable}
			<Loader />
			{/if}
		</div>
  </div>
</div>



<!-- <script lang="ts">
	import { cacheExchange, createClient, fetchExchange, gql, queryStore } from '@urql/svelte';
	import Loader from 'components/Loader.svelte';
	import User from 'components/User.svelte';
	import type { UserType } from 'lib/types';
	import { onMount } from 'svelte';
	import { paginationConfig } from 'lib/paginationConfig'

	const client = createClient({
		url: '/graphql',
		exchanges: [cacheExchange, fetchExchange]
	});

	// declare the initially loaded users and users per request from the paginationConfig file
	const { initiallyLoad, usersPerRequest } = paginationConfig;

	let containerRef: HTMLElement;

	// declare variable to track if there's an active query
	let isLoading = false;
	// declare variable to track the current loading instance
	let currentLoad = 1;

	// declare a function that will load more users
	function loadMoreUsers () {
		// condition for if the loading state is falsey
		if (!isLoading) {
			isLoading = true;
			currentLoad++;

			const after = (currentLoad - 1) * usersPerRequest;

			client
				.query(
					gql`
						query Users($first: Int!, $after: Int!){
							users(first: $first, after: $after) {
								id
								name
								avatar
								email
							}
						}
					`,
					{
						first: usersPerRequest,
						after: after
					}
				)
				.toPromise()
				.then((res) => {
					const moreUsers = res.data.users;
					$result.data.users.push(...moreUsers);
					isLoading = false;
					console.log('moreUsers:', moreUsers);
					console.log('u broke ur promise');
				})
				.catch(() => {
					console.error('error fetching more users');
					isLoading = false;
				})
		}
	}

	// add variables property to assign the first argument to the number of users to load
	const result = queryStore<{ users: UserType[] }>({
		client,
		query: gql`
			query Users($first: Int!){
				users(first: $first) {
					id
					name
					avatar
					email
				}
			}
		`,
		variables: {
			first: initiallyLoad
		}
	});



	

	// declare a function to track the position of scroll, and trigger another load/query
	// function scrollHandler() {
	// 	// declare variale for tracking scroll position
	// 	let scrollPosition = window.innerHeight + window.pageYOffset;
	// 	let pageBottom = document.body.offsetHeight * 2;
	// 	// const windowBottom = window.innerHeight + window.pageYOffset;
	// 	// console.log(windowBottom, 'should be >= ', document.body.offsetHeight)
	// 	if (scrollPosition >= pageBottom && !isLoading) {
	// 		console.log('you hit rock bottom');
	// 		isLoading = true;
	// 		currentLoad++;
	// 		console.log('current load', currentLoad);
			// const usersPerLoad = $result.operation.variables.first;
			// const after = (currentLoad - 1) * usersPerRequest;

			// create another instance of a query with the inclusion of the 'after' parameter
			// client
			// .query(
			// 	gql`
			// 		query Users($first: Int!, $after: Int!){
			// 			users(first: $first, after: $after) {
			// 				id
			// 				name
			// 				avatar
			// 				email
			// 			}
			// 		}
			// 	`,
			// 	{
			// 		first: usersPerRequest,
			// 		after: after
			// 	}
			// )
			// .toPromise()
			// .then((res) => {
			// 	const moreUsers = res.data.users;
			// 	$result.data.users.push(...moreUsers);
			// 	isLoading = false;
			// 	console.log('moreUsers:', moreUsers);
			// 	console.log('u broke ur promise');
			// })
			// .catch((error) => {
			// 	console.error('error fetching more users');
			// 	isLoading = false;
			// })
	// 	}
	// }

	onMount(() => {
		loadMoreUsers();
	})

	function scrollHandler() {
		const containerHeight = containerRef.clientHeight;
    const scrollPosition = containerRef.scrollTop;
    const totalHeight = containerRef.scrollHeight;

		if (containerHeight + scrollPosition >= totalHeight) {
      loadMoreUsers();
    }
	}

	// onMount(() => {
	// 	// attach scrollHandler to event listener
	// 	window.addEventListener('scroll', scrollHandler());
	// 	console.log('offset height', document.body.offsetHeight)
	// 	console.log('scrollhandler mounted');
	// })
</script>

	<div class="w-full h-full overflow-scroll" bind:this={containerRef}>
		<div class="flex flex-col gap-4 items-center p-4">
			{console.log('arguments are', $result.operation.variables)}
			{#if isLoading}
				<Loader />
			{:else}
				{#each $result.data.users as user (user.id)}
					<User {user} />
				{/each}
			{/if}
		</div>
	</div>

	<svelte:window on:scroll={scrollHandler} /> -->





<!-- <script lang="ts">
	import { cacheExchange, createClient, fetchExchange, gql, queryStore } from '@urql/svelte';
	import Loader from 'components/Loader.svelte';
	import User from 'components/User.svelte';
	import type { UserType } from 'lib/types';
	// import the other dependencies
	import { Lazy } from 'svelte-lazy';
	import { afterUpdate } from 'svelte';
	import { paginationConfig } from 'lib/paginationConfig';

	const client = createClient({
		url: '/graphql',
		exchanges: [cacheExchange, fetchExchange]
	});

	const result = queryStore<{ users: UserType[] }>({
		client,
		query: gql`
			query {
				users {
					id
					name
					avatar
					email
				}
			}
		`
	});

// declare a variable to check if the client has scrolled to the bottom

</script>

<div class="w-full h-full overflow-scroll">
	<div class="flex flex-col gap-4 items-center p-4">
		{#if $result.fetching}
			<Loader />
		{:else if $result.data}
			{#each $result.data.users as user (user.id)}
				<User {user} />
			{/each}
		{/if}
	</div>
</div> -->

