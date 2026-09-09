<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import Stend from '~/components/darslik/Stend.svelte';
	import Swap from '~/components/darslik/Swap.svelte';
	import { gsap } from '~/utils/gsap';

	// ---- holat (boshlang'ich holat = GPT-2) ----
	let normTuri = 'ln'; // ln | rms
	let normOrni = 'pre'; // pre | post
	let poz = 'learned'; // learned | rope
	let ffn = 'gelu'; // gelu | swiglu
	let bias = 'bor'; // bor | yoq

	// ---- SVG element'lari ----
	let normA: SVGGElement;
	let normB: SVGGElement;
	let lnA: SVGTextElement;
	let rmsA: SVGTextElement;
	let lnB: SVGTextElement;
	let rmsB: SVGTextElement;
	let resA: SVGPathElement;
	let resB: SVGPathElement;
	let resHeadA: SVGPolygonElement;
	let resHeadB: SVGPolygonElement;
	let tapA: SVGCircleElement;
	let tapB: SVGCircleElement;
	let peNode: SVGGElement;
	let ropeIcons: SVGGElement;
	let geluInner: SVGGElement;
	let swigluInner: SVGGElement;
	let ffnTitleGelu: SVGTextElement;
	let ffnTitleSw: SVGTextElement;
	let biasGroup: SVGGElement;
	let natijaEl: HTMLDivElement;

	let tayyor = false;
	let sekin = false; // prefers-reduced-motion

	const KUL3 = '#d1d5db'; // gray.300
	const BINAFSHA = '#9333ea'; // purple.600

	const DY_A = 168; // normA: pre-slot -> post-slot
	const DY_B = 192; // normB: pre-slot -> post-slot

	const d = (v: number) => (sekin ? 0 : v);

	// ---- diagrammani holatga moslash ----
	function moslaNormOrni(v: string, t = 0.45) {
		if (!tayyor) return;
		const post = v === 'post';
		gsap.to(normA, { y: post ? DY_A : 0, duration: d(t), ease: 'power2.inOut' });
		gsap.to(normB, { y: post ? DY_B : 0, duration: d(t), ease: 'power2.inOut' });
		const rang = post ? KUL3 : BINAFSHA;
		gsap.to([resA, resB], {
			stroke: rang,
			strokeWidth: post ? 1.6 : 3.4,
			duration: d(t),
			ease: 'power2.out'
		});
		gsap.to([resHeadA, resHeadB, tapA, tapB], { fill: rang, duration: d(t) });
	}

	function moslaNormTuri(v: string, t = 0.35) {
		if (!tayyor) return;
		const rms = v === 'rms';
		gsap.to([lnA, lnB], { opacity: rms ? 0 : 1, duration: d(t) });
		gsap.to([rmsA, rmsB], { opacity: rms ? 1 : 0, duration: d(t) });
	}

	function moslaPoz(v: string, t = 0.4) {
		if (!tayyor) return;
		const rope = v === 'rope';
		gsap.to(peNode, {
			opacity: rope ? 0 : 1,
			scale: rope ? 0.86 : 1,
			transformOrigin: '50% 50%',
			duration: d(t),
			ease: 'power2.out'
		});
		gsap.to(ropeIcons, {
			opacity: rope ? 1 : 0,
			scale: rope ? 1 : 0.4,
			transformOrigin: '50% 50%',
			duration: d(t),
			ease: 'back.out(1.7)'
		});
	}

	function moslaFfn(v: string, t = 0.4) {
		if (!tayyor) return;
		const sw = v === 'swiglu';
		gsap.to(ffnTitleGelu, { opacity: sw ? 0 : 1, duration: d(t * 0.8) });
		gsap.to(ffnTitleSw, { opacity: sw ? 1 : 0, duration: d(t * 0.8) });
		gsap.to(geluInner, {
			opacity: sw ? 0 : 1,
			scale: sw ? 0.9 : 1,
			transformOrigin: '50% 50%',
			duration: d(t),
			ease: 'power2.out'
		});
		gsap.to(swigluInner, {
			opacity: sw ? 1 : 0,
			scale: sw ? 1 : 0.9,
			transformOrigin: '50% 50%',
			duration: d(t),
			ease: 'power2.out'
		});
	}

	function moslaBias(v: string, t = 0.3) {
		if (!tayyor) return;
		gsap.to(biasGroup, { opacity: v === 'bor' ? 1 : 0, duration: d(t) });
	}

	// ---- reaktiv bog'lanishlar ----
	$: moslaNormOrni(normOrni);
	$: moslaNormTuri(normTuri);
	$: moslaPoz(poz);
	$: moslaFfn(ffn);
	$: moslaBias(bias);

	// ---- natija ----
	type Natija = { nom: string; izoh: string; tur: 'model' | 'yoq' };

	function hisobla(nt: string, no: string, pz: string, fn: string, bs: string): Natija {
		const k = [nt, no, pz, fn, bs].join('|');

		if (k === 'ln|pre|learned|gelu|bor')
			return {
				tur: 'model',
				nom: 'GPT-2 (2019)',
				izoh: `Bosh sahifadagi model. Pre-LN allaqachon joyida, qolgan to'rt sozlama hali eski tomonda.`
			};

		if (k === 'ln|post|learned|gelu|bor')
			return {
				tur: 'model',
				nom: 'BERT / asl Transformer oilasi (2017-2018)',
				izoh: `Norm blokdan keyin turadi. Bu holatda chuqur modelni o'qitish uchun warmup shart edi.`
			};

		if (k === 'rms|pre|rope|swiglu|yoq')
			return {
				tur: 'model',
				nom: 'Llama 2 / Llama 3, Mistral, Qwen (2023-2024)',
				izoh: `Bugungi ochiq modellarning standart bloki. Beshta sozlamaning hammasi yangi tomonda.`
			};

		if (k === 'rms|pre|rope|gelu|yoq')
			return {
				tur: 'model',
				nom: `GeGLU'siz variant - kam uchraydi`,
				izoh: `Norm, pozitsiya va bias zamonaviy, lekin FFN hali oddiy MLP: eshiksiz (gate'siz) qatlam.`
			};

		const eskilar: string[] = [];
		if (nt === 'ln') eskilar.push('norm hali LayerNorm');
		if (no === 'post') eskilar.push(`norm o'rni hali Post-LN`);
		if (pz === 'learned') eskilar.push('pozitsiya hali Learned');
		if (fn === 'gelu') eskilar.push('FFN hali GELU MLP');
		if (bs === 'bor') eskilar.push('bias hali bor');

		return {
			tur: 'yoq',
			nom: `Bu kombinatsiya mashhur modellarda uchramaydi`,
			izoh: eskilar.length
				? `Eski tomonda qolgani: ${eskilar.join(', ')}.`
				: `Sozlamalar zamonaviy, lekin aynan bu kombinatsiya keng tarqalmagan.`
		};
	}

	$: natija = hisobla(normTuri, normOrni, poz, ffn, bias);
	$: bayroqlar = [
		normTuri === 'rms',
		normOrni === 'pre',
		poz === 'rope',
		ffn === 'swiglu',
		bias === 'yoq'
	];
	$: zamonaviySoni = bayroqlar.filter(Boolean).length;
	$: kalit = [normTuri, normOrni, poz, ffn, bias].join('|');
	$: faolPreset =
		kalit === 'ln|pre|learned|gelu|bor'
			? 'gpt2'
			: kalit === 'rms|pre|rope|swiglu|yoq'
				? 'llama3'
				: '';

	// natija nomi o'zgarganda kichik fade/slide
	let oldingiNom = '';
	$: if (tayyor && natija.nom !== oldingiNom) {
		oldingiNom = natija.nom;
		nomAnim();
	}

	function nomAnim() {
		if (!natijaEl) return;
		gsap.fromTo(
			natijaEl,
			{ opacity: 0, y: 8 },
			{ opacity: 1, y: 0, duration: d(0.35), ease: 'power2.out', overwrite: true }
		);
	}

	// ---- preset'lar ----
	const presetlar: Record<string, string[]> = {
		gpt2: ['ln', 'pre', 'learned', 'gelu', 'bor'],
		llama3: ['rms', 'pre', 'rope', 'swiglu', 'yoq']
	};

	let kutuvchilar: gsap.core.Tween[] = [];

	function presetQoy(nom: string) {
		kutuvchilar.forEach((c) => c.kill());
		kutuvchilar = [];
		const p = presetlar[nom];
		const qadamlar = [
			() => (normTuri = p[0]),
			() => (normOrni = p[1]),
			() => (poz = p[2]),
			() => (ffn = p[3]),
			() => (bias = p[4])
		];
		qadamlar.forEach((q, i) => {
			if (sekin) {
				q();
				return;
			}
			kutuvchilar.push(gsap.delayedCall(i * 0.08, q));
		});
	}

	onMount(() => {
		sekin = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		tayyor = true;
		// boshlang'ich holatni animatsiyasiz o'rnatish
		moslaNormOrni(normOrni, 0);
		moslaNormTuri(normTuri, 0);
		moslaPoz(poz, 0);
		moslaFfn(ffn, 0);
		moslaBias(bias, 0);
		oldingiNom = natija.nom;
	});

	onDestroy(() => {
		kutuvchilar.forEach((c) => c.kill());
	});
</script>

<Stend
	title="Blok konstruktori"
	izoh="Beshta sozlamani almashtiring - diagramma va pastdagi natija birga o'zgaradi. Preset tugmalari beshtasini navbat bilan o'z holatiga o'tkazadi."
>
	<svelte:fragment slot="boshqaruv">
		<div class="presetlar">
			<span class="preset-nom">Preset</span>
			<button
				type="button"
				class="preset"
				class:faol={faolPreset === 'gpt2'}
				on:click={() => presetQoy('gpt2')}>GPT-2 (2019)</button
			>
			<button
				type="button"
				class="preset"
				class:faol={faolPreset === 'llama3'}
				on:click={() => presetQoy('llama3')}>Llama 3 (2024)</button
			>
		</div>
	</svelte:fragment>

	<div class="quruvchi">
		<!-- ================= BOSHQARUV PANELI ================= -->
		<div class="panel">
			<div class="qator">
				<div class="qator-bosh">
					<span class="qator-nom">Norm turi</span>
					<a class="qator-link" href="{base}/darslik/rmsnorm">2.1 →</a>
				</div>
				<Swap
					bind:value={normTuri}
					options={[
						{ id: 'ln', label: 'LayerNorm' },
						{ id: 'rms', label: 'RMSNorm' }
					]}
				/>
			</div>

			<div class="qator">
				<div class="qator-bosh">
					<span class="qator-nom">Norm o'rni</span>
					<a class="qator-link" href="{base}/darslik/pre-ln">2.2 →</a>
				</div>
				<Swap
					bind:value={normOrni}
					options={[
						{ id: 'post', label: 'Post-LN' },
						{ id: 'pre', label: 'Pre-LN' }
					]}
				/>
			</div>

			<div class="qator">
				<div class="qator-bosh">
					<span class="qator-nom">Pozitsiya</span>
					<a class="qator-link" href="{base}/darslik/rope">2.4 →</a>
				</div>
				<Swap
					bind:value={poz}
					options={[
						{ id: 'learned', label: 'Learned' },
						{ id: 'rope', label: 'RoPE' }
					]}
				/>
			</div>

			<div class="qator">
				<div class="qator-bosh">
					<span class="qator-nom">FFN</span>
					<a class="qator-link" href="{base}/darslik/swiglu">2.3 →</a>
				</div>
				<Swap
					bind:value={ffn}
					options={[
						{ id: 'gelu', label: 'GELU MLP' },
						{ id: 'swiglu', label: 'SwiGLU' }
					]}
				/>
			</div>

			<div class="qator">
				<div class="qator-bosh">
					<span class="qator-nom">Bias</span>
				</div>
				<Swap
					bind:value={bias}
					options={[
						{ id: 'bor', label: 'bor' },
						{ id: 'yoq', label: "yo'q" }
					]}
				/>
			</div>

			<div class="hisob">
				<div class="nuqtalar">
					{#each bayroqlar as ok}
						<span class="nuqta" class:on={ok}></span>
					{/each}
				</div>
				<span class="hisob-matn">5 ta sozlamadan {zamonaviySoni} tasi zamonaviy</span>
			</div>
		</div>

		<!-- ================= BLOK DIAGRAMMASI ================= -->
		<div class="diagramma">
			<svg
				class="blok-svg"
				viewBox="0 0 420 600"
				role="img"
				aria-label="Transformer bloki diagrammasi: normalizatsiya, attention, FFN va residual yo'llari"
			>
				<!-- asosiy vertikal chiziq -->
				<path class="main-line" d="M 200 34 L 200 562" />

				<!-- blok chegarasi -->
				<rect class="blok-rect" x="44" y="58" width="312" height="490" rx="8" />
				<text class="blok-label" x="352" y="51" text-anchor="end">TRANSFORMER BLOKI</text>

				<!-- residual shoxlar -->
				<path class="residual" bind:this={resA} d="M 200 74 L 74 74 L 74 232 L 185 232" />
				<polygon class="res-head" bind:this={resHeadA} points="179,227 179,237 186,232" />
				<path class="residual" bind:this={resB} d="M 200 298 L 74 298 L 74 482 L 185 482" />
				<polygon class="res-head" bind:this={resHeadB} points="179,477 179,487 186,482" />
				<circle class="tap" bind:this={tapA} cx="200" cy="74" r="3.4" />
				<circle class="tap" bind:this={tapB} cx="200" cy="298" r="3.4" />

				<!-- asosiy chiziqdagi strelkalar -->
				<polygon class="ar" points="196,50 204,50 200,57" />
				<polygon class="ar" points="196,122 204,122 200,129" />
				<polygon class="ar" points="196,211 204,211 200,218" />
				<polygon class="ar" points="196,348 204,348 200,355" />
				<polygon class="ar" points="196,461 204,461 200,468" />
				<polygon class="ar" points="196,554 204,554 200,561" />

				<!-- kirish -->
				<g class="kirish">
					<rect class="box" x="125" y="6" width="150" height="28" rx="5" />
					<text class="box-text" x="200" y="24">Kirish embedding</text>
				</g>

				<!-- + PE tuguni (faqat Learned) -->
				<g class="pe-node" bind:this={peNode}>
					<path class="pe-arrow-line" d="M 300 20 L 282 20" />
					<polygon class="pe-arrow" points="279,20 288,15.5 288,24.5" />
					<rect class="box pe-box" x="300" y="6" width="88" height="28" rx="5" />
					<text class="box-text" x="344" y="24">+ PE</text>
					<text class="mini" x="344" y="45">learned absolute</text>
				</g>

				<!-- ATTENTION -->
				<g class="attn">
					<rect class="box sublayer-box" x="98" y="130" width="204" height="74" rx="6" />
					<text class="sublayer-title" x="200" y="153">Attention</text>

					<g class="chip q">
						<rect x="137" y="169" width="26" height="22" rx="4" />
						<text x="150" y="184">Q</text>
					</g>
					<g class="chip k">
						<rect x="187" y="169" width="26" height="22" rx="4" />
						<text x="200" y="184">K</text>
					</g>
					<g class="chip v">
						<rect x="237" y="169" width="26" height="22" rx="4" />
						<text x="250" y="184">V</text>
					</g>

					<!-- RoPE burilish ikonkalari (Q va K yonida) -->
					<g class="rope-icons" bind:this={ropeIcons} opacity="0">
						<g transform="translate(170,167)">
							<path class="rope-arc" d="M 5.2 -3.4 A 6.2 6.2 0 1 1 -3.4 -5.2" />
							<polygon class="rope-head" points="-1.4,-6.9 -5.8,-6.3 -3.4,-2.5" />
						</g>
						<g transform="translate(220,167)">
							<path class="rope-arc" d="M 5.2 -3.4 A 6.2 6.2 0 1 1 -3.4 -5.2" />
							<polygon class="rope-head" points="-1.4,-6.9 -5.8,-6.3 -3.4,-2.5" />
						</g>
					</g>
				</g>

				<!-- birinchi qo'shish -->
				<g class="add">
					<circle class="add-circle" cx="200" cy="232" r="13" />
					<path class="add-plus" d="M 194 232 L 206 232 M 200 226 L 200 238" />
				</g>

				<!-- FFN -->
				<g class="ffn">
					<rect class="box sublayer-box" x="98" y="356" width="204" height="100" rx="6" />
					<text class="sublayer-title" x="200" y="379" bind:this={ffnTitleGelu}>GELU MLP</text>
					<text class="sublayer-title" x="200" y="379" bind:this={ffnTitleSw} opacity="0"
						>SwiGLU</text
					>

					<g class="ffn-inner" bind:this={geluInner}>
						<path class="inner-line" d="M 200 388 L 200 400" />
						<rect class="chip-box" x="164" y="400" width="72" height="22" rx="5" />
						<text class="chip-text" x="200" y="415">GELU</text>
						<path class="inner-line" d="M 200 422 L 200 446" />
					</g>

					<g class="ffn-inner" bind:this={swigluInner} opacity="0">
						<path
							class="inner-line"
							d="M 200 388 L 200 394 M 156 394 L 244 394 M 156 394 L 156 400 M 244 394 L 244 400"
						/>
						<rect class="chip-box gate" x="124" y="400" width="64" height="22" rx="5" />
						<text class="chip-text" x="156" y="415">gate</text>
						<rect class="chip-box" x="212" y="400" width="64" height="22" rx="5" />
						<text class="chip-text" x="244" y="415">value</text>
						<path class="inner-line" d="M 156 422 L 156 430 L 200 430 M 244 422 L 244 430 L 200 430" />
						<circle class="op-circle" cx="200" cy="438" r="8" />
						<circle class="op-dot" cx="200" cy="438" r="2.6" />
					</g>
				</g>

				<!-- ikkinchi qo'shish -->
				<g class="add">
					<circle class="add-circle" cx="200" cy="482" r="13" />
					<path class="add-plus" d="M 194 482 L 206 482 M 200 476 L 200 488" />
				</g>

				<!-- bias belgilari -->
				<g class="bias-belgi" bind:this={biasGroup}>
					<rect x="262" y="136" width="30" height="16" rx="4" />
					<text x="277" y="148">+b</text>
					<rect x="262" y="362" width="30" height="16" rx="4" />
					<text x="277" y="374">+b</text>
				</g>

				<!-- ko'chib yuruvchi norm qutilari -->
				<g class="norm-guruh" bind:this={normA}>
					<rect class="box norm-box" x="132" y="86" width="136" height="26" rx="5" />
					<text class="box-text norm-text" x="200" y="103" bind:this={lnA}>LayerNorm</text>
					<text class="box-text norm-text" x="200" y="103" bind:this={rmsA} opacity="0"
						>RMSNorm</text
					>
				</g>
				<g class="norm-guruh" bind:this={normB}>
					<rect class="box norm-box" x="132" y="312" width="136" height="26" rx="5" />
					<text class="box-text norm-text" x="200" y="329" bind:this={lnB}>LayerNorm</text>
					<text class="box-text norm-text" x="200" y="329" bind:this={rmsB} opacity="0"
						>RMSNorm</text
					>
				</g>

				<!-- chiqish -->
				<g class="chiqish">
					<rect class="box" x="125" y="562" width="150" height="28" rx="5" />
					<text class="box-text" x="200" y="580">Chiqish</text>
				</g>
			</svg>
		</div>
	</div>

	<!-- ================= NATIJA QATORI ================= -->
	<div class="natija" class:yoq={natija.tur === 'yoq'}>
		<span class="natija-yorliq">Bu kombinatsiya</span>
		<div class="natija-ichi" bind:this={natijaEl}>
			<p class="natija-nom">{natija.nom}</p>
			<p class="natija-izoh">{natija.izoh}</p>
		</div>
	</div>
</Stend>

<style lang="scss">
	/* ---------- tartib ---------- */
	.quruvchi {
		display: flex;
		align-items: flex-start;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.panel {
		flex: 1 1 232px;
		max-width: 320px;
	}

	.diagramma {
		flex: 1 1 320px;
		display: flex;
		justify-content: center;
	}

	.blok-svg {
		display: block;
		width: 100%;
		max-width: 400px;
		height: auto;
	}

	/* ---------- boshqaruv paneli ---------- */
	.qator {
		padding: 0.55rem 0;
		border-bottom: 1px solid theme('colors.gray.100');

		&:first-child {
			padding-top: 0;
		}
		&:last-of-type {
			border-bottom: none;
		}
	}

	.qator-bosh {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.38rem;
	}

	.qator-nom {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.76rem;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		color: theme('colors.gray.500');
	}

	.qator-link {
		font-family: theme('fontFamily.mono');
		font-size: 0.7rem;
		color: theme('colors.gray.300');
		white-space: nowrap;
		transition: color 0.15s ease;

		&:hover {
			color: theme('colors.purple.600');
		}
	}

	.hisob {
		margin-top: 0.9rem;
		padding-top: 0.8rem;
		border-top: 1px solid theme('colors.gray.200');
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
	}

	.nuqtalar {
		display: flex;
		gap: 5px;
	}

	.nuqta {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: theme('colors.gray.200');
		transition:
			background 0.3s ease,
			transform 0.3s ease;

		&.on {
			background: theme('colors.purple.600');
			transform: scale(1.15);
		}
	}

	.hisob-matn {
		font-size: 0.73rem;
		color: theme('colors.gray.500');
		font-variant-numeric: tabular-nums;
	}

	/* ---------- preset tugmalari ---------- */
	.presetlar {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}

	.preset-nom {
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: theme('colors.gray.400');
	}

	.preset {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.76rem;
		padding: 0.28rem 0.66rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 5px;
		background: white;
		color: theme('colors.gray.600');
		white-space: nowrap;
		transition:
			border-color 0.18s ease,
			background 0.18s ease,
			color 0.18s ease;

		&:hover {
			border-color: theme('colors.purple.300');
			color: theme('colors.purple.700');
		}

		&.faol {
			border-color: theme('colors.purple.700');
			background: theme('colors.purple.700');
			color: white;
		}
	}

	/* ---------- natija qatori ---------- */
	.natija {
		margin-top: 1.6rem;
		padding: 0.85rem 1.05rem;
		border: 1px solid theme('colors.purple.200');
		background: theme('colors.purple.50');
		border-radius: 6px;
		transition:
			border-color 0.3s ease,
			background 0.3s ease;

		&.yoq {
			border-color: theme('colors.gray.200');
			background: theme('colors.gray.50');
		}
	}

	.natija-yorliq {
		display: block;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.68rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: theme('colors.gray.400');
	}

	.natija-nom {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.32rem;
		font-weight: 700;
		line-height: 1.22;
		color: theme('colors.purple.700');
		margin-top: 0.28rem;
		text-wrap: balance;
	}

	.natija.yoq .natija-nom {
		font-size: 1.02rem;
		font-weight: 500;
		color: theme('colors.gray.600');
	}

	.natija-izoh {
		font-size: 0.85rem;
		line-height: 1.55;
		color: theme('colors.gray.600');
		margin-top: 0.3rem;
	}

	/* ---------- SVG ---------- */
	.main-line {
		fill: none;
		stroke: theme('colors.gray.300');
		stroke-width: 1.6;
	}

	.ar {
		fill: theme('colors.gray.300');
	}

	.blok-rect {
		fill: none;
		stroke: theme('colors.gray.200');
		stroke-width: 1.2;
		stroke-dasharray: 5 4;
	}

	.blok-label {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 9px;
		letter-spacing: 0.12em;
		fill: theme('colors.gray.300');
	}

	.residual {
		fill: none;
		stroke: theme('colors.purple.600');
		stroke-width: 3.4;
		stroke-linejoin: round;
		stroke-linecap: round;
	}

	.res-head {
		fill: theme('colors.purple.600');
	}

	.tap {
		fill: theme('colors.purple.600');
	}

	.box {
		fill: #ffffff;
		stroke: theme('colors.gray.300');
		stroke-width: 1.2;
	}

	.sublayer-box {
		stroke: theme('colors.gray.400');
		stroke-width: 1.3;
	}

	.norm-box {
		stroke: theme('colors.purple.300');
	}

	.pe-box {
		stroke: theme('colors.gray.400');
	}

	.box-text {
		font-family: theme('fontFamily.mono');
		font-size: 11px;
		fill: theme('colors.gray.700');
		text-anchor: middle;
	}

	.norm-text {
		font-size: 11.5px;
		fill: theme('colors.purple.700');
	}

	.sublayer-title {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 12.5px;
		font-weight: 600;
		fill: theme('colors.gray.800');
		text-anchor: middle;
	}

	.mini {
		font-family: theme('fontFamily.mono');
		font-size: 8.5px;
		fill: theme('colors.gray.400');
		text-anchor: middle;
	}

	.pe-arrow-line {
		fill: none;
		stroke: theme('colors.gray.400');
		stroke-width: 1.3;
	}

	.pe-arrow {
		fill: theme('colors.gray.400');
	}

	.chip rect {
		fill: #ffffff;
		stroke-width: 1.3;
	}

	.chip text {
		font-family: theme('fontFamily.mono');
		font-size: 11px;
		font-weight: 600;
		text-anchor: middle;
	}

	.chip.q rect {
		stroke: theme('colors.blue.400');
	}
	.chip.q text {
		fill: theme('colors.blue.500');
	}
	.chip.k rect {
		stroke: theme('colors.red.400');
	}
	.chip.k text {
		fill: theme('colors.red.500');
	}
	.chip.v rect {
		stroke: theme('colors.green.400');
	}
	.chip.v text {
		fill: theme('colors.green.600');
	}

	.rope-arc {
		fill: none;
		stroke: theme('colors.purple.600');
		stroke-width: 1.6;
		stroke-linecap: round;
	}

	.rope-head {
		fill: theme('colors.purple.600');
	}

	.add-circle {
		fill: #ffffff;
		stroke: theme('colors.gray.400');
		stroke-width: 1.4;
	}

	.add-plus {
		fill: none;
		stroke: theme('colors.gray.500');
		stroke-width: 1.4;
		stroke-linecap: round;
	}

	.inner-line {
		fill: none;
		stroke: theme('colors.gray.300');
		stroke-width: 1.3;
	}

	.chip-box {
		fill: theme('colors.gray.50');
		stroke: theme('colors.gray.300');
		stroke-width: 1.1;

		&.gate {
			fill: theme('colors.purple.50');
			stroke: theme('colors.purple.300');
		}
	}

	.chip-text {
		font-family: theme('fontFamily.mono');
		font-size: 10.5px;
		fill: theme('colors.gray.600');
		text-anchor: middle;
	}

	.op-circle {
		fill: #ffffff;
		stroke: theme('colors.purple.600');
		stroke-width: 1.4;
	}

	.op-dot {
		fill: theme('colors.purple.600');
	}

	.bias-belgi rect {
		fill: theme('colors.gray.100');
	}

	.bias-belgi text {
		font-family: theme('fontFamily.mono');
		font-size: 10px;
		fill: theme('colors.gray.500');
		text-anchor: middle;
	}

	@media (prefers-reduced-motion: reduce) {
		.nuqta,
		.preset,
		.natija,
		.qator-link {
			transition: none;
		}
	}
</style>
