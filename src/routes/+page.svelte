<script lang="ts">
import { cacheExchange, createClient, fetchExchange, gql, queryStore } from '@urql/svelte';
import Loader from 'components/Loader.svelte';
import User from 'components/User.svelte';
	import { users } from 'lib/data';
import type { UserType } from 'lib/types';
import { onMount } from 'svelte';

const client = createClient({
	url: '/graphql',
	exchanges: [cacheExchange, fetchExchange]
});

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
      first: 10,
      after: 0
    }
  });

	// declare a variable to track scroll
	let scroll;
	// declare a variable that checks if the client has scrolled to the bottom ofthe page
	

  // assign var to track current load instance
  let currentLoad = 1;

  // async function to get load
  async function getLoad(){
    try {
      // don't load if already loading
      if ($result.fetching) return;

      currentLoad++;
      console.log(currentLoad, 'th load incoming');
      const lim = $result.operation.variables.first;
      const after = (currentLoad - 1) * lim;

      // await the response and its parse
      const res = await client.query(query, {
        first: lim,
        after: after
      });

      // push the results into the queryStore
      const { data } = res;
			// grab the user list from the parsed data
      console.log('response from db:', res);
      console.log('user list:', data);

      if (data && data.users) {
        $result.data.users = res.data.users.concat(data.users);
        console.log('promise completed, pushed user list:', data.users);
      }
    }
    catch(err) {
      console.error(err);
    }
  }

  // mount the event listener
  onMount(() => {
    let test = window.scrollY;
    const scrollHandler = async () => {
      let pos = window.innerHeight + window.pageYOffset;
      let bot = document.body.offsetHeight - 30;
      test = window.scrollY;

      console.log('scroll position:', pos);
      console.log('test scrollY position:', test);
      console.log('height of the doc:', bot);

      if ((pos >= bot) && !$result.fetching) {
        console.log('reached the bottom');
        await getLoad();
      }
      else if ((test >= bot) && !$result.fetching) {
        console.log('this is the ScrollY test condition');
        await getLoad();
      }
    };

    window.addEventListener('scroll', async () => {
      test = window.scrollY;
      await scrollHandler();
    });

    console.log('scroll-handler mounted');
    return () => {
      window.removeEventListener('scroll', () => scrollHandler());
    };
  });
</script>

<svelte:window bind:scrollY={scroll} />
<h1>{scroll}</h1>

<div class="w-full h-full overflow-scroll">
  <div class="flex flex-col gap-4 items-center p-4">
    {console.log('current query store:', $result)}
    {#if !($result.data)}
		{console.log('current user list:', $result.data)}
		{/if}

    {#if $result.fetching}
      <Loader />
    {:else if $result.data && $result.data.users}
		{console.log('current user list:', $result.data.users)}
      {#each $result.data.users as user (user.id)}
        <User {user} />
      {/each}
    {/if}
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
		import { onMount } from 'svelte';
	
		const client = createClient({
			url: '/graphql',
			exchanges: [cacheExchange, fetchExchange]
		});
	
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
				first: 10,
				after: 0
			},
			data: { users: [] }
	 });
	
		
	
	
	
	
	
		// assign a variable to track of the current loading instance
		let currentLoad = 1;
	
		// async function to get load
		async function getLoad(){
			try {
				// don't load if already loading
				if ($result.fetching) return;
	
				currentLoad++;
				console.log(currentLoad, 'th load incoming');
				const lim = $result.operation.variables.first;
				const after = (currentLoad - 1) * lim;
	
				// await the response and its parse
				const res = await client.query(query, {
					first: lim,
					after: after
				});
	
				// grab the user list from the parsed data
				console.log('response from db:', res);
				console.log('user list:', data.users);
	
				// push the results into the queryStore
				const { data } = res;
	
				if (data && data.users) {
					$result.data.users = $result.data.users.concat(data.users);
					console.log('promise completed, pushed user list:', data.users);
				}
			}
			catch(err) {
				console.error(err);
			}
		}
	
		// mount the event listener
		let test = window.scrollY;
		onMount(() => {
			test = window.scrollY;
			const scrollHandler = async () => {
				let pos = window.innerHeight + window.pageYOffset;
				let bot = document.body.offsetHeight - 30;
				test = window.scrollY;
	
				console.log('scroll position:', pos);
				console.log('test scrollY position:', test);
				console.log('height of the doc:', bot);
		
				if ((pos <= bot) && !$result.fetching) {
					console.log('reached the bottom');
					await getLoad();
				}
				else if ((test <= bot) && !$result.fetching) {
					console.log('this is the ScrollY test condition');
					await getLoad();
				}
			};
	
			window.addEventListener('scroll', () => {
				test = window.scrollY;
				scrollHandler();
			});
	
			console.log('scroll-handler mounted');
			return () => {
				window.removeEventListener('scroll', () => scrollHandler());
			};
		});
	</script>
	
	<div class="w-full h-full overflow-scroll">
		<div class="flex flex-col gap-4 items-center p-4">
			{console.log('current query store:', $result)}
			{console.log('current user list:', $result.data.users)}
			{#if $result.fetching}
				<Loader />
			{:else if $result.data && $result.data.users}
				{#each $result.data.users as user (user.id)}
					<User {user} />
				{/each}
			{/if}
		</div>
	</div> -->

<!-- <script lang="ts">
import { cacheExchange, createClient, fetchExchange, gql, queryStore } from '@urql/svelte';
import Loader from 'components/Loader.svelte';
import User from 'components/User.svelte';
import type { UserType } from 'lib/types';
import { onMount } from 'svelte';

const client = createClient({
	url: '/graphql',
	exchanges: [cacheExchange, fetchExchange]
});

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
		first: 10,
		after: 0
	},
	data: { users: [] }
});

// assign variable to track current load instance
let currentLoad = 1;

// async function to get load
async function getLoad(){
	try {
		// don't load if already loading
		if ($result.fetching) return;

		currentLoad++;
		console.log(currentLoad, 'th load incoming');
		const lim = $result.operation.variables.first;
		const after = (currentLoad - 1) * lim;

		// await the response and its parse
		const res = await client.query(query, {
			first: lim,
			after: after
		});

		// grab the user list from the parsed data
		console.log('response from db:', res);
		console.log('user list:', data.users);

		// push the results into the queryStore
		const { data } = res;

		if (data && data.users) {
			$result.data.users = $result.data.users.concat(data.users);
			console.log('promise completed, pushed user list:', data.users);
		}
	}
	catch(err) {
		console.error(err);
	}
}

// mount the event listener
onMount(() => {
	let test = window.scrollY;
	const scrollHandler = async () => {
		let pos = window.innerHeight + window.pageYOffset;
		let bot = document.body.offsetHeight - 30;
		test = window.scrollY;

		console.log('scroll position:', pos);
		console.log('test scrollY position:', test);
		console.log('height of the doc:', bot);

		if ((pos >= bot) && !$result.fetching) {
			console.log('reached the bottom');
			await getLoad();
		}
		else if ((test >= bot) && !$result.fetching) {
			console.log('this is the ScrollY test condition');
			await getLoad();
		}
	};

	window.addEventListener('scroll', async () => {
		test = window.scrollY;
		await scrollHandler();
	});

	console.log('scroll-handler mounted');
	return () => {
		window.removeEventListener('scroll', () => scrollHandler());
	};
});
</script>

<div class="w-full h-full overflow-scroll">
<div class="flex flex-col gap-4 items-center p-4">
	{console.log('current query store:', $result)}
	{console.log('current user list:', $result.data.users)}
	{#if $result.fetching}
		<Loader />
	{:else if $result.data && $result.data.users}
		{#each $result.data.users as user (user.id)}
			<User {user} />
		{/each}
	{/if}
</div>
</div> -->

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

