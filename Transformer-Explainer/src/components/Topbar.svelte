<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import InputForm from '~/components/InputForm.svelte';
	import { ga } from '~/utils/event';
	import Sampling from '~/components/Sampling.svelte';
	import { base } from '$app/paths';

	export let isActive;

	// Check if current page is about page
	$: isAboutPage = $page.url.pathname === '/about';
</script>

<div class="top-bar flex w-full items-center gap-4 px-10 py-2 pb-3" class:active={isActive}>
	<div class="logo text-bold text-gray-700" data-click="logo">
		T<span class="small">RANSFORMER</span> E<span class="small">XPLAINER</span>
	</div>
	<div class="inputs flex grow items-center">
		<div class="input-wrapper w-full" class:active={isActive}>
			{#if !isAboutPage}
				<InputForm />
			{/if}
		</div>
	</div>
	<div class="icons flex items-center gap-4">
		<a class="darslik-link" href="{base}/darslik" data-click="darslik_btn">Darslik</a>
		<a
			href="https://github.com/uzbtrust/NLP-Teacher"
			target="_blank"
			data-click="github_btn"
		>
			<svg
				class="h-6 w-6 text-gray-800 dark:text-white"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				fill="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					fill-rule="evenodd"
					d="M12.006 2a9.847 9.847 0 0 0-6.484 2.44 10.32 10.32 0 0 0-3.393 6.17 10.48 10.48 0 0 0 1.317 6.955 10.045 10.045 0 0 0 5.4 4.418c.504.095.683-.223.683-.494 0-.245-.01-1.052-.014-1.908-2.78.62-3.366-1.21-3.366-1.21a2.711 2.711 0 0 0-1.11-1.5c-.907-.637.07-.621.07-.621.317.044.62.163.885.346.266.183.487.426.647.71.135.253.318.476.538.655a2.079 2.079 0 0 0 2.37.196c.045-.52.27-1.006.635-1.37-2.219-.259-4.554-1.138-4.554-5.07a4.022 4.022 0 0 1 1.031-2.75 3.77 3.77 0 0 1 .096-2.713s.839-.275 2.749 1.05a9.26 9.26 0 0 1 5.004 0c1.906-1.325 2.74-1.05 2.74-1.05.37.858.406 1.828.101 2.713a4.017 4.017 0 0 1 1.029 2.75c0 3.939-2.339 4.805-4.564 5.058a2.471 2.471 0 0 1 .679 1.897c0 1.372-.012 2.477-.012 2.814 0 .272.18.592.687.492a10.05 10.05 0 0 0 5.388-4.421 10.473 10.473 0 0 0 1.313-6.948 10.32 10.32 0 0 0-3.39-6.165A9.847 9.847 0 0 0 12.007 2Z"
					clip-rule="evenodd"
				/>
			</svg>
		</a>
	</div>
</div>

<style lang="scss">
	.darslik-link {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.85rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: theme('colors.purple.600');
		white-space: nowrap;
		padding: 0.25rem 0.6rem;
		border: 1px solid theme('colors.purple.200');
		border-radius: 4px;
		transition: background 0.15s ease;

		&:hover {
			background: theme('colors.purple.50');
		}
	}

	.top-bar {
		background: linear-gradient(to bottom, rgba(255, 255, 255, 1) 60%, rgba(255, 255, 255, 0) 100%);

		@media (max-width: 900px) {
			padding-left: 1rem;
			padding-right: 1rem;
			gap: 0.75rem;
		}

		.input-wrapper {
			&.active {
				opacity: 1;
				pointer-events: initial;
			}
			opacity: 0;
			transition: opacity 0.2s;
			pointer-events: none;
		}
		.logo {
			flex-shrink: 0;
			white-space: nowrap;
			font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;

			font-optical-sizing: auto;
			font-style: normal;
			font-weight: 700;
			letter-spacing: 0.01em;

			font-size: 1.5rem;
			// color: theme('colors.blue.800');

			background: linear-gradient(
				to right,
				theme('colors.blue.500') 0%,
				theme('colors.purple.500') 60%
			);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;

			.small {
				font-size: 1.15rem;
				letter-spacing: 0.06em;
			}
		}
		.icons {
			flex-shrink: 0;
			svg {
				fill: theme('colors.gray.600');
			}
		}
	}
</style>
