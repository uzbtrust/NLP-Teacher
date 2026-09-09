<script lang="ts">
	import Stend from '~/components/darslik/Stend.svelte';
	import Swap from '~/components/darslik/Swap.svelte';
	import Katex from '~/utils/Katex.svelte';

	// --- formulalar -------------------------------------------------------
	const GELU_F = String.raw`\mathrm{FFN}(x) = W_2\,\mathrm{GELU}(W_1 x)`;
	const SWIGLU_F = String.raw`\mathrm{FFN}(x) = W_2\big(\mathrm{SiLU}(W_g x) \odot W_1 x\big)`;
	const SILU_F = String.raw`\mathrm{SiLU}(z) = z\,\sigma(z)`;

	// --- holat ------------------------------------------------------------
	let variant: string = 'swiglu';
	let x = 1.2;
	let wg = 1;
	let wu = 1;

	const variantlar = [
		{ id: 'gelu', label: 'GELU MLP' },
		{ id: 'swiglu', label: 'SwiGLU' }
	];

	// --- matematika -------------------------------------------------------
	const silu = (z: number) => z / (1 + Math.exp(-z));
	const gelu = (z: number) =>
		0.5 * z * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (z + 0.044715 * z * z * z)));

	const fmt = (v: number, n = 2) => (Object.is(v, -0) ? 0 : v).toFixed(n);

	$: gate = silu(wg * x);
	$: value = wu * x;
	$: chiqish = gate * value;

	// GELU MLP yolida eshik yoq: chiqish bevosita aktivatsiyadan chiqadi
	$: geluChiqish = gelu(wu * x);

	// --- grafik -----------------------------------------------------------
	const G_W = 380;
	const G_H = 190;
	const X_MIN = -4;
	const X_MAX = 4;
	const Y_MIN = -0.6;
	const Y_MAX = 4;

	const px = (v: number) => 34 + ((v - X_MIN) / (X_MAX - X_MIN)) * (G_W - 50);
	const py = (v: number) => G_H - 26 - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * (G_H - 46);

	function egri(f: (z: number) => number): string {
		const nuqtalar: string[] = [];
		for (let i = 0; i <= 160; i++) {
			const v = X_MIN + ((X_MAX - X_MIN) * i) / 160;
			nuqtalar.push(`${px(v).toFixed(1)},${py(f(v)).toFixed(1)}`);
		}
		return 'M' + nuqtalar.join(' L');
	}

	const GELU_EGRI = egri(gelu);
	const SILU_EGRI = egri(silu);

	// --- darvoza (eshik) --------------------------------------------------
	// Eshik ochilishi: gate qiymati 0 dan uzoqlashgani sari kengayadi.
	const DARVOZA_H = 84;
	$: ochilish = Math.min(1, Math.abs(gate) / 2.5);
	$: teshik = Math.max(2, ochilish * DARVOZA_H);
	$: yopiq = Math.abs(gate) < 0.08;
</script>

<Stend
	title="FFN yo'li: bitta yo'l va ikki yo'l"
	izoh="Yuqorida — butun FFN blokining sxemasi. Pastda — bitta neyron ustidagi jonli hisob: eshik (gate) qanchalik ochilsa, qiymat (value) shunchalik o'tadi."
>
	<svelte:fragment slot="boshqaruv">
		<Swap label="FFN" bind:value={variant} options={variantlar} />
		<label class="slayder">
			<span class="slayder-nom">kirish x</span>
			<input type="range" min="-4" max="4" step="0.05" bind:value={x} aria-label="kirish x" />
			<span class="slayder-son">{fmt(x, 2)}</span>
		</label>
		<label class="slayder">
			<span class="slayder-nom">w<sub>g</sub></span>
			<input type="range" min="-2" max="2" step="0.05" bind:value={wg} aria-label="eshik ogirligi" />
			<span class="slayder-son">{fmt(wg, 2)}</span>
		</label>
		<label class="slayder">
			<span class="slayder-nom">w<sub>u</sub></span>
			<input type="range" min="-2" max="2" step="0.05" bind:value={wu} aria-label="qiymat ogirligi" />
			<span class="slayder-son">{fmt(wu, 2)}</span>
		</label>
	</svelte:fragment>

	<div class="swiglu">
		<!-- ============ A: blok sxemasi ============ -->
		<div class="dia-wrap">
			<svg class="dia" class:faol={variant === 'gelu'} viewBox="0 0 660 200" role="img"
				aria-label="GELU MLP yoli: W_up, GELU, W_down">
				<g class="chiziq">
					<line x1="42" y1="100" x2="76" y2="100" />
					<line x1="196" y1="100" x2="226" y2="100" />
					<line x1="346" y1="100" x2="376" y2="100" />
					<line x1="496" y1="100" x2="526" y2="100" />
				</g>
				<text class="uch" x="26" y="105">x</text>
				<g class="quti">
					<rect x="78" y="78" width="118" height="44" rx="5" />
					<rect x="228" y="78" width="118" height="44" rx="5" />
					<rect x="378" y="78" width="118" height="44" rx="5" />
				</g>
				<text class="quti-nom" x="137" y="105">W_up</text>
				<text class="quti-nom" x="287" y="105">GELU</text>
				<text class="quti-nom" x="437" y="105">W_down</text>
				<text class="uch" x="536" y="105">chiqish</text>
				<text class="izoh" x="287" y="142">bitta yo'l, bitta qaror</text>
			</svg>

			<svg class="dia" class:faol={variant === 'swiglu'} viewBox="0 0 660 200" role="img"
				aria-label="SwiGLU yoli: W_gate va SiLU eshigi, W_up qiymati, ularning kopaytmasi">
				<g class="chiziq">
					<line x1="42" y1="100" x2="58" y2="100" />
					<path d="M58 100 L68 100 L68 62 L76 62" />
					<path d="M58 100 L68 100 L68 138 L76 138" />
					<line x1="182" y1="62" x2="208" y2="62" />
					<path class="shox-gate" d="M302 62 L318 62 L318 92" />
					<path class="shox-val" d="M182 138 L318 138 L318 108" />
					<line x1="333" y1="100" x2="390" y2="100" />
					<line x1="502" y1="100" x2="528" y2="100" />
				</g>
				<text class="uch" x="26" y="105">x</text>
				<g class="quti">
					<rect x="78" y="42" width="104" height="40" rx="5" />
					<rect x="208" y="42" width="94" height="40" rx="5" />
					<rect x="78" y="118" width="104" height="40" rx="5" />
					<rect x="392" y="80" width="110" height="40" rx="5" />
				</g>
				<text class="quti-nom" x="130" y="67">W_gate</text>
				<text class="quti-nom" x="255" y="67">SiLU</text>
				<text class="quti-nom" x="130" y="143">W_up</text>
				<text class="quti-nom" x="447" y="105">W_down</text>
				<circle class="tugun" cx="318" cy="100" r="15" />
				<text class="tugun-nom" x="318" y="106">&#8857;</text>
				<text class="uch" x="538" y="105">chiqish</text>
				<text class="shox-yoz gate-yoz" x="130" y="28">eshik (gate)</text>
				<text class="shox-yoz val-yoz" x="130" y="178">qiymat (value)</text>
			</svg>
		</div>

		<div class="formula">
			<Katex math={variant === 'swiglu' ? SWIGLU_F : GELU_F} />
			{#if variant === 'swiglu'}
				<span class="formula-yon"><Katex math={SILU_F} /></span>
			{/if}
		</div>

		<!-- ============ B: bitta neyron ============ -->
		<div class="ost">
			<!-- egri chiziqlar -->
			<div class="blok">
				<p class="blok-nom">Aktivatsiya egri chiziqlari</p>
				<svg viewBox={`0 0 ${G_W} ${G_H}`} role="img" aria-label="GELU va SiLU egri chiziqlari">
					<line class="oq" x1="30" y1={py(0)} x2={G_W - 12} y2={py(0)} />
					<line class="oq" x1={px(0)} y1="12" x2={px(0)} y2={G_H - 20} />
					<path class="egri gelu-egri" d={GELU_EGRI} />
					<path class="egri silu-egri" d={SILU_EGRI} />
					<line class="kursor" x1={px(x)} y1="12" x2={px(x)} y2={G_H - 20} />
					<circle class="nuqta gelu-nuqta" cx={px(x)} cy={py(gelu(x))} r="4" />
					<circle class="nuqta silu-nuqta" cx={px(x)} cy={py(silu(x))} r="4" />
					<text class="belgi gelu-yoz" x={G_W - 18} y="30">GELU</text>
					<text class="belgi silu-yoz" x={G_W - 18} y="48">SiLU</text>
					<text class="oq-yoz" x={px(x)} y={G_H - 6}>x = {fmt(x, 2)}</text>
				</svg>
			</div>

			<!-- eshik -->
			<div class="blok">
				<p class="blok-nom">
					{variant === 'swiglu' ? 'Eshik qanchalik ochiq' : `Eshik yo'q - signal to'g'ridan-to'g'ri o'tadi`}
				</p>
				<svg viewBox="0 0 320 190" role="img" aria-label="Eshik vizualizatsiyasi">
					{#if variant === 'swiglu'}
						<rect
							class="tasma kirish-tasma"
							x="8"
							y={100 - Math.max(3, Math.min(60, Math.abs(value) * 9)) / 2}
							width="82"
							height={Math.max(3, Math.min(60, Math.abs(value) * 9))}
							rx="2"
						/>
						<rect class="ramka" x="90" y="58" width="140" height="84" rx="4" />
						<rect class="parda" x="90" y="58" width="140" height={(84 - teshik) / 2} />
						<rect
							class="parda"
							x="90"
							y={142 - (84 - teshik) / 2}
							width="140"
							height={(84 - teshik) / 2}
						/>
						<rect
							class="tasma chiqish-tasma"
							x="230"
							y={100 - Math.max(0.6, Math.min(60, Math.abs(chiqish) * 9)) / 2}
							width="82"
							height={Math.max(0.6, Math.min(60, Math.abs(chiqish) * 9))}
							rx="2"
						/>
						<text class="tasma-yoz" x="49" y="168">value {fmt(value, 2)}</text>
						<text class="darvoza-yoz" x="160" y="168">gate {fmt(gate, 2)}</text>
						<text class="tasma-yoz chiq-yoz" x="271" y="168">{fmt(chiqish, 2)}</text>
						{#if yopiq}
							<text class="ogoh" x="160" y="34">eshik yopiq — signal o'tmaydi</text>
						{/if}
					{:else}
						<rect
							class="tasma kirish-tasma"
							x="8"
							y={100 - Math.max(3, Math.min(60, Math.abs(value) * 9)) / 2}
							width="140"
							height={Math.max(3, Math.min(60, Math.abs(value) * 9))}
							rx="2"
						/>
						<rect class="ramka" x="148" y="72" width="24" height="56" rx="4" />
						<text class="darvoza-yoz" x="160" y="168">GELU</text>
						<rect
							class="tasma chiqish-tasma"
							x="172"
							y={100 - Math.max(0.6, Math.min(60, Math.abs(geluChiqish) * 9)) / 2}
							width="140"
							height={Math.max(0.6, Math.min(60, Math.abs(geluChiqish) * 9))}
							rx="2"
						/>
						<text class="tasma-yoz" x="78" y="168">kirish {fmt(value, 2)}</text>
						<text class="tasma-yoz chiq-yoz" x="242" y="168">{fmt(geluChiqish, 2)}</text>
					{/if}
				</svg>
			</div>
		</div>

		<!-- raqamlar -->
		<div class="hisob">
			{#if variant === 'swiglu'}
				<span class="hisob-el">
					<span class="k">gate = SiLU(w<sub>g</sub>&middot;x)</span>
					<span class="v gate-v">{fmt(gate, 3)}</span>
				</span>
				<span class="amal">&times;</span>
				<span class="hisob-el">
					<span class="k">value = w<sub>u</sub>&middot;x</span>
					<span class="v val-v">{fmt(value, 3)}</span>
				</span>
				<span class="amal">=</span>
				<span class="hisob-el">
					<span class="k">chiqish</span>
					<span class="v chiq-v">{fmt(chiqish, 3)}</span>
				</span>
			{:else}
				<span class="hisob-el">
					<span class="k">kirish = w<sub>u</sub>&middot;x</span>
					<span class="v val-v">{fmt(value, 3)}</span>
				</span>
				<span class="amal">&rarr;</span>
				<span class="hisob-el">
					<span class="k">GELU(kirish)</span>
					<span class="v chiq-v">{fmt(geluChiqish, 3)}</span>
				</span>
				<span class="eslatma">bu yerda ikkinchi yo'l yo'q — chiqishni faqat bitta chiziqli funksiya belgilaydi</span>
			{/if}
		</div>
	</div>
</Stend>

<style lang="scss">
	.swiglu {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		min-width: 620px;
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
		width: 88px;
		accent-color: theme('colors.purple.600');
		cursor: pointer;
	}

	.slayder-son {
		font-family: theme('fontFamily.mono');
		font-size: 0.76rem;
		color: theme('colors.gray.800');
		font-variant-numeric: tabular-nums;
		min-width: 2.9em;
		text-align: right;
	}

	/* ---------- sxema ---------- */
	.dia-wrap {
		position: relative;
		width: 100%;
		height: 200px;
	}

	.dia {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		transform: translateY(6px);
		transition: opacity 0.35s ease, transform 0.35s ease;
		pointer-events: none;
	}

	.dia.faol {
		opacity: 1;
		transform: none;
	}

	.chiziq line,
	.chiziq path {
		stroke: theme('colors.gray.300');
		stroke-width: 1.5;
		fill: none;
	}

	.chiziq .shox-gate {
		stroke: theme('colors.purple.400');
	}

	.chiziq .shox-val {
		stroke: theme('colors.gray.400');
	}

	.quti rect {
		fill: white;
		stroke: theme('colors.gray.300');
		stroke-width: 1;
	}

	.quti-nom {
		font-family: theme('fontFamily.mono');
		font-size: 13px;
		fill: theme('colors.gray.700');
		text-anchor: middle;
	}

	.uch {
		font-family: theme('fontFamily.mono');
		font-size: 13px;
		fill: theme('colors.gray.500');
		text-anchor: middle;
	}

	.izoh {
		font-size: 12px;
		fill: theme('colors.gray.400');
		text-anchor: middle;
	}

	.tugun {
		fill: white;
		stroke: theme('colors.purple.500');
		stroke-width: 1.5;
	}

	.tugun-nom {
		font-size: 15px;
		fill: theme('colors.purple.600');
		text-anchor: middle;
	}

	.shox-yoz {
		font-size: 12px;
		text-anchor: middle;
		letter-spacing: 0.03em;
	}

	.gate-yoz {
		fill: theme('colors.purple.600');
	}

	.val-yoz {
		fill: theme('colors.gray.500');
	}

	/* ---------- formula ---------- */
	.formula {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.75rem;
		flex-wrap: wrap;
		font-size: 1rem;
		color: theme('colors.gray.800');
		padding: 0.25rem 0 0.1rem;
	}

	.formula-yon {
		font-size: 0.85rem;
		opacity: 0.7;
	}

	/* ---------- pastki panel ---------- */
	.ost {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
		align-items: start;
	}

	.blok {
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		padding: 0.6rem 0.7rem 0.4rem;
	}

	.blok-nom {
		font-size: 0.74rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: theme('colors.gray.400');
		margin-bottom: 0.3rem;
	}

	.blok svg {
		width: 100%;
		height: auto;
		display: block;
	}

	.oq {
		stroke: theme('colors.gray.200');
		stroke-width: 1;
	}

	.egri {
		fill: none;
		stroke-width: 2;
	}

	.gelu-egri {
		stroke: theme('colors.gray.400');
	}

	.silu-egri {
		stroke: theme('colors.purple.500');
	}

	.kursor {
		stroke: theme('colors.purple.200');
		stroke-width: 1;
		stroke-dasharray: 3 3;
	}

	.nuqta {
		stroke: white;
		stroke-width: 1.5;
	}

	.gelu-nuqta {
		fill: theme('colors.gray.500');
	}

	.silu-nuqta {
		fill: theme('colors.purple.600');
	}

	.belgi {
		font-family: theme('fontFamily.mono');
		font-size: 11px;
		text-anchor: end;
	}

	.gelu-yoz {
		fill: theme('colors.gray.500');
	}

	.silu-yoz {
		fill: theme('colors.purple.600');
	}

	.oq-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 11px;
		fill: theme('colors.gray.400');
		text-anchor: middle;
	}

	/* ---------- darvoza ---------- */
	.tasma {
		transition: y 0.15s ease, height 0.15s ease;
	}

	.kirish-tasma {
		fill: theme('colors.gray.300');
	}

	.chiqish-tasma {
		fill: theme('colors.purple.500');
	}

	.ramka {
		fill: none;
		stroke: theme('colors.gray.300');
		stroke-width: 1;
	}

	.parda {
		fill: theme('colors.purple.100');
		stroke: theme('colors.purple.300');
		stroke-width: 1;
		transition: y 0.15s ease, height 0.15s ease;
	}

	.tasma-yoz,
	.darvoza-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 11px;
		text-anchor: middle;
		fill: theme('colors.gray.500');
		font-variant-numeric: tabular-nums;
	}

	.darvoza-yoz {
		fill: theme('colors.purple.600');
	}

	.chiq-yoz {
		fill: theme('colors.purple.600');
	}

	.ogoh {
		font-size: 11px;
		text-anchor: middle;
		fill: theme('colors.gray.400');
	}

	/* ---------- hisob qatori ---------- */
	.hisob {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.9rem;
		flex-wrap: wrap;
		padding-top: 0.2rem;
	}

	.hisob-el {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
	}

	.k {
		font-size: 0.72rem;
		color: theme('colors.gray.400');
		white-space: nowrap;
	}

	.v {
		font-family: theme('fontFamily.mono');
		font-size: 1.05rem;
		font-variant-numeric: tabular-nums;
	}

	.gate-v {
		color: theme('colors.purple.600');
	}

	.val-v {
		color: theme('colors.gray.700');
	}

	.chiq-v {
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.amal {
		font-family: theme('fontFamily.mono');
		font-size: 1rem;
		color: theme('colors.gray.300');
		padding-top: 0.8rem;
	}

	.eslatma {
		font-size: 0.76rem;
		color: theme('colors.gray.400');
		max-width: 28ch;
		line-height: 1.45;
		padding-top: 0.8rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.dia,
		.tasma,
		.parda {
			transition: none;
		}
	}
</style>
