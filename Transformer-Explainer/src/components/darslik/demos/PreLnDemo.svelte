<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gsap } from '~/utils/gsap';
	import Stend from '~/components/darslik/Stend.svelte';
	import Swap from '~/components/darslik/Swap.svelte';
	import Katex from '~/utils/Katex.svelte';

	// ---------------------------------------------------------------- ranglar
	const GRAY_400 = '#9ca3af';
	const GRAY_500 = '#6b7280';
	const GRAY_300 = '#d1d5db';
	const GRAY_200 = '#e5e7eb';
	const GRAY_100 = '#f3f4f6';
	const GRAY_50 = '#f9fafb';
	const GRAY_700 = '#374151';
	const PURPLE_600 = '#9333ea';
	const PURPLE_700 = '#7e22ce';
	const PURPLE_50 = '#faf5ff';

	const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

	function hex(c: string) {
		return [
			parseInt(c.slice(1, 3), 16),
			parseInt(c.slice(3, 5), 16),
			parseInt(c.slice(5, 7), 16)
		];
	}

	function mix(c1: string, c2: string, t: number) {
		const a = hex(c1);
		const b = hex(c2);
		const r = Math.round(lerp(a[0], b[0], t));
		const g = Math.round(lerp(a[1], b[1], t));
		const bl = Math.round(lerp(a[2], b[2], t));
		return `rgb(${r},${g},${bl})`;
	}

	// ---------------------------------------------------------------- holat
	let variant = 'post';
	let qavat = 12;
	let tv = 0; // 0 = Post-LN, 1 = Pre-LN
	let head = 2; // gradient impulsining joylashuvi (2 = impuls yo'q)
	let mounted = false;
	let reduceMotion = false;

	const tw = { v: 0 };
	const pw = { h: 2 };
	let variantTween: { kill: () => void } | null = null;
	let pulseTween: { kill: () => void } | null = null;

	const IZOH_POST = `har qavat LN uni qayta masshtablaydi - pastga deyarli hech narsa qolmaydi`;
	const IZOH_PRE = `toza residual yo'l gradientni deyarli yo'qotmay pastga o'tkazadi`;

	function goTo(target: number) {
		if (variantTween) variantTween.kill();
		variantTween = gsap.to(tw, {
			v: target,
			duration: reduceMotion ? 0.001 : 0.55,
			ease: 'power2.out',
			onUpdate: () => (tv = tw.v)
		});
	}

	function yubor() {
		if (pulseTween) pulseTween.kill();
		pw.h = -0.16;
		head = pw.h;
		pulseTween = gsap.to(pw, {
			h: 1.16,
			duration: reduceMotion ? 0.001 : 1.5,
			ease: 'none',
			onUpdate: () => (head = pw.h),
			onComplete: () => (head = 2)
		});
	}

	onMount(() => {
		reduceMotion =
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		mounted = true;
	});

	onDestroy(() => {
		if (variantTween) variantTween.kill();
		if (pulseTween) pulseTween.kill();
	});

	$: if (mounted) goTo(variant === 'pre' ? 1 : 0);

	// ---------------------------------------------------- A qismi: geometriya
	const MAIN_Y = 165;
	const BR_Y = 72;
	const SPLIT_X = 80;
	const PLUS_X = 320;
	const PLUS_R = 14;
	const IN_X = 36;
	const OUT_X = 492;

	const ATT_W = 92;
	const ATT_H = 40;
	const LN_W = 58;
	const LN_H = 34;

	// LN quti Post-LN'da asosiy chiziq ustida (+) dan keyin,
	// Pre-LN'da residual shoxining ichida, Attention'dan oldin turadi.
	const LN_POST_X = 398;
	const LN_PRE_X = 146;
	const ATT_POST_X = 200;
	const ATT_PRE_X = 238;

	const BRANCH =
		'M 80 165 C 80 105 84 72 112 72 L 288 72 C 316 72 320 105 320 151';

	$: accent = mix(GRAY_400, PURPLE_600, tv);
	$: resW = lerp(2, 4.6, tv);
	$: lnX = lerp(LN_POST_X, LN_PRE_X, tv);
	$: lnY = lerp(MAIN_Y, BR_Y, tv);
	$: attX = lerp(ATT_POST_X, ATT_PRE_X, tv);
	$: lnStroke = mix(GRAY_400, PURPLE_600, tv);
	$: lnFill = mix(GRAY_50, PURPLE_50, tv);
	$: lnLabel = mix(GRAY_700, PURPLE_700, tv);

	// ------------------------------------------------- B qismi: gradient oqimi
	// Sxematik model: Post-LN'da har qavat gradientni r marta kichraytiradi,
	// Pre-LN'da toza residual yo'l uni deyarli o'zgarishsiz o'tkazadi.
	const R_POST = 0.82;
	const R_PRE = 0.999;

	const BAR_X = 114;
	const BAR_W = 520;
	const BLOK_X = 48;
	const BLOK_W = 56;
	const PCT_X = 644;
	const TOP_PAD = 26;

	type Qator = { k: number; g: number; pos: number; y: number };

	$: rowH = Math.min(22, Math.max(5, 300 / qavat));
	$: stackH = qavat * rowH;
	$: svgH = TOP_PAD + stackH + 26;
	$: yozuvBor = rowH >= 12;

	$: qatorlar = ((n: number, t: number, h: number) => {
		const out: Qator[] = [];
		for (let i = 0; i < n; i++) {
			const gPost = Math.pow(R_POST, i);
			const gPre = Math.pow(R_PRE, i);
			out.push({
				k: n - i,
				g: gPost + (gPre - gPost) * t,
				pos: n > 1 ? i / (n - 1) : 0,
				y: TOP_PAD + i * h
			});
		}
		return out;
	})(qavat, tv, rowH);

	$: flash = qatorlar.map((r) => Math.max(0, 1 - Math.abs(r.pos - head) / 0.13));
	$: pastki = qatorlar.length ? qatorlar[qatorlar.length - 1].g : 1;
	$: frontY = TOP_PAD + Math.min(1, Math.max(0, head)) * stackH;
	$: izohMatn = variant === 'pre' ? IZOH_PRE : IZOH_POST;

	function pctText(g: number) {
		const p = g * 100;
		if (p >= 10) return p.toFixed(0) + '%';
		if (p >= 1) return p.toFixed(1) + '%';
		if (p >= 0.01) return p.toFixed(2) + '%';
		if (p > 0) return '<0.01%';
		return '0%';
	}
</script>

<Stend
	title="Normalizatsiya qayerda turadi"
	izoh="Raqamlar sxematik - maqsad tendensiyani ko'rsatish, aniq qiymat berish emas. Model oddiy: Post-LN'da har qavat gradientni ~0.82 marta kichraytiradi, Pre-LN'da toza residual yo'l uni deyarli o'zgarishsiz o'tkazadi."
>
	<svelte:fragment slot="boshqaruv">
		<Swap
			label="Tartib"
			bind:value={variant}
			options={[
				{ id: 'post', label: 'Post-LN' },
				{ id: 'pre', label: 'Pre-LN' }
			]}
		/>
		<label class="slayder">
			<span class="slayder-nom">Qavatlar soni</span>
			<input type="range" min="6" max="64" step="1" bind:value={qavat} />
			<span class="slayder-son">{qavat}</span>
		</label>
	</svelte:fragment>

	<div class="ildiz">
		<!-- ============================ A qismi: blok diagrammasi ============= -->
		<div class="qism-a">
			<svg viewBox="0 0 520 245" role="img" aria-label="Transformer blokida LN qutisining o'rni">
				<!-- residual shox (Attention yo'li) -->
				<path
					d={BRANCH}
					fill="none"
					stroke={GRAY_400}
					stroke-width="1.6"
					stroke-linecap="round"
				/>
				<polygon points="314,141 320,152 326,141" fill={GRAY_400} />

				<!-- asosiy residual chiziq -->
				<line
					x1={IN_X}
					y1={MAIN_Y}
					x2={PLUS_X - PLUS_R}
					y2={MAIN_Y}
					stroke={accent}
					stroke-width={resW}
					stroke-linecap="round"
				/>
				<line
					x1={PLUS_X + PLUS_R}
					y1={MAIN_Y}
					x2={OUT_X}
					y2={MAIN_Y}
					stroke={accent}
					stroke-width={resW}
					stroke-linecap="round"
				/>
				<polygon points="492,158 503,165 492,172" fill={accent} />
				<circle cx={SPLIT_X} cy={MAIN_Y} r="3.4" fill={accent} />

				<!-- kirish / chiqish yozuvlari -->
				<text class="tag" x="20" y={MAIN_Y + 5} text-anchor="end" fill={GRAY_700}>x</text>
				<text class="mayda" x="503" y={MAIN_Y - 14} text-anchor="end" fill={GRAY_500}>chiqish</text>

				<!-- "toza yo'l" yozuvi: faqat Pre-LN'da -->
				<text
					class="mayda"
					x="150"
					y={MAIN_Y + 22}
					text-anchor="middle"
					fill={PURPLE_700}
					opacity={tv}
				>
					toza yo'l (identity)
				</text>

				<!-- (+) tuguni -->
				<circle cx={PLUS_X} cy={MAIN_Y} r={PLUS_R} fill="#ffffff" stroke={GRAY_400} stroke-width="1.6" />
				<text class="tag" x={PLUS_X} y={MAIN_Y + 5} text-anchor="middle" fill={GRAY_700}>+</text>

				<!-- Attention quti -->
				<g>
					<rect
						x={attX - ATT_W / 2}
						y={BR_Y - ATT_H / 2}
						width={ATT_W}
						height={ATT_H}
						rx="5"
						fill={GRAY_50}
						stroke={GRAY_300}
						stroke-width="1.4"
					/>
					<text class="quti" x={attX} y={BR_Y + 4} text-anchor="middle" fill={GRAY_700}>
						Attention
					</text>
				</g>

				<!-- LN quti: GSAP bilan siljiydigan yagona element -->
				<g>
					<rect
						x={lnX - LN_W / 2}
						y={lnY - LN_H / 2}
						width={LN_W}
						height={LN_H}
						rx="5"
						fill={lnFill}
						stroke={lnStroke}
						stroke-width="1.8"
					/>
					<text class="quti" x={lnX} y={lnY + 4} text-anchor="middle" fill={lnLabel}>LN</text>
				</g>
			</svg>

			<div class="formulalar">
				<div class="karta" class:faol={variant === 'post'}>
					<span class="karta-nom">Post-LN <em>2017</em></span>
					<Katex math={String.raw`x_{l+1} = \mathrm{LN}(x_l + F(x_l))`} />
					<p>LN qo'shishdan keyin turadi - residual yo'l har qavatda qayta masshtablanadi.</p>
				</div>
				<div class="karta" class:faol={variant === 'pre'}>
					<span class="karta-nom">Pre-LN <em>2020</em></span>
					<Katex math={String.raw`x_{l+1} = x_l + F(\mathrm{LN}(x_l))`} />
					<p>LN shox ichiga kiradi - <strong>x</strong> chiqishgacha teginilmay boradi.</p>
				</div>
			</div>
		</div>

		<div class="ajratgich"></div>

		<!-- ============================ B qismi: gradient oqimi =============== -->
		<div class="qism-b">
			<div class="b-bosh">
				<h4>Gradient chuqurlikka qanchalik yetadi</h4>
				<button type="button" class="tugma" on:click={yubor}>Gradientni yubor</button>
			</div>

			<div class="b-canvas">
				<svg viewBox="0 0 760 {svgH}" role="img" aria-label="Qavatlar bo'ylab gradient kattaligi">
					<text class="mayda" x={BLOK_X} y="15" fill={GRAY_500}>
						chiqishga yaqin - {qavat}-qavat
					</text>
					<text class="mayda" x={PCT_X + 56} y="15" text-anchor="end" fill={GRAY_500}>
						gradient kattaligi
					</text>

					{#each qatorlar as r, i (r.k)}
						<g>
							{#if flash[i] > 0}
								<rect
									x={BLOK_X}
									y={r.y}
									width={BAR_X + BAR_W - BLOK_X}
									height={rowH}
									fill={accent}
									opacity={0.17 * flash[i]}
								/>
							{/if}
							<rect
								x={BLOK_X}
								y={r.y + 1}
								width={BLOK_W}
								height={Math.max(2, rowH - 2)}
								rx="2"
								fill={flash[i] > 0 ? mix('#ffffff', PURPLE_50, flash[i]) : '#ffffff'}
								stroke={GRAY_200}
								stroke-width="1"
							/>
							<rect
								x={BAR_X}
								y={r.y + 1.5}
								width={BAR_W}
								height={Math.max(2, rowH - 3)}
								rx="1.5"
								fill={GRAY_100}
							/>
							<rect
								x={BAR_X}
								y={r.y + 1.5}
								width={Math.max(0, BAR_W * r.g)}
								height={Math.max(2, rowH - 3)}
								rx="1.5"
								fill={accent}
							/>
							{#if yozuvBor || i === 0 || i === qatorlar.length - 1}
								<text
									class="mayda"
									x={BLOK_X - 8}
									y={r.y + rowH / 2 + 3.5}
									text-anchor="end"
									fill={GRAY_500}
								>
									{r.k}
								</text>
								<text
									class="mayda son"
									x={PCT_X}
									y={r.y + rowH / 2 + 3.5}
									fill={i === qatorlar.length - 1 ? lnLabel : GRAY_500}
								>
									{pctText(r.g)}
								</text>
							{/if}
						</g>
					{/each}

					{#if head >= -0.16 && head <= 1.16}
						<line
							x1={BLOK_X - 4}
							y1={frontY}
							x2={BAR_X + BAR_W + 4}
							y2={frontY}
							stroke={accent}
							stroke-width="1.6"
							opacity="0.55"
						/>
					{/if}

					<text class="mayda" x={BLOK_X} y={TOP_PAD + stackH + 17} fill={GRAY_500}>
						kirishga yaqin - 1-qavat
					</text>
				</svg>
			</div>

			<div class="okr" style="border-color:{mix(GRAY_200, PURPLE_600, tv)}">
				<span class="okr-nom">1-qavatga yetgan gradient</span>
				<span class="okr-son" style="color:{lnLabel}">{pctText(pastki)}</span>
				<span class="okr-izoh">{izohMatn}</span>
			</div>
		</div>
	</div>
</Stend>

<style lang="scss">
	.ildiz {
		min-width: 720px;
	}

	// -------------------------------------------------------------- boshqaruv
	.slayder {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.slayder-nom {
		font-size: 0.78rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: theme('colors.gray.400');
		white-space: nowrap;
	}

	.slayder input[type='range'] {
		width: 132px;
		accent-color: theme('colors.purple.600');
		cursor: pointer;
	}

	.slayder-son {
		font-family: theme('fontFamily.mono');
		font-variant-numeric: tabular-nums;
		font-size: 0.85rem;
		color: theme('colors.purple.700');
		min-width: 2ch;
		text-align: right;
	}

	// ---------------------------------------------------------------- A qismi
	.qism-a {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 258px;
		gap: 1.5rem;
		align-items: center;
	}

	.qism-a svg {
		width: 100%;
		height: auto;
		display: block;
	}

	svg :global(text) {
		font-family: theme('fontFamily.mono');
		font-variant-numeric: tabular-nums;
	}

	.tag {
		font-size: 15px;
		font-weight: 600;
	}

	.quti {
		font-size: 13px;
		font-weight: 600;
	}

	.mayda {
		font-size: 11px;
	}

	.son {
		font-size: 10.5px;
	}

	.formulalar {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.karta {
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		padding: 0.7rem 0.8rem;
		background: white;
		transition: border-color 0.3s ease, background 0.3s ease, opacity 0.3s ease;
		opacity: 0.5;
	}

	.karta.faol {
		opacity: 1;
		border-color: theme('colors.purple.300');
		background: theme('colors.purple.50');
	}

	.karta-nom {
		display: block;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: theme('colors.gray.500');
		margin-bottom: 0.45rem;

		em {
			font-style: normal;
			color: theme('colors.gray.400');
			font-variant-numeric: tabular-nums;
		}
	}

	.karta :global(.katex) {
		font-size: 0.92rem;
		color: theme('colors.gray.800');
	}

	.karta p {
		margin-top: 0.5rem;
		font-size: 0.78rem;
		line-height: 1.5;
		color: theme('colors.gray.500');
	}

	.karta.faol p strong {
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.ajratgich {
		height: 1px;
		background: theme('colors.gray.100');
		margin: 1.5rem 0 1.25rem;
	}

	// ---------------------------------------------------------------- B qismi
	.b-bosh {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.9rem;
	}

	.b-bosh h4 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.82rem;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		color: theme('colors.gray.500');
	}

	.tugma {
		font-family: theme('fontFamily.mono');
		font-size: 0.8rem;
		padding: 0.35rem 0.8rem;
		border: 1px solid theme('colors.purple.300');
		border-radius: 5px;
		background: white;
		color: theme('colors.purple.700');
		white-space: nowrap;
		transition: background 0.15s ease, border-color 0.15s ease;

		&:hover {
			background: theme('colors.purple.50');
			border-color: theme('colors.purple.600');
		}
	}

	.b-canvas svg {
		width: 100%;
		height: auto;
		display: block;
	}

	.okr {
		display: flex;
		align-items: baseline;
		gap: 0.7rem;
		flex-wrap: wrap;
		margin-top: 1rem;
		padding: 0.7rem 0.9rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		background: theme('colors.gray.50');
		transition: border-color 0.3s ease;
	}

	.okr-nom {
		font-size: 0.8rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: theme('colors.gray.500');
	}

	.okr-son {
		font-family: theme('fontFamily.mono');
		font-variant-numeric: tabular-nums;
		font-size: 1.35rem;
		font-weight: 600;
		min-width: 5ch;
	}

	.okr-izoh {
		font-size: 0.8rem;
		color: theme('colors.gray.500');
	}

	@media (prefers-reduced-motion: reduce) {
		.karta,
		.tugma,
		.okr {
			transition: none;
		}
	}
</style>
