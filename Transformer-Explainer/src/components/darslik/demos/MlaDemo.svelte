<script lang="ts">
	import { onMount } from 'svelte';
	import Stend from '~/components/darslik/Stend.svelte';
	import Swap from '~/components/darslik/Swap.svelte';
	import Katex from '~/utils/Katex.svelte';
	import { gsap } from '~/utils/gsap';

	// ======================================================================
	// STEND 1 - quvur (pipeline)
	// ======================================================================

	let rejim: string = 'sodda';

	const rejimlar = [
		{ id: 'sodda', label: `sodda MLA` },
		{ id: 'absorb', label: `absorption bilan` }
	];

	// DeepSeek-V2 olchamlari
	const HEAD_DIM = 128;
	const N_HEAD = 128;
	const D_C = 512; // latent
	const D_ROPE = 64; // decoupled rope qismi

	const TOLIQ_KV = 2 * N_HEAD * HEAD_DIM; // har qadamda ochiladigan element
	const MLA_TOKEN = D_C + D_ROPE; // cache: bir token, bir qavat

	// t = 0 -> sodda MLA, t = 1 -> absorption bilan
	let t = 0;
	const jarayon = { t: 0 };
	let tween: any = null;
	let mounted = false;
	let kamHarakat = false;

	function qoll(nishon: number) {
		if (!mounted || kamHarakat) {
			t = nishon;
			return;
		}
		if (tween) tween.kill();
		tween = gsap.to(jarayon, {
			t: nishon,
			duration: 0.5,
			ease: 'power2.out',
			onUpdate: () => {
				t = jarayon.t;
			},
			onComplete: () => {
				t = nishon;
			}
		});
	}

	$: qoll(rejim === 'absorb' ? 1 : 0);

	// sonadigan bloklar: 1 -> 0.2
	$: ochilgan = 1 - 0.8 * t;
	// singdirilgan yol: 0 -> 1
	$: singdirilgan = t;
	// jonli hisoblagich
	$: ochiladigan = Math.round(TOLIQ_KV * (1 - t));

	onMount(() => {
		mounted = true;
		kamHarakat = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		return () => {
			if (tween) tween.kill();
		};
	});

	// ======================================================================
	// STEND 2 - cache taqqoslash
	// ======================================================================

	type Usul = {
		id: string;
		nom: string;
		el: number;
		formula: string;
		sifat: string;
		yangi: boolean;
	};

	const usullar: Usul[] = [
		{
			id: 'mha',
			nom: 'MHA',
			el: 2 * N_HEAD * HEAD_DIM,
			formula: `2 x 128 head x 128`,
			sifat: `asos`,
			yangi: false
		},
		{
			id: 'gqa',
			nom: 'GQA-8',
			el: 2 * 8 * HEAD_DIM,
			formula: `2 x 8 guruh x 128`,
			sifat: `sifatdan chegirma`,
			yangi: false
		},
		{
			id: 'mla',
			nom: 'MLA',
			el: D_C + D_ROPE,
			formula: `512 latent + 64 rope`,
			sifat: `chegirmasiz`,
			yangi: true
		}
	];

	const ENG_KATTA = usullar[0].el;

	let shkala: string = 'chiziqli';
	const shkalalar = [
		{ id: 'chiziqli', label: `chiziqli` },
		{ id: 'log', label: `logarifmik` }
	];

	const KONTEKSTLAR = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];
	let kIdx = 5;
	let qavat = 32;

	$: kontekst = KONTEKSTLAR[kIdx];

	function ulush(el: number, sh: string): number {
		const nisbiy = sh === 'log' ? Math.log2(el) / Math.log2(ENG_KATTA) : el / ENG_KATTA;
		return Math.max(nisbiy, 0.004);
	}

	function xotira(el: number, tokenlar: number, qav: number): string {
		const bayt = el * tokenlar * qav * 2; // bf16 = 2 bayt
		const gb = bayt / 1024 ** 3;
		if (gb >= 1) return (gb >= 10 ? gb.toFixed(0) : gb.toFixed(1)) + ' GB';
		const mb = bayt / 1024 ** 2;
		if (mb >= 1) return (mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)) + ' MB';
		return (bayt / 1024).toFixed(0) + ' KB';
	}

	function nisbat(el: number): string {
		const r = ENG_KATTA / el;
		if (r < 1.01) return `asos`;
		const s = Math.abs(r - Math.round(r)) < 0.05 ? String(Math.round(r)) : r.toFixed(1);
		return s + `x kichik`;
	}

	// ======================================================================
	// yordamchi
	// ======================================================================

	function son(v: number): string {
		return Math.round(v)
			.toString()
			.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	}

	const XOTIRA_F = String.raw`\text{xotira} = \text{el/token} \times \text{token} \times \text{qavat} \times 2\,\text{bayt}`;
</script>

<!-- ====================================================================== -->
<!-- STEND 1                                                                -->
<!-- ====================================================================== -->
<Stend
	title="MLA quvuri: nima saqlanadi, nima hisoblanadi"
	izoh={`Rejimni "absorption bilan" ga o'tkazing: yuqoriga proyeksiya bloklari va to'liq K, V so'nadi. Ular yo'qolib qolmaydi - W_Q va W_O ichiga singdiriladi. Shuning uchun siqish hisob qo'shmaydi.`}
>
	<svelte:fragment slot="boshqaruv">
		<Swap label="Rejim" bind:value={rejim} options={rejimlar} />
	</svelte:fragment>

	<div class="mla">
		<div class="sxema">
			<svg
				viewBox="0 0 820 306"
				role="img"
				aria-label="MLA quvuri: token vektori h dan latent c ga, cache, va undan K va V ga yuqoriga proyeksiya"
			>
				<defs>
					<marker
						id="mla-ok"
						viewBox="0 0 9 9"
						refX="8.5"
						refY="4.5"
						markerWidth="9"
						markerHeight="9"
						markerUnits="userSpaceOnUse"
						orient="auto"
					>
						<path class="ok-uch" d="M0 0 L9 4.5 L0 9 Z" />
					</marker>
					<marker
						id="mla-ok-p"
						viewBox="0 0 9 9"
						refX="8.5"
						refY="4.5"
						markerWidth="9"
						markerHeight="9"
						markerUnits="userSpaceOnUse"
						orient="auto"
					>
						<path class="ok-uch-p" d="M0 0 L9 4.5 L0 9 Z" />
					</marker>
				</defs>

				<!-- ---------- CACHE hududi ---------- -->
				<rect class="cache-ramka" x="248" y="14" width="152" height="224" rx="8" />
				<rect class="cache-legend" x="278" y="5" width="94" height="18" />
				<g class="qulf">
					<rect x="286" y="11" width="9" height="7.5" rx="1.5" />
					<path d="M288 11 V9.2 a2.4 2.4 0 0 1 4.8 0 V11" />
				</g>
				<text class="cache-nom" x="335" y="18">CACHE</text>
				<text class="cache-izoh" x="324" y="256">faqat shu saqlanadi</text>
				<text class="cache-son" x="324" y="273">512 + 64 = 576 el./token</text>

				<!-- ---------- doimiy chiziqlar ---------- -->
				<g class="chiziq">
					<path d="M50 121 H60" />
					<path d="M60 52 V190" />
					<path d="M60 52 H72" marker-end="url(#mla-ok)" />
					<path d="M60 190 H72" marker-end="url(#mla-ok)" />
					<path d="M164 52 H176" marker-end="url(#mla-ok)" />
					<path d="M242 52 H258" marker-end="url(#mla-ok)" />
					<path d="M164 190 H258" marker-end="url(#mla-ok)" />
				</g>

				<!-- rope shoxi: hech qachon singdirilmaydi -->
				<path class="rope-chiziq" d="M400 52 H644 V114 H654" marker-end="url(#mla-ok-p)" />
				<text class="chiziq-yoz" x="516" y="42">rope qismi - hamma head uchun bitta</text>

				<!-- ---------- doimiy qutilar ---------- -->
				<g class="quti">
					<rect x="6" y="99" width="44" height="44" rx="5" />
					<rect x="76" y="30" width="88" height="44" rx="5" />
					<rect x="180" y="30" width="62" height="44" rx="5" />
					<rect x="76" y="168" width="88" height="44" rx="5" />
				</g>
				<text class="quti-nom" x="28" y="126">h</text>
				<text class="quti-nom" x="120" y="57">W_KR</text>
				<text class="quti-nom" x="211" y="57">RoPE</text>
				<text class="quti-nom" x="120" y="195">W_DKV</text>
				<text class="olcham" x="28" y="158">token</text>
				<text class="olcham" x="120" y="88">d_model &#8594; 64</text>
				<text class="olcham" x="211" y="88">burish</text>
				<text class="olcham" x="120" y="226">d_model &#8594; 512</text>

				<!-- ---------- cache ichidagi qutilar ---------- -->
				<g class="quti cache-quti">
					<rect x="262" y="30" width="118" height="44" rx="5" />
					<rect x="262" y="168" width="118" height="44" rx="5" />
				</g>
				<text class="cache-quti-nom" x="321" y="57">k_rope</text>
				<text class="cache-quti-nom" x="321" y="195">c (latent)</text>
				<text class="olcham olcham-p" x="321" y="88">64</text>
				<text class="olcham olcham-p" x="321" y="226">512</text>

				<!-- ---------- yuqoriga proyeksiya: absorption'da so'nadi ---------- -->
				<g class="singar" class:sonik={rejim === 'absorb'} style="opacity:{ochilgan}">
					<g class="chiziq">
						<path d="M400 190 H404" />
						<path d="M404 128 V252" />
						<path d="M404 128 H414" marker-end="url(#mla-ok)" />
						<path d="M404 252 H414" marker-end="url(#mla-ok)" />
						<path d="M504 128 H514" marker-end="url(#mla-ok)" />
						<path d="M504 252 H514" marker-end="url(#mla-ok)" />
						<path d="M632 128 H654" marker-end="url(#mla-ok)" />
						<path d="M632 252 H654" marker-end="url(#mla-ok)" />
					</g>

					<g class="quti">
						<rect x="416" y="106" width="88" height="44" rx="5" />
						<rect x="416" y="230" width="88" height="44" rx="5" />
					</g>
					<text class="quti-nom" x="460" y="133">W_UK</text>
					<text class="quti-nom" x="460" y="257">W_UV</text>
					<text class="olcham" x="460" y="164">512 &#8594; 128&#215;128</text>
					<text class="olcham" x="460" y="288">512 &#8594; 128&#215;128</text>

					<g class="quti k-quti"><rect x="520" y="106" width="112" height="44" rx="5" /></g>
					<g class="quti v-quti"><rect x="520" y="230" width="112" height="44" rx="5" /></g>
					<text class="quti-nom k-nom" x="576" y="133">K (to'liq)</text>
					<text class="quti-nom v-nom" x="576" y="257">V (to'liq)</text>
					<text class="olcham" x="576" y="164">128 head &#215; 128 = 16 384</text>
					<text class="olcham" x="576" y="288">128 head &#215; 128 = 16 384</text>
				</g>

				<!-- ---------- singdirilgan yo'l: faqat absorption'da ---------- -->
				<g class="singdi" style="opacity:{singdirilgan}">
					<path class="trunk" d="M400 190 H736" />
					<path class="trunk" d="M690 190 V152" marker-end="url(#mla-ok-p)" />
					<path class="trunk" d="M736 190 V226" marker-end="url(#mla-ok-p)" />
					<text class="trunk-yoz" x="545" y="182">attention bevosita c ustida</text>

					<rect class="pill" x="418" y="117" width="84" height="22" rx="4" />
					<text class="pill-yoz" x="460" y="132">W_Q ichida</text>
					<rect class="pill" x="418" y="241" width="84" height="22" rx="4" />
					<text class="pill-yoz" x="460" y="256">W_O ichida</text>
				</g>

				<!-- ---------- chiqish qutilari ---------- -->
				<g class="quti chek-quti">
					<rect x="658" y="104" width="150" height="44" rx="5" />
					<rect x="658" y="230" width="150" height="44" rx="5" />
				</g>
				<text class="quti-nom" x="733" y="131">Q &#183; K &#8594; ball</text>
				<text class="quti-nom" x="733" y="257">W_O &#8594; chiqish</text>
			</svg>
		</div>

		<div class="hisob">
			<div class="hisob-raqamlar">
				<div class="hisob-bir" class:tinch={rejim === 'absorb'}>
					<span class="hisob-nom">har qadamda ochiladigan element</span>
					<span class="hisob-son">{son(ochiladigan)}</span>
				</div>
				<div class="hisob-bir">
					<span class="hisob-nom">cache: bir token, bir qavat</span>
					<span class="hisob-son">{son(MLA_TOKEN)}</span>
				</div>
			</div>

			{#if rejim === 'absorb'}
				<p class="hisob-matn">
					<span class="belgi-p">absorption</span>
					<code>W_UK</code> ni <code>W_Q</code> ichiga, <code>W_UV</code> ni
					<code>W_O</code>
					ichiga ko'chirdik - matritsalar ko'paytmasi assotsiativ bo'lgani uchun bunga ruxsat bor.
					To'liq K va V umuman yaratilmaydi.
				</p>
			{:else}
				<p class="hisob-matn">
					<span class="belgi-g">sodda</span>
					Har qadamda <code>c</code> ochiladi va to'liq K bilan V xotirada quriladi. Cache kichik,
					lekin hisob qaytib keldi - siqishdan foyda yo'qoladi.
				</p>
			{/if}
		</div>
	</div>
</Stend>

<!-- ====================================================================== -->
<!-- STEND 2                                                                -->
<!-- ====================================================================== -->
<Stend
	title="Bir token uchun cache - uch usul"
	izoh={`MLA GQA'dan ham kichik. Lekin asosiy farq boshqa joyda: MQA va GQA sifatdan chegirma evaziga tejaydi, MLA esa chegirma so'ramaydi.`}
>
	<svelte:fragment slot="boshqaruv">
		<Swap label="Shkala" bind:value={shkala} options={shkalalar} />
		<label class="slayder">
			<span class="slayder-nom">kontekst</span>
			<input type="range" min="0" max="7" step="1" bind:value={kIdx} aria-label="kontekst uzunligi" />
			<span class="slayder-son slayder-keng">{son(kontekst)}</span>
		</label>
		<label class="slayder">
			<span class="slayder-nom">qavat</span>
			<input type="range" min="8" max="80" step="4" bind:value={qavat} aria-label="qavatlar soni" />
			<span class="slayder-son">{qavat}</span>
		</label>
	</svelte:fragment>

	<div class="taq">
		<div class="taq-bosh">
			<span class="taq-chap">bir token, bir qavat uchun saqlanadigan element</span>
			<span class="taq-ong">{son(kontekst)} token &#215; {qavat} qavat &#215; bf16</span>
		</div>

		{#each usullar as u (u.id)}
			<div class="qator q-{u.id}" class:yangi={u.yangi}>
				<div class="qator-bosh">
					<span class="u-nom">{u.nom}</span>
					<span class="u-formula">{u.formula}</span>
					<span class="u-sifat">{u.sifat}</span>
				</div>
				<div class="trek">
					<span class="trek-yo">
						<span class="bar" style="width:{(ulush(u.el, shkala) * 100).toFixed(3)}%" />
					</span>
					<span class="bar-son">{son(u.el)}</span>
				</div>
				<div class="qator-oyoq">
					<span class="nisbat">MHA ga nisbatan: {nisbat(u.el)}</span>
					<span class="xot">{xotira(u.el, kontekst, qavat)}</span>
				</div>
			</div>
		{/each}

		<div class="taq-oyoq">
			<Katex math={XOTIRA_F} />
			<span class="taq-eslatma">
				qavat sonini o'zingiz tanlaysiz - u modelga qarab farq qiladi.
				{shkala === 'log' ? `Logarifmik shkala kichik ustunlarni taqqoslash uchun.` : `Chiziqli shkala haqiqiy nisbatni ko'rsatadi.`}
			</span>
		</div>
	</div>
</Stend>

<style lang="scss">
	/* ====================== umumiy ====================== */
	.mla,
	.taq {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		min-width: 700px;
	}

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
		font-size: 0.76rem;
		color: theme('colors.gray.800');
		font-variant-numeric: tabular-nums;
		min-width: 2.4em;
		text-align: right;
	}

	.slayder-keng {
		min-width: 4.6em;
	}

	/* ====================== STEND 1: sxema ====================== */
	.sxema svg {
		width: 100%;
		height: auto;
		display: block;
	}

	.ok-uch {
		fill: theme('colors.gray.400');
	}

	.ok-uch-p {
		fill: theme('colors.purple.500');
	}

	.chiziq path {
		fill: none;
		stroke: theme('colors.gray.300');
		stroke-width: 1.5;
	}

	.rope-chiziq {
		fill: none;
		stroke: theme('colors.purple.400');
		stroke-width: 1.5;
	}

	.chiziq-yoz {
		font-size: 11px;
		fill: theme('colors.purple.500');
		text-anchor: middle;
	}

	.quti rect {
		fill: white;
		stroke: theme('colors.gray.300');
		stroke-width: 1;
		transition: fill 0.45s ease, stroke 0.45s ease;
	}

	.quti-nom {
		font-family: theme('fontFamily.mono');
		font-size: 13px;
		fill: theme('colors.gray.700');
		text-anchor: middle;
		transition: fill 0.45s ease;
	}

	.olcham {
		font-family: theme('fontFamily.mono');
		font-size: 10px;
		fill: theme('colors.gray.400');
		text-anchor: middle;
	}

	.olcham-p {
		fill: theme('colors.purple.500');
	}

	/* cache hududi */
	.cache-ramka {
		fill: theme('colors.purple.50');
		stroke: theme('colors.purple.400');
		stroke-width: 2;
	}

	.cache-legend {
		fill: white;
		stroke: none;
	}

	.qulf rect {
		fill: none;
		stroke: theme('colors.purple.600');
		stroke-width: 1.2;
	}

	.qulf path {
		fill: none;
		stroke: theme('colors.purple.600');
		stroke-width: 1.2;
	}

	.cache-nom {
		font-family: theme('fontFamily.mono');
		font-size: 11px;
		letter-spacing: 0.12em;
		fill: theme('colors.purple.700');
		text-anchor: middle;
	}

	.cache-izoh {
		font-size: 11px;
		fill: theme('colors.gray.500');
		text-anchor: middle;
	}

	.cache-son {
		font-family: theme('fontFamily.mono');
		font-size: 11px;
		fill: theme('colors.purple.700');
		text-anchor: middle;
	}

	.cache-quti rect {
		fill: white;
		stroke: theme('colors.purple.400');
		stroke-width: 1.5;
	}

	.cache-quti-nom {
		font-family: theme('fontFamily.mono');
		font-size: 13px;
		fill: theme('colors.purple.700');
		text-anchor: middle;
	}

	/* K va V */
	.k-quti rect {
		fill: theme('colors.red.50');
		stroke: theme('colors.red.300');
	}

	.v-quti rect {
		fill: theme('colors.green.50');
		stroke: theme('colors.green.300');
	}

	.k-nom {
		fill: theme('colors.red.500');
	}

	.v-nom {
		fill: theme('colors.green.600');
	}

	.chek-quti rect {
		fill: theme('colors.gray.50');
		stroke: theme('colors.gray.300');
		stroke-dasharray: 4 3;
	}

	/* so'ngan holat */
	.singar.sonik .quti rect {
		fill: theme('colors.gray.50');
		stroke: theme('colors.gray.300');
	}

	.singar.sonik .quti-nom {
		fill: theme('colors.gray.400');
	}

	/* singdirilgan yo'l */
	.trunk {
		fill: none;
		stroke: theme('colors.purple.600');
		stroke-width: 2;
	}

	.trunk-yoz {
		font-size: 11px;
		fill: theme('colors.purple.600');
		text-anchor: middle;
	}

	.pill {
		fill: white;
		stroke: theme('colors.purple.500');
		stroke-width: 1.2;
	}

	.pill-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 11px;
		fill: theme('colors.purple.700');
		text-anchor: middle;
	}

	/* ---------- hisob paneli ---------- */
	.hisob {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		border-top: 1px dashed theme('colors.gray.200');
		padding-top: 0.85rem;
	}

	.hisob-raqamlar {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.7rem;
	}

	.hisob-bir {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.7rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		padding: 0.45rem 0.7rem;
		background: white;
		transition: border-color 0.35s ease, background 0.35s ease;
	}

	.hisob-bir.tinch {
		border-color: theme('colors.purple.300');
		background: theme('colors.purple.50');
	}

	.hisob-nom {
		font-size: 0.74rem;
		color: theme('colors.gray.500');
	}

	.hisob-son {
		font-family: theme('fontFamily.mono');
		font-size: 1.05rem;
		color: theme('colors.gray.800');
		font-variant-numeric: tabular-nums;
	}

	.hisob-bir.tinch .hisob-son {
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.hisob-matn {
		font-size: 0.84rem;
		line-height: 1.65;
		color: theme('colors.gray.600');
		margin: 0;
	}

	.hisob-matn code {
		font-family: theme('fontFamily.mono');
		font-size: 0.9em;
		background: theme('colors.gray.50');
		color: theme('colors.gray.700');
		padding: 0.05rem 0.25rem;
		border-radius: 3px;
	}

	.belgi-p,
	.belgi-g {
		font-family: theme('fontFamily.mono');
		font-size: 0.7rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.1rem 0.35rem;
		border-radius: 3px;
		margin-right: 0.3rem;
	}

	.belgi-p {
		background: theme('colors.purple.100');
		color: theme('colors.purple.700');
	}

	.belgi-g {
		background: theme('colors.gray.100');
		color: theme('colors.gray.500');
	}

	/* ====================== STEND 2: taqqoslash ====================== */
	.taq-bosh {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 0.3rem;
		border-bottom: 1px solid theme('colors.gray.100');
	}

	.taq-chap {
		font-size: 0.78rem;
		color: theme('colors.gray.500');
	}

	.taq-ong {
		font-family: theme('fontFamily.mono');
		font-size: 0.74rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.qator {
		display: flex;
		flex-direction: column;
		gap: 0.32rem;
		padding: 0.6rem 0.7rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
	}

	.qator.yangi {
		border-color: theme('colors.purple.200');
		background: theme('colors.purple.50');
	}

	.qator-bosh {
		display: flex;
		align-items: baseline;
		gap: 0.7rem;
	}

	.u-nom {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.95rem;
		font-weight: 600;
		color: theme('colors.gray.500');
		min-width: 4.4em;
	}

	.qator.yangi .u-nom {
		color: theme('colors.purple.700');
	}

	.u-formula {
		font-family: theme('fontFamily.mono');
		font-size: 0.72rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
	}

	.u-sifat {
		margin-left: auto;
		font-size: 0.7rem;
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
		background: theme('colors.gray.100');
		color: theme('colors.gray.500');
		white-space: nowrap;
	}

	.qator.yangi .u-sifat {
		background: theme('colors.purple.100');
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.trek {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.trek-yo {
		position: relative;
		flex: 1;
		height: 20px;
		background: white;
		border: 1px solid theme('colors.gray.200');
		border-radius: 3px;
		overflow: hidden;
	}

	.bar {
		display: block;
		height: 100%;
		border-radius: 2px 0 0 2px;
		transition: width 0.35s ease;
	}

	.q-mha .bar {
		background: theme('colors.gray.300');
	}

	.q-gqa .bar {
		background: theme('colors.gray.500');
	}

	.q-mla .bar {
		background: theme('colors.purple.600');
	}

	.bar-son {
		font-family: theme('fontFamily.mono');
		font-size: 0.8rem;
		color: theme('colors.gray.800');
		font-variant-numeric: tabular-nums;
		min-width: 5em;
		text-align: right;
	}

	.qator.yangi .bar-son {
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.qator-oyoq {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.7rem;
	}

	.nisbat {
		font-size: 0.72rem;
		color: theme('colors.gray.400');
	}

	.xot {
		font-family: theme('fontFamily.mono');
		font-size: 0.82rem;
		color: theme('colors.gray.700');
		font-variant-numeric: tabular-nums;
	}

	.qator.yangi .xot {
		color: theme('colors.purple.700');
	}

	.taq-oyoq {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.25rem;
		flex-wrap: wrap;
		padding-top: 0.5rem;
		border-top: 1px dashed theme('colors.gray.200');
		color: theme('colors.gray.600');
	}

	.taq-oyoq :global(.katex) {
		font-size: 0.82rem;
	}

	.taq-eslatma {
		font-size: 0.74rem;
		color: theme('colors.gray.400');
		max-width: 42ch;
		line-height: 1.5;
	}

	@media (prefers-reduced-motion: reduce) {
		.bar,
		.quti rect,
		.quti-nom,
		.hisob-bir {
			transition: none;
		}
	}
</style>
