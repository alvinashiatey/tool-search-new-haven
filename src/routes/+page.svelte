<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let query = $state('');
	let selectedLocation = $state('');
	let searchOpen = $state(false);
	let visibleCount = $state(24);
	let searchInput = $state<HTMLInputElement>();

	const preferredLocations = [
		'Yale Center for Engineering and Innovation Design (CEID)',
		'Makehaven',
		'Yale School of Art Equipment Loan Office (ELO)',
		'Bass Library Equipment Loan Office (ELO)',
		'New Haven Free Public Library Tinker Lab'
	];
	const locationColors: Record<string, string> = {
		'Yale Center for Engineering and Innovation Design (CEID)': '#00838a',
		Makehaven: '#f15060',
		'Yale School of Art Equipment Loan Office (ELO)': '#914e72',
		'Bass Library Equipment Loan Office (ELO)': '#ffae3b',
		'New Haven Free Public Library Tinker Lab': '#bd6439'
	};

	const availableLocations = $derived(new Set(data.tools.map((tool) => tool.location)));
	const locations = $derived([
		...preferredLocations.filter((location) => availableLocations.has(location)),
		...Array.from(availableLocations)
			.filter((location) => !preferredLocations.includes(location))
			.sort((a, b) => a.localeCompare(b))
	]);
	const results = $derived.by(() => {
		const term = query.trim().toLocaleLowerCase();
		return data.tools.filter((tool) => {
			const searchable =
				`${tool.name} ${tool.category} ${tool.location} ${tool.address} ${tool.accessPolicy}`.toLocaleLowerCase();
			return (
				(!term || searchable.includes(term)) &&
				(!selectedLocation || tool.location === selectedLocation)
			);
		});
	});
	const shown = $derived(results.slice(0, visibleCount));

	function chooseLocation(location: string) {
		selectedLocation = selectedLocation === location ? '' : location;
		visibleCount = 24;
	}

	function openSearch() {
		searchOpen = true;
		requestAnimationFrame(() => searchInput?.focus());
	}

	function clearAll() {
		query = '';
		selectedLocation = '';
		visibleCount = 24;
	}
</script>

<svelte:head>
	<title>Tools in New Haven</title>
	<meta
		name="description"
		content="Browse tools available within Yale and other maker spaces around New Haven."
	/>
</svelte:head>

<main>
	<section class="introduction" aria-labelledby="introduction-title">
		<h1 id="introduction-title">
			Browse through a list of tools available within Yale and other maker spaces around New Haven.
			Select through the list of locations below to see the tools available in that location or
			<button class="text-link" type="button" onclick={openSearch}>click here to search</button>.
		</h1>

		<nav class="location-list" aria-label="Filter tools by location">
			{#each locations as location (location)}
				<button
					type="button"
					class:active={selectedLocation === location}
					style:color={locationColors[location] ?? '#111'}
					aria-pressed={selectedLocation === location}
					onclick={() => chooseLocation(location)}>{location}</button
				>
			{/each}
		</nav>

		{#if searchOpen}
			<div class="search-row">
				<label for="tool-search">Search the tool list</label>
				<div class="search-field">
					<input
						bind:this={searchInput}
						bind:value={query}
						oninput={() => (visibleCount = 24)}
						id="tool-search"
						type="search"
						placeholder="Tool, category, location…"
					/>
					{#if query}<button type="button" onclick={() => (query = '')}>Clear</button>{/if}
				</div>
			</div>
		{/if}

		{#if selectedLocation || query}
			<div class="status" aria-live="polite">
				<span>{results.length} {results.length === 1 ? 'tool' : 'tools'}</span>
				<button type="button" onclick={clearAll}>Clear filters</button>
			</div>
		{/if}
	</section>

	{#if data.error}
		<section class="message" role="alert">
			<h2>The tool list could not be loaded.</h2>
			<p>{data.error}</p>
			<a href={resolve('/')}>Try again</a>
		</section>
	{:else if results.length}
		<section class="tool-grid" aria-label="Available tools">
			{#each shown as tool, index (`${tool.name}-${tool.location}-${index}`)}
				<article>
					<span class="index">{index + 1}</span>
					<h2>{tool.name},</h2>
					<p class="location" style:color={locationColors[tool.location] ?? '#111'}>
						{tool.location}
					</p>
					<span class="policy">{tool.accessPolicy}</span>
					{#if tool.url}
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a
							href={tool.url}
							target="_blank"
							rel="noreferrer"
							aria-label={`View details for ${tool.name}`}
						>
							<span aria-hidden="true">View details ↗</span>
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{/if}
				</article>
			{/each}
		</section>
		{#if shown.length < results.length}
			<button class="show-more" type="button" onclick={() => (visibleCount += 24)}>
				Show more
			</button>
		{/if}
	{:else}
		<section class="message">
			<h2>No tools found.</h2>
			<p>Try another search or location.</p>
			<button type="button" onclick={clearAll}>Clear filters</button>
		</section>
	{/if}
</main>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(html) {
		background: #fff;
		color: #111;
		font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
		font-size: 16px;
	}

	:global(body) {
		margin: 0;
	}

	:global(button),
	:global(input) {
		font: inherit;
	}

	:global(:focus-visible) {
		outline: 2px solid #111;
		outline-offset: 4px;
	}

	main {
		width: min(100% - 48px, 1680px);
		margin: 0 auto;
		padding: clamp(72px, 7vw, 120px) 0 96px;
	}

	.introduction {
		max-width: 1500px;
	}

	h1,
	.location-list {
		font-size: clamp(1.45rem, 1.75vw, 2rem);
		font-weight: 400;
		line-height: 1.18;
		letter-spacing: -0.035em;
	}

	h1 {
		margin: 0;
	}

	.text-link,
	.location-list button {
		border: 0;
		background: transparent;
		color: inherit;
		cursor: pointer;
		padding: 0;
	}

	.text-link {
		text-decoration: underline;
		text-decoration-thickness: 1.5px;
		text-underline-offset: 4px;
	}

	.text-link:hover,
	.text-link:focus-visible {
		text-decoration-thickness: 3px;
	}

	.location-list {
		margin-top: 34px;
	}

	.location-list button {
		font-style: normal;
		line-height: inherit;
		letter-spacing: inherit;
		text-align: left;
	}

	.location-list button:not(:last-child)::after {
		content: ',\00a0';
	}

	.location-list button.active {
		font-style: italic;
	}

	.location-list button:hover:not(.active) {
		text-decoration: underline;
		text-decoration-thickness: 1.5px;
		text-underline-offset: 4px;
	}

	.search-row {
		margin-top: 38px;
		max-width: 720px;
	}

	.search-row > label {
		display: block;
		margin-bottom: 9px;
		font-size: 0.875rem;
	}

	.search-field {
		display: flex;
		border-bottom: 2px solid #111;
	}

	.search-field input {
		width: 100%;
		border: 0;
		background: transparent;
		padding: 10px 0 12px;
		font-size: clamp(1.25rem, 2vw, 1.8rem);
		outline: 0;
	}

	.search-field button,
	.status button {
		border: 0;
		background: transparent;
		text-decoration: underline;
		cursor: pointer;
	}

	.status {
		display: flex;
		gap: 20px;
		margin-top: 18px;
		color: #777;
		font-size: 0.875rem;
	}

	.status button {
		color: #111;
	}

	.tool-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		column-gap: clamp(48px, 8vw, 150px);
		row-gap: 35px;
		margin-top: clamp(100px, 10vw, 150px);
	}

	article {
		position: relative;
		min-width: 0;
		font-size: clamp(1.45rem, 1.75vw, 2rem);
		line-height: 1.16;
		letter-spacing: -0.035em;
	}

	.index {
		display: block;
		margin-bottom: 10px;
	}

	article h2,
	article p {
		font: inherit;
		margin: 0;
	}

	.location {
		max-width: 390px;
	}

	.policy {
		display: inline-block;
		max-width: 100%;
		margin-top: 5px;
		padding: 1px 8px 3px;
		border: 2px solid #c4c4c4;
		border-radius: 10px;
		color: #bdbdbd;
		line-height: 1;
		white-space: nowrap;
	}

	article > a {
		position: absolute;
		inset: 0;
		color: transparent;
	}

	article > a span {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}

	article:has(> a) {
		cursor: pointer;
	}

	article:has(> a):hover h2,
	article:has(> a):hover .location {
		text-decoration: underline;
		text-decoration-thickness: 1.5px;
		text-underline-offset: 4px;
	}

	.show-more,
	.message button,
	.message a {
		display: block;
		margin: 64px auto 0;
		border: 1px solid #111;
		background: transparent;
		color: #111;
		padding: 10px 20px;
		text-decoration: none;
		cursor: pointer;
	}

	.show-more:hover,
	.message button:hover,
	.message a:hover {
		background: #111;
		color: #fff;
	}

	.message {
		margin-top: 110px;
		text-align: center;
	}

	.message h2 {
		font-size: 1.75rem;
		font-weight: 400;
		margin: 0 0 8px;
	}

	.message p {
		color: #777;
	}

	.message a {
		width: fit-content;
	}

	@media (max-width: 800px) {
		main {
			width: min(100% - 32px, 1680px);
			padding-top: 48px;
		}

		.tool-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			column-gap: 38px;
			margin-top: 80px;
		}

		.policy {
			white-space: normal;
		}
	}

	@media (max-width: 520px) {
		h1,
		.location-list {
			font-size: 1.3rem;
		}

		.location-list {
			margin-top: 26px;
		}

		.tool-grid {
			grid-template-columns: 1fr;
			row-gap: 38px;
			margin-top: 64px;
		}

		article {
			font-size: 1.5rem;
		}
	}
</style>
