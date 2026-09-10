<script lang="ts">
	import { onMount } from 'svelte';
	import Stend from '~/components/darslik/Stend.svelte';
	import Swap from '~/components/darslik/Swap.svelte';
	import Katex from '~/utils/Katex.svelte';
	import { gsap } from '~/utils/gsap';

	// =====================================================================
	// 1-STEND: ulanish diagrammasi
	// Llama 3 8B konfiguratsiyasi: 32 qavat, 32 Q head, head_dim 128, fp16
	// =====================================================================

	const H = 32; // Q head soni
	const QAVAT = 32;
	const DH = 128;
	const BAYT = 2;
	const MHA_KB = (2 * QAVAT * H * DH * BAYT) / 1024; // 512

	const KB_FORMULA = String.raw`\text{KB/token} \;=\; \frac{2 \cdot L \cdot G \cdot d_h \cdot b}{1024}`;

	const GURUHLAR = [32, 16, 8, 4, 2, 1];
	let idx = 0; // MHA dan boshlanadi: avval muammo, keyin yechim

	$: G = GURUHLAR[idx];
	$: HAR = H / G;
	$: rejim = G === H ? `MHA` : G === 1 ? `MQA` : `GQA`;
	$: rejimYil = G === H ? `2017` : G === 1 ? `2019` : `2023`;
	$: rejimIzoh =
		G === H
			? `har Q head o'zining alohida K va V juftiga ega`
			: `${HAR} ta Q head bitta K/V juftini bo'lishadi`;
	$: modelTag = G === 8 ? `Llama 3 8B shu yerda` : G === H ? `Llama 2 7B shu yerda` : ``;

	// --- geometriya -------------------------------------------------------
	const W = 760;
	const CHAP = 44;
	const ONG = 20;
	const ENI = W - CHAP - ONG;
	const QADAM = ENI / H;
	const QW = 15;
	const QY = 34;
	const QH = 24;
	const KY = 184;
	const VY = 206;
	const BH = 18;
	const PAD = 2.6;
	const YOZ_Y = 245;
	const SVG_H = 258;

	const qx = (i: number) => CHAP + i * QADAM + (QADAM - QW) / 2;
	const qcx = (i: number) => CHAP + (i + 0.5) * QADAM;

	const QLAR = Array.from({ length: H }, (_, i) => i);

	type Blok = { x: number; w: number; cx: number };
	type Holat = { blok: Blok[]; kb: number };

	function joylash(g: number): Holat {
		const har = H / g;
		const blok: Blok[] = [];
		for (let i = 0; i < H; i++) {
			const guruh = Math.floor(i / har);
			const x = CHAP + guruh * har * QADAM + PAD;
			const w = har * QADAM - 2 * PAD;
			blok.push({ x, w, cx: x + w / 2 });
		}
		return { blok, kb: (2 * QAVAT * g * DH * BAYT) / 1024 };
	}

	function aralash(a: Holat, b: Holat, t: number): Holat {
		const l = (p: number, q: number) => p + (q - p) * t;
		return {
			blok: a.blok.map((v, i) => ({
				x: l(v.x, b.blok[i].x),
				w: l(v.w, b.blok[i].w),
				cx: l(v.cx, b.blok[i].cx)
			})),
			kb: l(a.kb, b.kb)
		};
	}

	// --- animatsiya -------------------------------------------------------
	let mounted = false;
	let kamHarakat = false;

	let hozir: Holat = joylash(GURUHLAR[0]);
	let boshi: Holat = hozir;
	const jarayon = { t: 1 };
	let tween: any = null;

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
			duration: 0.5,
			ease: 'power2.inOut',
			onUpdate: () => {
				hozir = aralash(boshi, oxir, jarayon.t);
			},
			onComplete: () => {
				hozir = oxir;
			}
		});
	}

	$: nishon = joylash(G);
	$: qoll(nishon);

	onMount(() => {
		mounted = true;
		kamHarakat = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		return () => {
			if (tween) tween.kill();
		};
	});

	// --- chiziqlar va yozuvlar --------------------------------------------
	function yol(a: number, b: number): string {
		const y0 = QY + QH;
		return `M ${a.toFixed(1)} ${y0} C ${a.toFixed(1)} ${y0 + 48}, ${b.toFixed(1)} ${
			KY - 48
		}, ${b.toFixed(1)} ${KY}`;
	}

	// guruh yozuvi faqat blok yetarlicha keng bo'lganda ko'rinadi
	function yozShaffof(w: number): number {
		return Math.min(1, Math.max(0, (w - 54) / 26));
	}

	$: vakillar = Array.from({ length: G }, (_, g) => g * HAR);

	// --- hisoblagichlar ----------------------------------------------------
	$: kbKor = Math.round(hozir.kb);
	$: nisbatSon = Math.max(1, Math.round(MHA_KB / Math.max(1, hozir.kb)));

	// =====================================================================
	// 2-STEND: muvozanat
	// =====================================================================

	const variantlar = [
		{ id: 'mha', label: 'MHA' },
		{ id: 'gqa', label: 'GQA-8' },
		{ id: 'mqa', label: 'MQA' }
	];
	let tanlov = 'gqa';

	// sifat qiymatlari SHARTLI: nisbiy joylashuvni ko'rsatadi, o'lchov emas
	const NUQTALAR = [
		{
			id: 'mqa',
			nom: 'MQA',
			yil: '2019',
			kb: 16,
			sifat: 0.58,
			qisqa: `1 ta K/V juft`,
			matn: `Eng arzon variant: butun modelda bitta K va bitta V head. Cache 16 KB/token gacha tushadi. Lekin sifat sezilarli pasayadi va o'qitish beqarorlashadi - shuning uchun MQA yakka holda keng tarqalmadi.`
		},
		{
			id: 'gqa',
			nom: 'GQA-8',
			yil: '2023',
			kb: 128,
			sifat: 0.94,
			qisqa: `8 ta K/V juft`,
			matn: `Oraliq nuqta: 32 Q head 8 ta guruhga bo'linadi. Cache 128 KB/token - MHA ga nisbatan 4 barobar kichik (64 Q head'li modelda o'sha 8 guruh 8 barobar tejaydi). Sifat MHA ga juda yaqin qoladi.`
		},
		{
			id: 'mha',
			nom: 'MHA',
			yil: '2017',
			kb: 512,
			sifat: 1.0,
			qisqa: `32 ta K/V juft`,
			matn: `Asl variant va sifat bo'yicha mezon. Har Q head o'z K/V juftini saqlaydi, cache 512 KB/token. Uzun kontekstda aynan shu son xotirani yeb qo'yadi.`
		}
	];

	$: faolNuqta = NUQTALAR.find((n) => n.id === tanlov) ?? NUQTALAR[1];

	// grafik geometriyasi
	const G_W = 700;
	const G_H = 312;
	const O_CHAP = 100; // y o'qi
	const O_PAST = 250; // x o'qi
	const N_CHAP = 130; // birinchi nuqta
	const N_ONG = 600; // oxirgi nuqta

	// x: log2 shkala, 16 -> 130, 512 -> 600
	const xpoz = (kb: number) =>
		N_CHAP + ((Math.log2(kb) - Math.log2(16)) / (Math.log2(512) - Math.log2(16))) * (N_ONG - N_CHAP);
	// y: shartli sifat shkalasi
	const ypoz = (s: number) => 240 - s * 170;

	const MHA_Y = ypoz(1);

	const chiziqYol = `M ${xpoz(16)} ${ypoz(0.58)} C ${xpoz(16) + 110} ${ypoz(0.82)}, ${
		xpoz(128) - 90
	} ${ypoz(0.93)}, ${xpoz(128)} ${ypoz(0.94)} C ${xpoz(128) + 70} ${ypoz(0.97)}, ${
		xpoz(512) - 70
	} ${ypoz(1)}, ${xpoz(512)} ${ypoz(1)}`;
</script>

<!-- ==================== 1-STEND ==================== -->
<Stend
	title="Q head 32 ta qoladi, K/V juftlari birlashadi"
	izoh={`Slayderni o'ngga suring: pastdagi K/V bloklar birlashadi, chiziqlar dastaga yig'iladi va hisoblagich tushadi. Formulada faqat bitta erkin son bor - KV guruh soni G. G = 32 da bu MHA, G = 1 da MQA, oradagi hamma narsa GQA.`}
>
	<svelte:fragment slot="boshqaruv">
		<label class="slayder">
			<span class="slayder-nom">KV guruh (G)</span>
			<input
				type="range"
				min="0"
				max={GURUHLAR.length - 1}
				step="1"
				bind:value={idx}
				aria-label="KV guruhlar soni"
			/>
			<span class="slayder-son">{G}</span>
		</label>
	</svelte:fragment>

	<div class="gd">
		<div class="bosh">
			<span class="rejim" class:mqa={G === 1} class:mha={G === H}>
				{rejim}
				<i class="rejim-yil">{rejimYil}</i>
			</span>
			<span class="rejim-izoh">{rejimIzoh}</span>
			{#if modelTag}
				<span class="model-tag">{modelTag}</span>
			{/if}
		</div>

		<svg
			viewBox="0 0 {W} {SVG_H}"
			role="img"
			aria-label="Q head'lar va KV guruhlar orasidagi ulanish diagrammasi"
		>
			<text class="yon-yoz" x={CHAP} y="18">
				Q proyeksiyalari - 32 ta, hech qachon o'zgarmaydi
			</text>

			<!-- ulanish chiziqlari -->
			<g class="ulanish">
				{#each hozir.blok as b, i}
					<path d={yol(qcx(i), b.cx)} />
				{/each}
			</g>

			<!-- Q head'lar -->
			<g>
				{#each QLAR as i}
					<rect class="qhead" x={qx(i)} y={QY} width={QW} height={QH} rx="2" />
				{/each}
			</g>

			<!-- K va V yo'laklari: har Q head uchun bitta to'rtburchak,
			     bir guruhdagilar ustma-ust tushib bitta blokka aylanadi -->
			<g>
				{#each hozir.blok as b}
					<rect class="kblok" x={b.x} y={KY} width={b.w} height={BH} rx="2" />
				{/each}
				{#each hozir.blok as b}
					<rect class="vblok" x={b.x} y={VY} width={b.w} height={BH} rx="2" />
				{/each}
			</g>

			<!-- guruh yozuvlari -->
			<g>
				{#each vakillar as v (v)}
					<text
						class="guruh-yoz"
						x={hozir.blok[v].cx}
						y={YOZ_Y}
						opacity={yozShaffof(hozir.blok[v].w)}
					>
						{HAR} Q head
					</text>
				{/each}
			</g>

			<!-- chap yorliqlar -->
			<text class="qator-yoz q-yoz" x={CHAP - 12} y={QY + QH / 2 + 4}>Q</text>
			<text class="qator-yoz k-yoz" x={CHAP - 12} y={KY + BH / 2 + 4}>K</text>
			<text class="qator-yoz v-yoz" x={CHAP - 12} y={VY + BH / 2 + 4}>V</text>
		</svg>

		<div class="olchov">
			<div class="karta">
				<span class="karta-nom">KV guruh</span>
				<span class="karta-son">{G}</span>
			</div>
			<div class="karta">
				<span class="karta-nom">Har guruhda</span>
				<span class="karta-son">{HAR} <i>Q head</i></span>
			</div>
			<div class="karta asosiy">
				<span class="karta-nom">KV cache</span>
				<span class="karta-son">{kbKor} <i>KB / token</i></span>
			</div>
			<div class="karta">
				<span class="karta-nom">MHA ga nisbatan</span>
				{#if G === H}
					<span class="karta-son sust">boshlang'ich holat</span>
				{:else}
					<span class="karta-son">{nisbatSon}&times; <i>kichik</i></span>
				{/if}
			</div>
		</div>

		<div class="formula-qator">
			<span class="formula"><Katex math={KB_FORMULA} /></span>
			<span class="formula-izoh">
				L = 32 qavat, d<sub>h</sub> = 128, b = 2 bayt (fp16). Bu yerda faqat
				<strong>G</strong> o'zgaradi - qolgan uchtasi arxitekturaning o'zi.
			</span>
		</div>
	</div>
</Stend>

<!-- ==================== 2-STEND ==================== -->
<div class="ikkinchi">
	<Stend
		title="Muvozanat: cache va sifat"
		izoh={`Chapga siljish - arzonroq, pastga tushish - sifat yo'qotish. MQA eng chapda, lekin eng pastda; GQA-8 esa MHA darajasining deyarli o'zida qolib, cache'ni bir necha barobar kichraytiradi - aynan shuning uchun sanoat GQA da to'xtadi. Sifat o'qi shartli: bu yerda aniq raqam berilmagan.`}
	>
		<svelte:fragment slot="boshqaruv">
			<Swap label="Variant" bind:value={tanlov} options={variantlar} />
		</svelte:fragment>

		<div class="mv">
			<svg
				viewBox="0 0 {G_W} {G_H}"
				role="img"
				aria-label="MHA, GQA-8 va MQA variantlarining cache va sifat bo'yicha joylashuvi"
			>
				<!-- MHA darajasi -->
				<line class="daraja" x1={O_CHAP} y1={MHA_Y} x2={640} y2={MHA_Y} />
				<text class="daraja-yoz" x={646} y={MHA_Y + 4} text-anchor="end">MHA darajasi</text>

				<!-- o'qlar -->
				<line class="oq" x1={O_CHAP} y1="40" x2={O_CHAP} y2={O_PAST} />
				<line class="oq" x1={O_CHAP} y1={O_PAST} x2={648} y2={O_PAST} />

				<text class="oq-nom" transform="translate(74 160) rotate(-90)">sifat</text>
				<text class="shartli" x={O_CHAP + 10} y="34">
					sifat o'qi shartli - aniq raqam berilmagan
				</text>

				<!-- x o'qi belgilari -->
				{#each NUQTALAR as n (n.id)}
					<line class="tik" x1={xpoz(n.kb)} y1={O_PAST} x2={xpoz(n.kb)} y2={O_PAST + 5} />
					<text class="tik-yoz" x={xpoz(n.kb)} y={O_PAST + 19}>{n.kb}</text>
				{/each}
				<text class="oq-nom past" x={G_W / 2} y={O_PAST + 46}>
					KV cache, KB/token - chapga qarab arzonroq
				</text>

				<!-- muvozanat egri chizig'i -->
				<path class="egri" d={chiziqYol} />

				<!-- nuqtalar -->
				{#each NUQTALAR as n (n.id)}
					<g class="nuqta" class:faol={tanlov === n.id}>
						{#if tanlov === n.id}
							<line
								class="korsatgich"
								x1={xpoz(n.kb)}
								y1={ypoz(n.sifat)}
								x2={xpoz(n.kb)}
								y2={O_PAST}
							/>
							<circle class="halqa" cx={xpoz(n.kb)} cy={ypoz(n.sifat)} r="13" />
						{/if}
						<circle class="doira" cx={xpoz(n.kb)} cy={ypoz(n.sifat)} r="7" />
						<text class="nuqta-nom" x={xpoz(n.kb)} y={ypoz(n.sifat) - 21}>{n.nom}</text>
						<text class="nuqta-yon" x={xpoz(n.kb)} y={ypoz(n.sifat) + 31}>{n.qisqa}</text>
					</g>
				{/each}
			</svg>

			<div class="tavsif">
				<div class="tavsif-bosh">
					<span class="tavsif-nom">{faolNuqta.nom}</span>
					<span class="tavsif-yil">{faolNuqta.yil}</span>
					<span class="tavsif-kb">{faolNuqta.kb} KB / token</span>
				</div>
				<p class="tavsif-matn">{faolNuqta.matn}</p>
			</div>
		</div>
	</Stend>
</div>

<style lang="scss">
	.gd,
	.mv {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 560px;
	}

	.ikkinchi {
		margin-top: 1.25rem;
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
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
		width: 140px;
		accent-color: theme('colors.purple.600');
		cursor: pointer;
	}

	.slayder-son {
		font-family: theme('fontFamily.mono');
		font-size: 0.82rem;
		color: theme('colors.gray.800');
		font-variant-numeric: tabular-nums;
		min-width: 2.2em;
		text-align: right;
	}

	/* ---------- rejim qatori ---------- */
	.bosh {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		flex-wrap: wrap;
	}

	.rejim {
		display: inline-flex;
		align-items: baseline;
		gap: 0.35rem;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		background: theme('colors.purple.100');
		color: theme('colors.purple.700');
		transition: background 0.3s ease, color 0.3s ease;
	}

	.rejim.mha {
		background: theme('colors.gray.100');
		color: theme('colors.gray.500');
	}

	.rejim.mqa {
		background: theme('colors.gray.100');
		color: theme('colors.gray.600');
	}

	.rejim-yil {
		font-family: theme('fontFamily.mono');
		font-size: 0.68rem;
		font-weight: 400;
		font-style: normal;
		opacity: 0.7;
		font-variant-numeric: tabular-nums;
	}

	.rejim-izoh {
		font-size: 0.82rem;
		color: theme('colors.gray.500');
	}

	.model-tag {
		margin-left: auto;
		font-family: theme('fontFamily.mono');
		font-size: 0.72rem;
		padding: 0.2rem 0.5rem;
		border: 1px solid theme('colors.purple.200');
		border-radius: 4px;
		background: theme('colors.purple.50');
		color: theme('colors.purple.700');
		white-space: nowrap;
	}

	/* ---------- diagramma ---------- */
	.qhead {
		fill: theme('colors.blue.400');
	}

	.kblok {
		fill: theme('colors.red.400');
	}

	.vblok {
		fill: theme('colors.green.400');
	}

	.ulanish path {
		fill: none;
		stroke: theme('colors.gray.400');
		stroke-width: 1;
		opacity: 0.55;
	}

	.qator-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 12px;
		font-weight: 600;
		text-anchor: end;
	}

	.q-yoz {
		fill: theme('colors.blue.400');
	}

	.k-yoz {
		fill: theme('colors.red.400');
	}

	.v-yoz {
		fill: theme('colors.green.400');
	}

	.yon-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 11px;
		fill: theme('colors.gray.400');
	}

	.guruh-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 11px;
		fill: theme('colors.gray.500');
		text-anchor: middle;
		font-variant-numeric: tabular-nums;
	}

	/* ---------- hisoblagichlar ---------- */
	.olchov {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.6rem;
	}

	.karta {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.5rem 0.7rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		background: white;
		min-width: 0;
	}

	.karta.asosiy {
		border-color: theme('colors.purple.200');
		background: theme('colors.purple.50');
	}

	.karta-nom {
		font-size: 0.7rem;
		letter-spacing: 0.04em;
		color: theme('colors.gray.400');
		white-space: nowrap;
	}

	.karta-son {
		font-family: theme('fontFamily.mono');
		font-size: 1.15rem;
		line-height: 1.2;
		color: theme('colors.gray.800');
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.karta.asosiy .karta-son {
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.karta-son i {
		font-style: normal;
		font-size: 0.7rem;
		color: theme('colors.gray.400');
	}

	.karta-son.sust {
		font-size: 0.85rem;
		color: theme('colors.gray.400');
	}

	/* ---------- formula ---------- */
	.formula-qator {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		padding-top: 0.7rem;
		border-top: 1px dashed theme('colors.gray.200');
	}

	.formula {
		color: theme('colors.gray.800');
	}

	.formula :global(.katex) {
		font-size: 0.92rem;
	}

	.formula-izoh {
		font-size: 0.78rem;
		line-height: 1.6;
		color: theme('colors.gray.500');
		flex: 1;
		min-width: 260px;
	}

	.formula-izoh strong {
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	/* ---------- muvozanat grafigi ---------- */
	.oq {
		stroke: theme('colors.gray.300');
		stroke-width: 1;
	}

	.tik {
		stroke: theme('colors.gray.300');
		stroke-width: 1;
	}

	.daraja {
		stroke: theme('colors.gray.300');
		stroke-width: 1;
		stroke-dasharray: 3 4;
	}

	.daraja-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 11px;
		fill: theme('colors.gray.400');
	}

	.oq-nom {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 12px;
		fill: theme('colors.gray.500');
		text-anchor: middle;
	}

	.shartli {
		font-family: theme('fontFamily.mono');
		font-size: 10px;
		fill: theme('colors.gray.400');
	}

	.tik-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 11px;
		fill: theme('colors.gray.500');
		text-anchor: middle;
		font-variant-numeric: tabular-nums;
	}

	.egri {
		fill: none;
		stroke: theme('colors.gray.300');
		stroke-width: 1.5;
		stroke-dasharray: 5 5;
	}

	.doira {
		fill: theme('colors.gray.400');
		transition: fill 0.25s ease, r 0.25s ease;
	}

	.nuqta.faol .doira {
		fill: theme('colors.purple.600');
	}

	.halqa {
		fill: none;
		stroke: theme('colors.purple.300');
		stroke-width: 1.5;
	}

	.korsatgich {
		stroke: theme('colors.purple.200');
		stroke-width: 1;
		stroke-dasharray: 2 4;
	}

	.nuqta-nom {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 14px;
		font-weight: 600;
		fill: theme('colors.gray.500');
		text-anchor: middle;
		transition: fill 0.25s ease;
	}

	.nuqta.faol .nuqta-nom {
		fill: theme('colors.purple.700');
	}

	.nuqta-yon {
		font-family: theme('fontFamily.mono');
		font-size: 11px;
		fill: theme('colors.gray.400');
		text-anchor: middle;
	}

	/* ---------- tanlangan variant tavsifi ---------- */
	.tavsif {
		border: 1px solid theme('colors.purple.200');
		border-radius: 6px;
		background: theme('colors.purple.50');
		padding: 0.7rem 0.9rem;
	}

	.tavsif-bosh {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		margin-bottom: 0.35rem;
		flex-wrap: wrap;
	}

	.tavsif-nom {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: theme('colors.purple.700');
	}

	.tavsif-yil {
		font-family: theme('fontFamily.mono');
		font-size: 0.7rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
	}

	.tavsif-kb {
		margin-left: auto;
		font-family: theme('fontFamily.mono');
		font-size: 0.8rem;
		color: theme('colors.gray.600');
		font-variant-numeric: tabular-nums;
	}

	.tavsif-matn {
		font-size: 0.88rem;
		line-height: 1.65;
		color: theme('colors.gray.700');
	}

	@media (prefers-reduced-motion: reduce) {
		.rejim,
		.doira,
		.nuqta-nom {
			transition: none;
		}
	}
</style>
