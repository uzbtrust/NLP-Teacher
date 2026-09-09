<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import Stend from '~/components/darslik/Stend.svelte';
	import Swap from '~/components/darslik/Swap.svelte';
	import Katex from '~/utils/Katex.svelte';

	// --- formulalar -------------------------------------------------------
	const BURISH = String.raw`\begin{pmatrix} q'_1 \\ q'_2 \end{pmatrix} =
		\begin{pmatrix} \cos m\theta & -\sin m\theta \\ \sin m\theta & \cos m\theta \end{pmatrix}
		\begin{pmatrix} q_1 \\ q_2 \end{pmatrix}`;
	const MOHIYAT = String.raw`\langle R_m q,\; R_n k \rangle = \langle R_{m-n} q,\; k \rangle`;
	const THETA_F = String.raw`\theta_i = 10000^{-2i/d}`;

	// --- A paneli: burilish -----------------------------------------------
	const MAX_POZ = 16;
	const THETA = (2 * Math.PI) / MAX_POZ; // 16 pozitsiya = tolik aylana

	let m = 5;
	let n = 2;

	let bal = Math.cos((m - n) * THETA);
	let ozgardi = false;
	let tegildi = false;

	function belgila() {
		const yangi = Math.cos((m - n) * THETA);
		ozgardi = Math.abs(yangi - bal) > 1e-9;
		bal = yangi;
		tegildi = true;
	}

	function surish(d: number) {
		if (m + d < 0 || n + d < 0 || m + d > MAX_POZ || n + d > MAX_POZ) return;
		m += d;
		n += d;
		belgila();
	}

	const qBur = tweened(m * THETA, { duration: 420, easing: cubicOut });
	const kBur = tweened(n * THETA, { duration: 420, easing: cubicOut });
	$: qBur.set(m * THETA);
	$: kBur.set(n * THETA);

	// --- geometriya --------------------------------------------------------
	const CX = 200;
	const CY = 160;
	const R = 112;

	const nuqta = (a: number, r: number) => ({
		x: CX + r * Math.cos(a),
		y: CY - r * Math.sin(a)
	});

	function yoy(a1: number, a2: number, r: number): string {
		let d = a2 - a1;
		// aylanadan oshib ketmasin
		if (Math.abs(d) > 2 * Math.PI - 1e-6) d = Math.sign(d) * (2 * Math.PI - 1e-6);
		const p1 = nuqta(a1, r);
		const p2 = nuqta(a1 + d, r);
		const katta = Math.abs(d) > Math.PI ? 1 : 0;
		const yonalish = d > 0 ? 0 : 1; // SVG'da y pastga qaragani uchun teskari
		return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${r} ${r} 0 ${katta} ${yonalish} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
	}

	$: qN = nuqta($qBur, R);
	$: kN = nuqta($kBur, R);
	$: yoyD = yoy($kBur, $qBur, 52);
	$: yoyYoz = nuqta(($kBur + $qBur) / 2, 68);
	$: farq = m - n;

	const belgilar = Array.from({ length: MAX_POZ }, (_, i) => i);
	const fmt = (v: number, k = 3) => (Object.is(v, -0) ? 0 : v).toFixed(k);

	// --- qoshish yoki burish ----------------------------------------------
	let usul = 'rope';
	const usullar = [
		{ id: 'abs', label: 'Learned absolute' },
		{ id: 'rope', label: 'RoPE' }
	];
	// asosiy vektor (uzunligi 1) va pozitsiya vektori
	const BAZA_A = 0.6;
	$: posBur = m * THETA;
	$: absNat = {
		// qoshish: pozitsiya vektori qoshiladi, uzunlik ham yonalish ham ozgaradi
		x: Math.cos(BAZA_A) + 0.55 * Math.cos(posBur),
		y: Math.sin(BAZA_A) + 0.55 * Math.sin(posBur)
	};
	$: absUz = Math.hypot(absNat.x, absNat.y);

	// --- B paneli: chastotalar ---------------------------------------------
	const D = 16;
	const juftlar = [0, 1, 2, 3, 4].map((i) => ({
		i,
		theta: Math.pow(10000, (-2 * i) / D)
	}));
	let poz = 12;
	const kichikR = 30;
</script>

<Stend
	title="Burilish: pozitsiya burchakka aylanadi"
	izoh="m va n ni birga surganda ikkala vektor ham buriladi, lekin ular orasidagi burchak — demak attention bali ham — o'zgarmaydi. Aynan shu xossa RoPE'ni nisbiy pozitsiya usuliga aylantiradi."
>
	<svelte:fragment slot="boshqaruv">
		<label class="slayder">
			<span class="slayder-nom q-nom">m (q pozitsiyasi)</span>
			<input
				type="range"
				min="0"
				max={MAX_POZ}
				step="1"
				bind:value={m}
				on:input={belgila}
				aria-label="q pozitsiyasi"
			/>
			<span class="slayder-son">{m}</span>
		</label>
		<label class="slayder">
			<span class="slayder-nom k-nom">n (k pozitsiyasi)</span>
			<input
				type="range"
				min="0"
				max={MAX_POZ}
				step="1"
				bind:value={n}
				on:input={belgila}
				aria-label="k pozitsiyasi"
			/>
			<span class="slayder-son">{n}</span>
		</label>
		<span class="birga">
			<span class="slayder-nom">ikkalasini birga</span>
			<button class="tugma" type="button" on:click={() => surish(-1)} aria-label="ikkalasini kamaytirish">&minus;1</button>
			<button class="tugma" type="button" on:click={() => surish(1)} aria-label="ikkalasini oshirish">+1</button>
		</span>
	</svelte:fragment>

	<div class="rope">
		<div class="aylana">
			<svg viewBox="0 0 400 300" role="img" aria-label="q va k vektorlarining burilishi">
				<circle class="halqa" cx={CX} cy={CY} r={R} />
				{#each belgilar as b (b)}
					<line
						class="tick"
						x1={nuqta(b * THETA, R - 5).x}
						y1={nuqta(b * THETA, R - 5).y}
						x2={nuqta(b * THETA, R + 5).x}
						y2={nuqta(b * THETA, R + 5).y}
					/>
					{#if b % 4 === 0}
						<text class="tick-yoz" x={nuqta(b * THETA, R + 18).x} y={nuqta(b * THETA, R + 18).y + 4}>
							{b}
						</text>
					{/if}
				{/each}

				<path class="yoy" d={yoyD} />
				<text class="yoy-yoz" x={yoyYoz.x} y={yoyYoz.y}>{farq >= 0 ? '' : '-'}{Math.abs(farq)}&thinsp;&theta;</text>

				<line class="vektor q-v" x1={CX} y1={CY} x2={qN.x} y2={qN.y} />
				<circle class="uchi q-v-uchi" cx={qN.x} cy={qN.y} r="5" />
				<text class="v-yoz q-nom" x={nuqta($qBur, R + 34).x} y={nuqta($qBur, R + 34).y + 4}>q</text>

				<line class="vektor k-v" x1={CX} y1={CY} x2={kN.x} y2={kN.y} />
				<circle class="uchi k-v-uchi" cx={kN.x} cy={kN.y} r="5" />
				<text class="v-yoz k-nom" x={nuqta($kBur, R + 34).x} y={nuqta($kBur, R + 34).y + 4}>k</text>

				<circle class="markaz" cx={CX} cy={CY} r="3" />
			</svg>
		</div>

		<div class="ong">
			<div class="bal-blok">
				<p class="bal-nom">attention bali &asymp; cos((m &minus; n)&thinsp;&theta;)</p>
				<p class="bal-son">{fmt(bal)}</p>
				{#if tegildi}
					<span class="badge" class:aktiv={ozgardi}>{ozgardi ? "o'zgardi" : "o'zgarmadi"}</span>
				{:else}
					<span class="badge bosh">sliderni suring</span>
				{/if}
				<p class="bal-izoh">
					Bu son faqat <strong>m &minus; n</strong> ga bog'liq. <code>+1</code> va <code>&minus;1</code>
					tugmalari ikkala pozitsiyani birga suradi — vektorlar buriladi, bal o'zgarmaydi.
				</p>
			</div>

			<div class="usul-blok">
				<Swap label="Usul" bind:value={usul} options={usullar} />
				<svg viewBox="0 0 220 130" role="img" aria-label="Qoshish va burish taqqoslovi">
					<line class="oq" x1="20" y1="105" x2="205" y2="105" />
					<line class="oq" x1="20" y1="105" x2="20" y2="15" />
					<line
						class="baza-v"
						x1="20"
						y1="105"
						x2={20 + 70 * Math.cos(BAZA_A)}
						y2={105 - 70 * Math.sin(BAZA_A)}
					/>
					{#if usul === 'rope'}
						<line
							class="natija-v"
							x1="20"
							y1="105"
							x2={20 + 70 * Math.cos(BAZA_A + posBur)}
							y2={105 - 70 * Math.sin(BAZA_A + posBur)}
						/>
						<path class="yoy kichik-yoy" d={`M ${20 + 40 * Math.cos(BAZA_A)} ${105 - 40 * Math.sin(BAZA_A)} A 40 40 0 ${posBur > Math.PI ? 1 : 0} 0 ${20 + 40 * Math.cos(BAZA_A + Math.min(posBur, 2 * Math.PI - 0.001))} ${105 - 40 * Math.sin(BAZA_A + Math.min(posBur, 2 * Math.PI - 0.001))}`} />
						<text class="usul-yoz" x="112" y="126">uzunlik o'zgarmadi &mdash; faqat burildi</text>
					{:else}
						<line
							class="pe-v"
							x1={20 + 70 * Math.cos(BAZA_A)}
							y1={105 - 70 * Math.sin(BAZA_A)}
							x2={20 + 70 * absNat.x}
							y2={105 - 70 * absNat.y}
						/>
						<line class="natija-v" x1="20" y1="105" x2={20 + 70 * absNat.x} y2={105 - 70 * absNat.y} />
						<text class="usul-yoz" x="112" y="126">uzunlik {fmt(absUz, 2)} &mdash; vektor buzildi</text>
					{/if}
				</svg>
				<p class="usul-izoh">
					{#if usul === 'rope'}
						RoPE vektorni <strong>buradi</strong>. Burish uzunlikni o'zgartirmaydi, shuning uchun
						vektorning normasi va u tashigan ma'no buzilmaydi. Har qanday pozitsiya uchun burchak
						hisoblanaveradi — o'rgatiladigan jadval yo'q.
					{:else}
						GPT-2 pozitsiya vektorini <strong>qo'shadi</strong>. Natija vektorning uzunligi ham,
						yo'nalishi ham o'zgaradi. Va jadval 1024 ta pozitsiya uchun o'rgatilgan — 1025-tokenga
						qo'shadigan vektor yo'q.
					{/if}
				</p>
			</div>
		</div>
	</div>

	<div class="formula-qator">
		<Katex math={MOHIYAT} displayMode={true} />
	</div>
	<p class="formula-izoh">
		RoPE'ning butun mohiyati shu tenglikda: <em>m</em>-pozitsiyaga burilgan q bilan
		<em>n</em>-pozitsiyaga burilgan k ning skalyar ko'paytmasi faqat <em>m &minus; n</em> ga bog'liq.
		Mutlaq o'rin qisqaradi, faqat masofa qoladi.
	</p>
</Stend>

<Stend
	title="Chastotalar: har bir juft o'z tezligida buriladi"
	izoh="RoPE vektorni juft-juft o'lchamlarga bo'ladi. Birinchi juftlar tez aylanadi va yaqin qo'shnilarni ajratadi; oxirgilari deyarli qimirlamaydi va uzoq masofani kodlaydi."
>
	<svelte:fragment slot="boshqaruv">
		<label class="slayder">
			<span class="slayder-nom">pozitsiya</span>
			<input type="range" min="0" max="64" step="1" bind:value={poz} aria-label="pozitsiya" />
			<span class="slayder-son">{poz}</span>
		</label>
		<span class="teta-f"><Katex math={THETA_F} /></span>
	</svelte:fragment>

	<div class="chastota">
		{#each juftlar as j (j.i)}
			<div class="juft">
				<svg viewBox="0 0 80 80" role="img" aria-label={`${j.i}-juft`}>
					<circle class="halqa" cx="40" cy="40" r={kichikR} />
					<line
						class="vektor juft-v"
						x1="40"
						y1="40"
						x2={40 + kichikR * Math.cos(poz * j.theta)}
						y2={40 - kichikR * Math.sin(poz * j.theta)}
					/>
					<circle
						class="uchi juft-uchi"
						cx={40 + kichikR * Math.cos(poz * j.theta)}
						cy={40 - kichikR * Math.sin(poz * j.theta)}
						r="3.5"
					/>
					<circle class="markaz" cx="40" cy="40" r="2" />
				</svg>
				<p class="juft-nom">{j.i}-juft</p>
				<p class="juft-teta">&theta; = {j.theta >= 0.01 ? fmt(j.theta, 2) : j.theta.toExponential(0)}</p>
				<p class="juft-bur">{fmt((poz * j.theta) / (2 * Math.PI), 2)} aylanish</p>
			</div>
		{/each}
	</div>

	<div class="formula-qator kichik">
		<Katex math={BURISH} />
	</div>
</Stend>

<style lang="scss">
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
		width: 92px;
		accent-color: theme('colors.purple.600');
		cursor: pointer;
	}

	.slayder-son {
		font-family: theme('fontFamily.mono');
		font-size: 0.78rem;
		color: theme('colors.gray.800');
		font-variant-numeric: tabular-nums;
		min-width: 1.6em;
		text-align: right;
	}

	.birga {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.tugma {
		font-family: theme('fontFamily.mono');
		font-size: 0.76rem;
		padding: 0.22rem 0.5rem;
		border: 1px solid theme('colors.gray.300');
		border-radius: 4px;
		background: white;
		color: theme('colors.gray.600');

		&:hover {
			border-color: theme('colors.purple.300');
			color: theme('colors.purple.700');
			background: theme('colors.purple.50');
		}
	}

	.teta-f {
		font-size: 0.8rem;
		color: theme('colors.gray.500');
	}

	/* ---------- asosiy panel ---------- */
	.rope {
		display: grid;
		grid-template-columns: 400px 1fr;
		gap: 1.5rem;
		align-items: start;
		min-width: 700px;
	}

	.aylana svg,
	.usul-blok svg,
	.juft svg {
		width: 100%;
		height: auto;
		display: block;
	}

	.halqa {
		fill: none;
		stroke: theme('colors.gray.200');
		stroke-width: 1;
	}

	.tick {
		stroke: theme('colors.gray.300');
		stroke-width: 1;
	}

	.tick-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 10px;
		fill: theme('colors.gray.400');
		text-anchor: middle;
	}

	.vektor {
		stroke-width: 2.5;
		stroke-linecap: round;
	}

	.q-v {
		stroke: theme('colors.blue.400');
	}

	.k-v {
		stroke: theme('colors.red.400');
	}

	.uchi {
		stroke: white;
		stroke-width: 1.5;
	}

	.q-v-uchi {
		fill: theme('colors.blue.400');
	}

	.k-v-uchi {
		fill: theme('colors.red.400');
	}

	.markaz {
		fill: theme('colors.gray.400');
	}

	.v-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 13px;
		text-anchor: middle;
	}

	.q-nom {
		fill: theme('colors.blue.500');
		color: theme('colors.blue.500');
	}

	.k-nom {
		fill: theme('colors.red.500');
		color: theme('colors.red.500');
	}

	.yoy {
		fill: none;
		stroke: theme('colors.purple.400');
		stroke-width: 2;
	}

	.kichik-yoy {
		stroke-width: 1.5;
	}

	.yoy-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 12px;
		fill: theme('colors.purple.600');
		text-anchor: middle;
	}

	/* ---------- ong ustun ---------- */
	.ong {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}

	.bal-blok {
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		padding: 0.9rem 1rem;
	}

	.bal-nom {
		font-family: theme('fontFamily.mono');
		font-size: 0.76rem;
		color: theme('colors.gray.400');
	}

	.bal-son {
		font-family: theme('fontFamily.mono');
		font-size: 2.2rem;
		line-height: 1.2;
		color: theme('colors.purple.700');
		font-variant-numeric: tabular-nums;
	}

	.badge {
		display: inline-block;
		font-size: 0.72rem;
		letter-spacing: 0.04em;
		padding: 0.15rem 0.5rem;
		border-radius: 3px;
		background: theme('colors.gray.100');
		color: theme('colors.gray.500');
		border: 1px solid theme('colors.gray.200');
	}

	.badge.aktiv {
		background: theme('colors.purple.50');
		color: theme('colors.purple.700');
		border-color: theme('colors.purple.200');
	}

	.badge.bosh {
		color: theme('colors.gray.400');
	}

	.bal-izoh {
		margin-top: 0.6rem;
		font-size: 0.82rem;
		line-height: 1.55;
		color: theme('colors.gray.500');

		strong {
			color: theme('colors.purple.700');
		}

		code {
			font-family: theme('fontFamily.mono');
			background: theme('colors.gray.50');
			padding: 0 0.25rem;
			border-radius: 3px;
		}
	}

	.usul-blok {
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		padding: 0.8rem 1rem 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.oq {
		stroke: theme('colors.gray.200');
		stroke-width: 1;
	}

	.baza-v {
		stroke: theme('colors.gray.300');
		stroke-width: 2;
		stroke-linecap: round;
	}

	.natija-v {
		stroke: theme('colors.purple.600');
		stroke-width: 2.5;
		stroke-linecap: round;
	}

	.pe-v {
		stroke: theme('colors.gray.400');
		stroke-width: 1.5;
		stroke-dasharray: 3 3;
	}

	.usul-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 10px;
		fill: theme('colors.gray.400');
		text-anchor: middle;
	}

	.usul-izoh {
		font-size: 0.82rem;
		line-height: 1.55;
		color: theme('colors.gray.500');

		strong {
			color: theme('colors.purple.700');
		}
	}

	/* ---------- formula ---------- */
	.formula-qator {
		display: flex;
		justify-content: center;
		padding: 1.4rem 0 0.2rem;
		color: theme('colors.gray.800');
	}

	.formula-qator.kichik {
		font-size: 0.85rem;
		padding-top: 1rem;
	}

	.formula-izoh {
		text-align: center;
		font-size: 0.85rem;
		line-height: 1.6;
		color: theme('colors.gray.500');
		max-width: 58ch;
		margin: 0 auto;

		em {
			font-style: normal;
			font-family: theme('fontFamily.mono');
			color: theme('colors.purple.600');
		}
	}

	/* ---------- chastotalar ---------- */
	.chastota {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 1rem;
		min-width: 560px;
	}

	.juft {
		text-align: center;
	}

	.juft-v {
		stroke: theme('colors.purple.500');
		stroke-width: 2;
	}

	.juft-uchi {
		fill: theme('colors.purple.500');
	}

	.juft-nom {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.82rem;
		color: theme('colors.gray.700');
		margin-top: 0.3rem;
	}

	.juft-teta,
	.juft-bur {
		font-family: theme('fontFamily.mono');
		font-size: 0.72rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
	}

	.juft-bur {
		color: theme('colors.purple.500');
	}
</style>
