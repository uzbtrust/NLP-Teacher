<script lang="ts">
	import { base } from '$app/paths';
	import { QISM, modulTop, qoshni } from '~/lib/darslik/modullar';

	export let slug: string;

	$: modul = modulTop(slug);
	$: nav = qoshni(slug);
</script>

<article class="modul">
	<header>
		<p class="eyebrow">
			<span class="qism">{QISM.raqam}</span>
			{QISM.title}
			<span class="dot">·</span>
			<span class="raqam">{modul?.raqam}</span>
			<span class="yil">{modul?.yil}</span>
		</p>
		<h1>{modul?.title}</h1>
		<p class="tagline">{modul?.tagline}</p>
	</header>

	<section class="prose">
		<h2>Muammo</h2>
		<slot name="muammo" />
	</section>

	<section class="demo">
		<slot name="demo" />
	</section>

	<section class="prose">
		<h2>Nima o'zgardi</h2>
		<slot name="ozgarish" />
	</section>

	<section class="prose">
		<h2>Amalda</h2>
		<slot name="amalda" />
	</section>

	<section class="prose manba">
		<h2>Manba</h2>
		<slot name="manba" />
	</section>

	<nav class="modul-nav">
		{#if nav.oldingi}
			<a class="nav-card oldingi" href="{base}/darslik/{nav.oldingi.slug}">
				<span class="yon">← Oldingi</span>
				<span class="nom">{nav.oldingi.raqam} {nav.oldingi.title}</span>
			</a>
		{:else}
			<a class="nav-card oldingi" href="{base}/darslik">
				<span class="yon">← Oldingi</span>
				<span class="nom">Darslik boshi</span>
			</a>
		{/if}
		{#if nav.keyingi}
			<a class="nav-card keyingi" href="{base}/darslik/{nav.keyingi.slug}">
				<span class="yon">Keyingi →</span>
				<span class="nom">{nav.keyingi.raqam} {nav.keyingi.title}</span>
			</a>
		{:else}
			<a class="nav-card keyingi" href="{base}/darslik">
				<span class="yon">Keyingi →</span>
				<span class="nom">Modullar ro'yxati</span>
			</a>
		{/if}
	</nav>
</article>

<style lang="scss">
	.modul {
		max-width: 78ch;
		margin: 0 auto;
		padding: 3rem 1.5rem 5rem;
	}

	header {
		border-bottom: 1px solid theme('colors.gray.200');
		padding-bottom: 1.75rem;
		margin-bottom: 2.5rem;
	}

	.eyebrow {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.78rem;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: theme('colors.gray.400');
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.qism {
		background: theme('colors.purple.700');
		color: white;
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
		font-variant-numeric: tabular-nums;
	}

	.dot {
		color: theme('colors.gray.300');
	}

	.raqam {
		color: theme('colors.purple.600');
		font-variant-numeric: tabular-nums;
	}

	.yil {
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
	}

	h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 2.6rem;
		font-weight: 700;
		line-height: 1.1;
		color: theme('colors.purple.700');
		text-wrap: balance;
	}

	.tagline {
		margin-top: 0.75rem;
		font-size: 1.1rem;
		line-height: 1.6;
		color: theme('colors.gray.600');
		max-width: 60ch;
	}

	section {
		margin-bottom: 3rem;
	}

	.demo {
		margin-bottom: 3.5rem;
	}

	.prose :global(h2),
	h2 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.05rem;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: theme('colors.gray.400');
		margin-bottom: 1rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid theme('colors.gray.100');
	}

	.prose :global(h3) {
		font-size: 1.15rem;
		font-weight: 600;
		color: theme('colors.purple.700');
		margin: 1.75rem 0 0.6rem;
	}

	.prose :global(p) {
		font-size: 1.02rem;
		line-height: 1.75;
		color: theme('colors.gray.800');
		margin-bottom: 1rem;
	}

	.prose :global(ul),
	.prose :global(ol) {
		margin: 0 0 1.25rem 1.25rem;
		font-size: 1.02rem;
		line-height: 1.75;
		color: theme('colors.gray.800');
	}

	.prose :global(ul) {
		list-style: disc;
	}
	.prose :global(ol) {
		list-style: decimal;
	}

	.prose :global(li) {
		margin-bottom: 0.4rem;
		padding-left: 0.25rem;
	}

	.prose :global(a) {
		color: theme('colors.blue.500');

		&:hover {
			color: theme('colors.blue.700');
		}
	}

	.prose :global(code) {
		font-family: theme('fontFamily.mono');
		font-size: 0.88em;
		background: theme('colors.gray.50');
		color: theme('colors.gray.600');
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
	}

	.prose :global(strong) {
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.prose :global(table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.92rem;
		margin: 1.25rem 0;
	}

	.prose :global(th),
	.prose :global(td) {
		text-align: left;
		padding: 0.55rem 0.75rem;
		border-bottom: 1px solid theme('colors.gray.200');
		vertical-align: top;
	}

	.prose :global(th) {
		font-weight: 600;
		color: theme('colors.gray.700');
		white-space: nowrap;
	}

	.prose :global(.eski) {
		color: theme('colors.gray.400');
	}

	.prose :global(.yangi) {
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.manba :global(p) {
		font-size: 0.92rem;
		color: theme('colors.gray.500');
		margin-bottom: 0.5rem;
	}

	.modul-nav {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-top: 4rem;
	}

	.nav-card {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 1rem 1.25rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		transition: border-color 0.15s ease, background 0.15s ease;

		&:hover {
			border-color: theme('colors.purple.300');
			background: theme('colors.purple.50');
		}
	}

	.keyingi {
		text-align: right;
	}

	.yon {
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: theme('colors.gray.400');
	}

	.nom {
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 500;
		color: theme('colors.gray.800');
	}
</style>
