<script lang="ts">
	import { onMount } from 'svelte';
	import Stend from '~/components/darslik/Stend.svelte';
	import Katex from '~/utils/Katex.svelte';
	import { gsap } from '~/utils/gsap';

	// --- formulalar -------------------------------------------------------
	const LN_FORMULA = String.raw`\bar{x}_i = \frac{x_i - \mu}{\sigma}\,\gamma_i + \beta_i`;
	const LN_TARIF = String.raw`\mu = \tfrac{1}{n}\sum_j x_j,\quad \sigma = \sqrt{\tfrac{1}{n}\sum_j (x_j-\mu)^2}`;
	const RMS_FORMULA = String.raw`\bar{x}_i = \frac{x_i}{\mathrm{RMS}(x)}\,\gamma_i`;
	const RMS_TARIF = String.raw`\mathrm{RMS}(x)=\sqrt{\tfrac{1}{n}\sum_j x_j^2}`;

	// --- holat ------------------------------------------------------------
	const N = 8;
	// Boshlangich qiymatlar qatiy: sahifa har safar bir xil ochiladi.
	const BOSHLANGICH: number[] = [1.2, -0.6, 2.1, 0.4, -1.5, 0.9, -0.3, -1.7];

	let baza: number[] = BOSHLANGICH.slice();
	let c = 0; // siljitish
	let s = 1; // kattalashtirish

	let mounted = false;
	let kamHarakat = false;

	type Holat = {
		x: number[];
		ln: number[];
		rms: number[];
		ortacha: number;
		std: number;
		rmsQiymat: number;
		farq: number;
		shkala: number;
	};

	const EPS = 1e-8;
	const CHEGARA = 0.005; // shu qiymatdan kichik farq = "ozgarmadi"

	function vektor(bv: number[], cc: number, ss: number): number[] {
		// avval hamma elementga c qoshiladi, keyin hammasi s ga kopaytiriladi
		return bv.map((v) => (v + cc) * ss);
	}

	function layerNorm(x: number[]) {
		const m = x.reduce((a, b) => a + b, 0) / x.length;
		const d = Math.sqrt(x.reduce((a, b) => a + (b - m) * (b - m), 0) / x.length);
		return { m, d, out: x.map((v) => (v - m) / (d + EPS)) };
	}

	function rmsNorm(x: number[]) {
		const r = Math.sqrt(x.reduce((a, b) => a + b * b, 0) / x.length);
		return { r, out: x.map((v) => v / (r + EPS)) };
	}

	function hisobla(bv: number[], cc: number, ss: number): Holat {
		const x = vektor(bv, cc, ss);
		const L = layerNorm(x);
		const R = rmsNorm(x);
		let farq = 0;
		for (let i = 0; i < x.length; i++) {
			farq = Math.max(farq, Math.abs(L.out[i] - R.out[i]));
		}
		let shkala = 0.5;
		for (let i = 0; i < x.length; i++) shkala = Math.max(shkala, Math.abs(x[i]));
		return {
			x,
			ln: L.out,
			rms: R.out,
			ortacha: L.m,
			std: L.d,
			rmsQiymat: R.r,
			farq,
			shkala
		};
	}

	function maxFarq(a: number[], b: number[]): number {
		let m = 0;
		for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i]));
		return m;
	}

	// --- hozirgi va solishtiruv qiymatlari --------------------------------
	$: nishon = hisobla(baza, c, s);
	// faqat s ning tasirini ajratish uchun: shu c, lekin s = 1
	$: sSiz = hisobla(baza, c, 1);
	// faqat c ning tasirini ajratish uchun: shu s, lekin c = 0
	$: cSiz = hisobla(baza, 0, s);

	$: scaleLn = maxFarq(nishon.ln, sSiz.ln);
	$: scaleRms = maxFarq(nishon.rms, sSiz.rms);
	$: centerLn = maxFarq(nishon.ln, cSiz.ln);
	$: centerRms = maxFarq(nishon.rms, cSiz.rms);

	$: sFaol = Math.abs(s - 1) > 0.001;
	$: cFaol = Math.abs(c) > 0.001;

	// --- animatsiya -------------------------------------------------------
	let hozir: Holat = hisobla(BOSHLANGICH, 0, 1);
	let boshi: Holat = hozir;
	const jarayon = { t: 1 };
	let tween: any = null;

	function aralash(a: Holat, b: Holat, t: number): Holat {
		const l = (p: number, q: number) => p + (q - p) * t;
		return {
			x: a.x.map((v, i) => l(v, b.x[i])),
			ln: a.ln.map((v, i) => l(v, b.ln[i])),
			rms: a.rms.map((v, i) => l(v, b.rms[i])),
			ortacha: l(a.ortacha, b.ortacha),
			std: l(a.std, b.std),
			rmsQiymat: l(a.rmsQiymat, b.rmsQiymat),
			farq: l(a.farq, b.farq),
			shkala: l(a.shkala, b.shkala)
		};
	}

	function qoll(yangi: Holat) {
		if (!mounted || kamHarakat) {
			hozir = yangi;
			return;
		}
		if (tween) tween.kill();
		boshi = hozir;
		jarayon.t = 0;
		const oxir = yangi;
		tween = gsap.to(jarayon, {
			t: 1,
			duration: 0.3,
			ease: 'power2.out',
			onUpdate: () => {
				hozir = aralash(boshi, oxir, jarayon.t);
			},
			onComplete: () => {
				hozir = oxir;
			}
		});
	}

	$: qoll(nishon);

	onMount(() => {
		mounted = true;
		kamHarakat = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		return () => {
			if (tween) tween.kill();
		};
	});

	// --- boshqaruv --------------------------------------------------------
	function yangiVektor() {
		let yangi: number[] = [];
		for (let urinish = 0; urinish < 8; urinish++) {
			yangi = Array.from({ length: N }, () => Math.round((Math.random() * 4 - 2) * 10) / 10);
			const kattalik = yangi.reduce((a, b) => a + Math.abs(b), 0);
			if (kattalik > 2) break;
		}
		baza = yangi;
	}

	// --- geometriya va format ---------------------------------------------
	const YARIM_KIRISH = 56;
	const YARIM_CHIQISH = 48;
	const CHIQISH_SHKALA = 2.6; // chiqish uchun qatiy shkala: invariantlik korinib tursin

	function balandlik(v: number, shkala: number, yarim: number): number {
		return Math.min(1, Math.abs(v) / shkala) * yarim;
	}

	function fmt(v: number, n = 2): string {
		const t = v.toFixed(n);
		return t === '-' + (0).toFixed(n) ? (0).toFixed(n) : t;
	}

	function hukm(d: number): string {
		return d > CHEGARA ? "o'zgardi" : "o'zgarmadi";
	}
</script>

<Stend
	title="LayerNorm va RMSNorm - yonma-yon"
	izoh={"Kattalashtirish (x s) ni suring: ikkala chiqish ham qimirlamaydi. Siljitish (+c) ni suring: LayerNorm chiqishi o'sha-o'sha qoladi, RMSNorm chiqishi biroz siljiydi. Amalda re-centering'ning yo'qolishi sifatga zarar qilmadi - shuning uchun uni tashlab yuborishdi."}
>
	<svelte:fragment slot="boshqaruv">
		<label class="slayder">
			<span class="slayder-nom">Siljitish (+c)</span>
			<input type="range" min="-3" max="3" step="0.1" bind:value={c} aria-label="Siljitish c" />
			<span class="slayder-son">{fmt(c, 1)}</span>
		</label>

		<label class="slayder">
			<span class="slayder-nom">Kattalashtirish (&times;s)</span>
			<input
				type="range"
				min="0.25"
				max="4"
				step="0.05"
				bind:value={s}
				aria-label="Kattalashtirish s"
			/>
			<span class="slayder-son">{fmt(s, 2)}</span>
		</label>

		<button type="button" class="tugma" on:click={yangiVektor}>Yangi vektor</button>
	</svelte:fragment>

	<div class="dm">
		<!-- KIRISH VEKTORI -->
		<section class="kirish">
			<div class="qator-bosh">
				<span class="bosh-nom">Kirish vektori <span class="kursiv">x</span></span>
				<span class="bosh-yon">n = 8 &middot; shkala &plusmn;{fmt(hozir.shkala, 1)}</span>
			</div>
			<div class="bars">
				{#each hozir.x as v, i}
					<div class="ustun">
						<span class="son">{fmt(v, 1)}</span>
						<div class="trek trek-katta">
							<span class="nol" />
							<span
								class="bar kirish-bar"
								class:manfiy={v < 0}
								style="height:{balandlik(v, hozir.shkala, YARIM_KIRISH)}px"
							/>
						</div>
						<span class="indeks">{i}</span>
					</div>
				{/each}
			</div>
		</section>

		<div class="ayri">
			<span class="ayri-chiziq" />
			<span class="ayri-matn">bir xil kirish &rarr; ikki yo'l &middot; demoda &gamma; = 1, &beta; = 0</span>
			<span class="ayri-chiziq" />
		</div>

		<!-- IKKI YOL -->
		<div class="yollar">
			<!-- LayerNorm -->
			<section class="yol eski-yol">
				<header class="yol-bosh">
					<span class="yol-nom">LayerNorm</span>
					<span class="yol-tag">2016</span>
				</header>

				<div class="formula"><Katex math={LN_FORMULA} /></div>
				<div class="tarif"><Katex math={LN_TARIF} /></div>

				<div class="stat">
					<span class="stat-bir">
						<span class="stat-nom">&mu;</span>
						<span class="stat-son">{fmt(hozir.ortacha, 2)}</span>
					</span>
					<span class="stat-bir">
						<span class="stat-nom">&sigma;</span>
						<span class="stat-son">{fmt(hozir.std, 3)}</span>
					</span>
				</div>

				<div class="bars">
					{#each hozir.ln as v}
						<div class="ustun">
							<span class="son kichik-son">{fmt(v, 2)}</span>
							<div class="trek">
								<span class="nol" />
								<span
									class="bar ln-bar"
									class:manfiy={v < 0}
									style="height:{balandlik(v, CHIQISH_SHKALA, YARIM_CHIQISH)}px"
								/>
							</div>
						</div>
					{/each}
				</div>

				<footer class="yol-oyoq">
					<span class="otish">
						<i class="nuqta" /><i class="nuqta" />
						vektor bo'ylab 2 o'tish
					</span>
					<span class="param">&gamma;, &beta;</span>
				</footer>
			</section>

			<!-- RMSNorm -->
			<section class="yol yangi-yol">
				<header class="yol-bosh">
					<span class="yol-nom">RMSNorm</span>
					<span class="yol-tag">2019</span>
				</header>

				<div class="formula"><Katex math={RMS_FORMULA} /></div>
				<div class="tarif"><Katex math={RMS_TARIF} /></div>

				<div class="stat">
					<span class="stat-bir">
						<span class="stat-nom">RMS</span>
						<span class="stat-son">{fmt(hozir.rmsQiymat, 3)}</span>
					</span>
					<span class="stat-bir stat-yoq">
						<span class="stat-nom">&mu;</span>
						<span class="stat-son">hisoblanmaydi</span>
					</span>
				</div>

				<div class="bars">
					{#each hozir.rms as v}
						<div class="ustun">
							<span class="son kichik-son">{fmt(v, 2)}</span>
							<div class="trek">
								<span class="nol" />
								<span
									class="bar rms-bar"
									class:manfiy={v < 0}
									style="height:{balandlik(v, CHIQISH_SHKALA, YARIM_CHIQISH)}px"
								/>
							</div>
						</div>
					{/each}
				</div>

				<footer class="yol-oyoq">
					<span class="otish">
						<i class="nuqta" />
						vektor bo'ylab 1 o'tish
					</span>
					<span class="param">&gamma;</span>
				</footer>
			</section>
		</div>

		<!-- FARQ -->
		<div class="farq">
			<span class="farq-nom">ikki chiqish orasidagi eng katta farq</span>
			<span class="farq-son">max |LN &minus; RMS| = {fmt(hozir.farq, 3)}</span>
		</div>

		<!-- BELGILAR -->
		<div class="belgilar">
			<div class="belgi" class:faol={sFaol}>
				<div class="belgi-bosh">
					<span class="belgi-nom">re-scaling (&times;s)</span>
					<span class="belgi-hukm ha">ikkalasida ham</span>
				</div>
				<div class="chiplar">
					<span class="chip" class:ozgardi={scaleLn > CHEGARA}>
						LN {hukm(scaleLn)} &middot; &Delta;{fmt(scaleLn, 2)}
					</span>
					<span class="chip" class:ozgardi={scaleRms > CHEGARA}>
						RMS {hukm(scaleRms)} &middot; &Delta;{fmt(scaleRms, 2)}
					</span>
				</div>
			</div>

			<div class="belgi" class:faol={cFaol}>
				<div class="belgi-bosh">
					<span class="belgi-nom">re-centering (+c)</span>
					<span class="belgi-hukm yoq">faqat LayerNorm</span>
				</div>
				<div class="chiplar">
					<span class="chip" class:ozgardi={centerLn > CHEGARA}>
						LN {hukm(centerLn)} &middot; &Delta;{fmt(centerLn, 2)}
					</span>
					<span class="chip" class:ozgardi={centerRms > CHEGARA}>
						RMS {hukm(centerRms)} &middot; &Delta;{fmt(centerRms, 2)}
					</span>
				</div>
			</div>
		</div>
	</div>
</Stend>

<style lang="scss">
	.dm {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		min-width: 520px;
	}

	/* ---------- boshqaruv ---------- */
	.slayder {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		cursor: pointer;
	}

	.slayder-nom {
		font-size: 0.74rem;
		letter-spacing: 0.03em;
		color: theme('colors.gray.500');
		white-space: nowrap;
	}

	.slayder input[type='range'] {
		width: 96px;
		accent-color: theme('colors.purple.600');
		cursor: pointer;
	}

	.slayder-son {
		font-family: theme('fontFamily.mono');
		font-size: 0.76rem;
		color: theme('colors.gray.800');
		font-variant-numeric: tabular-nums;
		min-width: 2.6em;
		text-align: right;
	}

	.tugma {
		font-family: theme('fontFamily.mono');
		font-size: 0.76rem;
		padding: 0.28rem 0.65rem;
		border: 1px solid theme('colors.gray.300');
		border-radius: 4px;
		background: white;
		color: theme('colors.gray.600');
		white-space: nowrap;
		transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;

		&:hover {
			border-color: theme('colors.purple.300');
			background: theme('colors.purple.50');
			color: theme('colors.purple.700');
		}
	}

	/* ---------- sarlavha qatorlari ---------- */
	.qator-bosh {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.4rem;
	}

	.bosh-nom {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.84rem;
		font-weight: 500;
		color: theme('colors.gray.700');
	}

	.kursiv {
		font-style: italic;
		color: theme('colors.gray.500');
	}

	.bosh-yon {
		font-family: theme('fontFamily.mono');
		font-size: 0.7rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
	}

	/* ---------- ustunlar ---------- */
	.bars {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: 4px;
	}

	.ustun {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		min-width: 0;
	}

	.son {
		font-family: theme('fontFamily.mono');
		font-size: 0.64rem;
		line-height: 1;
		color: theme('colors.gray.500');
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.kichik-son {
		font-size: 0.6rem;
	}

	.indeks {
		font-family: theme('fontFamily.mono');
		font-size: 0.58rem;
		color: theme('colors.gray.300');
		font-variant-numeric: tabular-nums;
	}

	.trek {
		position: relative;
		width: 100%;
		height: 96px;
	}

	.trek-katta {
		height: 112px;
	}

	.nol {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 1px;
		background: theme('colors.gray.200');
	}

	.bar {
		position: absolute;
		left: 50%;
		width: 58%;
		transform: translateX(-50%);
		bottom: 50%;
		border-radius: 2px 2px 0 0;
	}

	.bar.manfiy {
		bottom: auto;
		top: 50%;
		border-radius: 0 0 2px 2px;
	}

	.kirish-bar {
		background: theme('colors.gray.600');
	}

	.ln-bar {
		background: theme('colors.gray.400');
	}

	.rms-bar {
		background: theme('colors.purple.600');
	}

	/* ---------- ayirgich ---------- */
	.ayri {
		display: flex;
		align-items: center;
		gap: 0.7rem;
	}

	.ayri-chiziq {
		flex: 1;
		height: 1px;
		background: theme('colors.gray.200');
	}

	.ayri-matn {
		font-family: theme('fontFamily.mono');
		font-size: 0.68rem;
		color: theme('colors.gray.400');
		white-space: nowrap;
	}

	/* ---------- ikki yol ---------- */
	.yollar {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.9rem;
	}

	.yol {
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		padding: 0.8rem 0.75rem 0.65rem;
		min-width: 0;
	}

	.yangi-yol {
		border-color: theme('colors.purple.200');
		background: theme('colors.purple.50');
	}

	.yol-bosh {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.yol-nom {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.98rem;
		font-weight: 600;
	}

	.eski-yol .yol-nom {
		color: theme('colors.gray.500');
	}

	.yangi-yol .yol-nom {
		color: theme('colors.purple.700');
	}

	.yol-tag {
		font-family: theme('fontFamily.mono');
		font-size: 0.68rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
	}

	.formula {
		color: theme('colors.gray.800');
		overflow-x: auto;
		padding-bottom: 0.15rem;
	}

	.formula :global(.katex) {
		font-size: 0.92rem;
	}

	.tarif {
		color: theme('colors.gray.400');
		margin-top: 0.25rem;
		overflow-x: auto;
		padding-bottom: 0.15rem;
	}

	.tarif :global(.katex) {
		font-size: 0.7rem;
	}

	.stat {
		display: flex;
		flex-wrap: wrap;
		gap: 0.9rem;
		margin: 0.6rem 0;
		padding: 0.35rem 0.55rem;
		background: white;
		border: 1px solid theme('colors.gray.200');
		border-radius: 4px;
	}

	.stat-bir {
		display: inline-flex;
		align-items: baseline;
		gap: 0.35rem;
	}

	.stat-nom {
		font-size: 0.72rem;
		color: theme('colors.gray.400');
	}

	.stat-son {
		font-family: theme('fontFamily.mono');
		font-size: 0.78rem;
		color: theme('colors.gray.800');
		font-variant-numeric: tabular-nums;
	}

	.stat-yoq .stat-son {
		font-size: 0.7rem;
		color: theme('colors.gray.300');
		text-decoration: line-through;
	}

	.yol-oyoq {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.6rem;
		padding-top: 0.5rem;
		border-top: 1px dashed theme('colors.gray.200');
		font-size: 0.7rem;
		color: theme('colors.gray.500');
	}

	.otish {
		display: inline-flex;
		align-items: center;
		gap: 0.15rem;
	}

	.nuqta {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		margin-right: 2px;
	}

	.eski-yol .nuqta {
		background: theme('colors.gray.400');
	}

	.yangi-yol .nuqta {
		background: theme('colors.purple.500');
	}

	.param {
		font-family: theme('fontFamily.mono');
		font-size: 0.72rem;
		color: theme('colors.gray.500');
		white-space: nowrap;
	}

	/* ---------- farq ---------- */
	.farq {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.6rem;
		flex-wrap: wrap;
	}

	.farq-nom {
		font-size: 0.74rem;
		color: theme('colors.gray.400');
	}

	.farq-son {
		font-family: theme('fontFamily.mono');
		font-size: 0.82rem;
		color: theme('colors.gray.800');
		font-variant-numeric: tabular-nums;
	}

	/* ---------- belgilar ---------- */
	.belgilar {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.7rem;
	}

	.belgi {
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		padding: 0.5rem 0.65rem 0.55rem;
		background: white;
		transition: border-color 0.25s ease, background 0.25s ease;
	}

	.belgi.faol {
		border-color: theme('colors.purple.300');
		background: theme('colors.purple.50');
	}

	.belgi-bosh {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.35rem;
	}

	.belgi-nom {
		font-family: theme('fontFamily.mono');
		font-size: 0.72rem;
		color: theme('colors.gray.700');
	}

	.belgi-hukm {
		font-size: 0.68rem;
		white-space: nowrap;
	}

	.belgi-hukm.ha {
		color: theme('colors.purple.600');
	}

	.belgi-hukm.yoq {
		color: theme('colors.gray.400');
	}

	.chiplar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.chip {
		font-family: theme('fontFamily.mono');
		font-size: 0.66rem;
		padding: 0.16rem 0.4rem;
		border-radius: 3px;
		background: theme('colors.gray.100');
		color: theme('colors.gray.500');
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		transition: background 0.25s ease, color 0.25s ease;
	}

	.chip.ozgardi {
		background: theme('colors.purple.100');
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	@media (prefers-reduced-motion: reduce) {
		.belgi,
		.chip,
		.tugma {
			transition: none;
		}
	}
</style>
