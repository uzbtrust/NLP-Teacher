<script lang="ts">
	import { base } from '$app/paths';
	import { qismlar } from '~/lib/darslik/modullar';
</script>

<svelte:head>
	<title>Darslik | Transformer Explainer</title>
	<meta
		name="description"
		content="GPT-2 blokidan zamonaviy modelgacha: RMSNorm, Pre-LN, SwiGLU, RoPE, KV cache, GQA, MLA, FlashAttention va boshqalar - har biri interaktiv demo bilan."
	/>
</svelte:head>

<div class="darslik-index">
	<header>
		<p class="eyebrow">Darslik</p>
		<h1>Zamonaviy model<br />qanday yig'ilgan</h1>
		<p class="lead">
			Bosh sahifadagi model - GPT-2 (2019). Uning arxitekturasi bugungi modellarda ham o'sha:
			attention, FFN, residual. Lekin blok <em>ichidagi</em> deyarli har bir qism almashtirilgan,
			va uni ishlatish usuli butunlay boshqacha. Bu bo'limda o'sha o'zgarishlarni birma-bir,
			ixtiro qilingan tartibda ko'ramiz.
		</p>
	</header>

	{#each qismlar as q (q.raqam)}
		<section class="qism">
			<div class="qism-head">
				<span class="qism-raqam">{q.raqam}</span>
				<div>
					<h2>{q.title} <span class="qism-yil">{q.yillar}</span></h2>
					<p>{q.tagline}</p>
				</div>
			</div>

			<ol class="modul-list">
				{#each q.modullar as m (m.slug)}
					<li>
						<a href="{base}/darslik/{m.slug}">
							<span class="raqam">{m.raqam}</span>
							<span class="matn">
								<span class="nom">{m.title}</span>
								<span class="tagline">{m.tagline}</span>
							</span>
							<span class="yil">{m.yil}</span>
						</a>
					</li>
				{/each}
			</ol>
		</section>
	{/each}

	<p class="qaytish"><a href="{base}/">&larr; Jonli GPT-2 modeliga qaytish</a></p>
</div>

<style lang="scss">
	.darslik-index {
		max-width: 78ch;
		margin: 0 auto;
		padding: 4rem 1.5rem 6rem;
	}

	.eyebrow {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.78rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: theme('colors.gray.400');
		margin-bottom: 1rem;
	}

	h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 3.2rem;
		font-weight: 700;
		line-height: 1.05;
		color: theme('colors.purple.700');
		text-wrap: balance;
	}

	.lead {
		margin-top: 1.25rem;
		font-size: 1.08rem;
		line-height: 1.75;
		color: theme('colors.gray.700');
		max-width: 62ch;

		em {
			font-style: italic;
			color: theme('colors.purple.700');
		}
	}

	.qism {
		margin-top: 3.5rem;
		border-top: 1px solid theme('colors.gray.200');
		padding-top: 2.5rem;
	}

	.qism-head {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		margin-bottom: 2rem;

		h2 {
			font-family: 'Space Grotesk', sans-serif;
			font-size: 1.5rem;
			font-weight: 600;
			color: theme('colors.gray.800');
			display: flex;
			align-items: baseline;
			gap: 0.7rem;
			flex-wrap: wrap;
		}

		.qism-yil {
			font-family: theme('fontFamily.mono');
			font-size: 0.8rem;
			font-weight: 400;
			color: theme('colors.gray.400');
			font-variant-numeric: tabular-nums;
		}

		p {
			margin-top: 0.35rem;
			font-size: 0.98rem;
			line-height: 1.65;
			color: theme('colors.gray.500');
			max-width: 58ch;
		}
	}

	.qism-raqam {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.5rem;
		font-weight: 700;
		color: white;
		background: theme('colors.purple.700');
		border-radius: 5px;
		padding: 0.15rem 0.55rem;
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}

	.modul-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.modul-list a {
		display: grid;
		grid-template-columns: 3.5rem 1fr auto;
		align-items: baseline;
		gap: 1rem;
		padding: 1rem 1.1rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;

		&:hover {
			border-color: theme('colors.purple.300');
			background: theme('colors.purple.50');
			transform: translateX(3px);
		}
	}

	.raqam {
		font-family: theme('fontFamily.mono');
		font-size: 0.9rem;
		color: theme('colors.purple.500');
		font-variant-numeric: tabular-nums;
	}

	.matn {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.nom {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.1rem;
		font-weight: 600;
		color: theme('colors.gray.800');
	}

	.tagline {
		font-size: 0.92rem;
		line-height: 1.55;
		color: theme('colors.gray.500');
	}

	.yil {
		font-family: theme('fontFamily.mono');
		font-size: 0.82rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.qaytish {
		margin-top: 3.5rem;
		font-size: 0.92rem;

		a {
			color: theme('colors.blue.500');

			&:hover {
				color: theme('colors.blue.700');
			}
		}
	}
</style>
