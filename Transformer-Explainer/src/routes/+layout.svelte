<script lang="ts">
	import '~/styles/app.css';
	import '~/styles/global.scss';
	import { isLoaded, predictedColor, rootRem, userId, isMobile } from '~/store';
	import { onMount } from 'svelte';
	// Barrel import ('flowbite-svelte') butun kutubxonani umumiy layout chunk'iga
	// tortadi. Deep path faqat shu bitta komponentni oladi.
	import Spinner from 'flowbite-svelte/Spinner.svelte';
	import GTM from '~/utils/gtm.svelte';
	import MobileNotice from '~/components/MobileNotice.svelte';
	import DarslikTopbar from '~/components/darslik/DarslikTopbar.svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import Article from '~/components/article/Article.svelte';

	let topBarHeight = 0;
	let scrollLeft = 0;

	let minScreenWidth = 1300;
	let minColumWidth = Math.floor(minScreenWidth / 24) - rootRem * 2;

	let intersectionObserver: IntersectionObserver;
	let tobBarActive = false;
	let target: HTMLElement;

	// /darslik butunlay boshqa qobiqda ochiladi: model yuklanmaydi, sahifa normal skroll qiladi.
	$: isDarslik = ($page.route.id ?? '').startsWith('/darslik');

	// Topbar faqat explorer sahifasida ko'rinadi, lekin u InputForm orqali
	// flowbite-svelte, flowbite-svelte-icons, d3 va gsap ni tortadi. Statik import
	// bo'lsa bularning hammasi umumiy layout chunk'iga - ya'ni /darslik ga ham - tushadi.
	// Article esa statik qoladi: u prerender qilingan HTML'da turishi kerak (SEO).
	let TopbarComp: any = null;
	$: if (browser && !isDarslik && !$isMobile && !TopbarComp) {
		import('~/components/Topbar.svelte').then((m) => (TopbarComp = m.default));
	}

	onMount(() => {
		isLoaded.set(true);

		const userIdParam = $page.url.searchParams.get('userId');

		if (userIdParam) {
			userId.set(userIdParam);
			(window as any).dataLayer?.push({
				event: 'user_identified',
				user_id: userIdParam,
				timestamp: new Date().toISOString()
			});
		}

		intersectionObserver = new IntersectionObserver(handleIntersection, {
			root: null,
			rootMargin: '0px',
			threshold: 0.2
		});

		if (target) {
			intersectionObserver.observe(target);
		}
		window.addEventListener('scroll', handleMobileScrollX);

		return () => {
			intersectionObserver.disconnect();
			window.removeEventListener('scroll', handleMobileScrollX);
		};
	});

	function handleIntersection(entries: any[]) {
		entries.forEach((entry: any) => {
			if (entry.isIntersecting) {
				tobBarActive = true;
			} else {
				tobBarActive = false;
			}
		});
	}

	const handleMobileScrollX = () => {
		scrollLeft = window.scrollX || document.documentElement.scrollLeft;
	};
</script>

<GTM />
{#if $isMobile}
	<MobileNotice />
{:else if isDarslik}
	<div id="darslik-app">
		<header class="darslik-header">
			<DarslikTopbar />
		</header>
		<main>
			<slot />
		</main>
	</div>
{:else}
	<div
		id="app"
		style={`--min-screen-width:${minScreenWidth}px;--min-column-width:${minColumWidth}px;--predicted-color:${predictedColor};`}
	>
		<div id="landing">
			<header bind:offsetHeight={topBarHeight} style="transform: translateX({-1 * scrollLeft}px);">
				<svelte:component this={TopbarComp} isActive={tobBarActive} />
			</header>
			<main id="main" style={`padding-top:${topBarHeight}px`} bind:this={target}>
				{#if $isLoaded}
					<slot />
				{:else}
					<div class="flex h-full w-full items-center justify-center">
						<Spinner color="purple" />
					</div>
				{/if}
			</main>
		</div>
		<div class="article h-auto w-full">
			<Article></Article>
		</div>
	</div>
{/if}

<style lang="scss">
	#app {
		height: 100vh;
		min-width: 900px;
	}

	#landing {
		height: 100%;
		width: 100%;
		min-width: var(--min-screen-width);
	}

	header {
		min-width: var(--min-screen-width);
		width: 100%;
		position: fixed;
		z-index: $TOP_BAR_INDEX;
	}
	main {
		position: relative;
		height: 95%;
		width: 100%;
		display: flex;
		justify-content: start;
		overflow: hidden;
	}
	.article {
		padding-top: 2rem;
	}

	#darslik-app {
		min-width: 860px;

		.darslik-header {
			position: sticky;
			top: 0;
			min-width: 0;
			z-index: $TOP_BAR_INDEX;
		}

		main {
			position: static;
			height: auto;
			display: block;
			overflow: visible;
		}
	}
</style>
