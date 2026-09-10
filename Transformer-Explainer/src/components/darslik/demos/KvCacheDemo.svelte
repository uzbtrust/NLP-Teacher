<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Stend from '~/components/darslik/Stend.svelte';
	import Swap from '~/components/darslik/Swap.svelte';
	import Katex from '~/utils/Katex.svelte';
	import { gsap } from '~/utils/gsap';

	// ======================================================================
	// UMUMIY
	// ======================================================================
	let mounted = false;
	let kamHarakat = false;

	onMount(() => {
		mounted = true;
		kamHarakat = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		korsat = jami;
		return () => {
			if (sonTween) sonTween.kill();
		};
	});

	function fmt(v: number, n = 2): string {
		return v.toFixed(n);
	}

	// 1234567 -> "1 234 567"
	function guruh(n: number): string {
		const s = String(Math.round(n));
		let r = '';
		for (let i = 0; i < s.length; i++) {
			if (i > 0 && (s.length - i) % 3 === 0) r += ' ';
			r += s[i];
		}
		return r;
	}

	// ======================================================================
	// STEND 1 - cache yo'q / cache bor
	// ======================================================================
	const TOKENLAR = [`Bugun`, `havo`, `juda`, `issiq`, `va`, `shamol`, `umuman`, `yo'q`];
	const N = TOKENLAR.length;

	const REJIMLAR = [
		{ id: 'yoq', label: `Cache yo'q` },
		{ id: 'bor', label: `Cache bor` }
	];
	let rejim = 'bor';

	// sahifa ochilganda demo darhol o'qiladigan holatda tursin
	let qadam = 3; // nechta token yozib bo'lindi
	let refs: HTMLElement[] = [];

	type KatakHolat = 'bosh' | 'yangi' | 'cache';

	$: kataklar = TOKENLAR.map((t, i) => {
		let h: KatakHolat;
		if (i >= qadam) h = 'bosh';
		else if (rejim === 'yoq') h = 'yangi';
		else h = i === qadam - 1 ? 'yangi' : 'cache';
		return { i, token: t, holat: h, hozir: i === qadam - 1 };
	});

	// n ta qadamdan keyin hisoblangan K/V juftlari
	$: jamiYoq = (qadam * (qadam + 1)) / 2; // 1 + 2 + ... + n
	$: jamiBor = qadam; // har qadamda bitta
	$: jami = rejim === 'yoq' ? jamiYoq : jamiBor;
	$: ortiqcha = jamiYoq - jamiBor;

	// hisoblagichni silliq o'zgartirish
	let korsat = 0;
	let sonTween: any = null;

	function qollaSon(nishon: number) {
		if (!mounted || kamHarakat) {
			korsat = nishon;
			return;
		}
		if (sonTween) sonTween.kill();
		const o = { v: korsat };
		sonTween = gsap.to(o, {
			v: nishon,
			duration: 0.35,
			ease: 'power2.out',
			onUpdate: () => (korsat = o.v),
			onComplete: () => (korsat = nishon)
		});
	}

	$: qollaSon(jami);

	function chaqnat() {
		if (!mounted || kamHarakat) return;
		if (rejim === 'yoq') {
			// hamma token qaytadan hisoblanadi - ortiqcha ish ko'rinib tursin
			const els = refs.slice(0, qadam).filter(Boolean);
			if (!els.length) return;
			gsap.fromTo(
				els,
				{ opacity: 0.2, y: 5 },
				{
					opacity: 1,
					y: 0,
					duration: 0.4,
					ease: 'power2.out',
					stagger: 0.035,
					clearProps: 'opacity,transform'
				}
			);
		} else {
			const el = refs[qadam - 1];
			if (!el) return;
			gsap.fromTo(
				el,
				{ opacity: 0, y: 8 },
				{ opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,transform' }
			);
		}
	}

	async function keyingi() {
		if (qadam >= N) return;
		qadam += 1;
		await tick();
		chaqnat();
	}

	function boshidan() {
		qadam = 0;
		const els = refs.filter(Boolean);
		if (els.length) gsap.set(els, { clearProps: 'opacity,transform' });
	}

	const OSISH_YOQ = String.raw`\tfrac{n(n+1)}{2}\;\approx\;\tfrac{n^2}{2}`;
	const OSISH_BOR = String.raw`n`;

	// ======================================================================
	// STEND 2 - xotira kalkulyatori
	// ======================================================================
	type Model = {
		id: string;
		label: string;
		qavat: number;
		kvHead: number;
		headDim: number;
		bayt: number;
		attn: string;
		moljalTokenlar: number;
		moljalNatija: string;
	};

	const MODELLAR: Model[] = [
		{
			id: 'gpt2',
			label: 'GPT-2 small',
			qavat: 12,
			kvHead: 12,
			headDim: 64,
			bayt: 2,
			attn: 'MHA',
			moljalTokenlar: 1024,
			moljalNatija: '36 MB'
		},
		{
			id: 'llama2',
			label: 'Llama 2 7B',
			qavat: 32,
			kvHead: 32,
			headDim: 128,
			bayt: 2,
			attn: 'MHA',
			moljalTokenlar: 4096,
			moljalNatija: '2 GB'
		},
		{
			id: 'llama3',
			label: 'Llama 3 8B',
			qavat: 32,
			kvHead: 8,
			headDim: 128,
			bayt: 2,
			attn: 'GQA',
			moljalTokenlar: 8192,
			moljalNatija: '1 GB'
		}
	];

	const MODEL_TANLOV = MODELLAR.map((m) => ({ id: m.id, label: m.label }));

	let modelId = 'llama3';
	$: model = MODELLAR.find((m) => m.id === modelId) || MODELLAR[0];

	const UZUNLIKLAR = [128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
	let uzIdx = 6; // 8192
	$: uzunlik = UZUNLIKLAR[uzIdx];

	let sorov = 1;

	const GB = 1073741824;
	const MB = 1048576;
	const KB = 1024;
	const CHEGARA_GB = 80; // H100

	$: baytToken = 2 * model.qavat * model.kvHead * model.headDim * model.bayt;
	$: kbToken = baytToken / KB;
	$: bittaSorov = baytToken * uzunlik;
	$: jamiBayt = bittaSorov * sorov;
	$: gb = jamiBayt / GB;
	$: ulush = gb / CHEGARA_GB;
	$: oshdi = gb > CHEGARA_GB;

	function hajmSon(bayt: number): string {
		const g = bayt / GB;
		if (g >= 1) return fmt(g, g >= 100 ? 0 : g >= 10 ? 1 : 2);
		const m = bayt / MB;
		return fmt(m, m >= 100 ? 0 : m >= 10 ? 1 : 2);
	}

	function hajmBirlik(bayt: number): string {
		return bayt / GB >= 1 ? 'GB' : 'MB';
	}

	const FORMULA = String.raw`\text{bayt/token} \;=\; 2 \times L \times h_{kv} \times d_h \times b`;
	const FORMULA_TARIF = String.raw`L=\text{qavatlar},\; h_{kv}=\text{KV head},\; d_h=\text{head o'lchami},\; b=\text{bayt/son}`;
</script>

<div class="kv-demo">
	<!-- ================================================================ -->
	<!-- STEND 1                                                          -->
	<!-- ================================================================ -->
	<Stend
		title="Har qadamda qancha K/V hisoblanadi"
		izoh={`"Keyingi token" ni bosib boring. Cache yo'q rejimida har qadam butun ketma-ketlikni qaytadan hisoblaydi va hisoblagich kvadratik o'sadi; cache bor rejimida har qadam faqat bitta yangi juft qo'shiladi. Sakkiz token uchun farq 36 va 8 - bir xil natija, to'rt yarim barobar kam ish.`}
	>
		<svelte:fragment slot="boshqaruv">
			<Swap label="Rejim" bind:value={rejim} options={REJIMLAR} />
			<button type="button" class="tugma asosiy" on:click={keyingi} disabled={qadam >= N}>
				Keyingi token
			</button>
			<button type="button" class="tugma" on:click={boshidan} disabled={qadam === 0}>
				Boshidan
			</button>
		</svelte:fragment>

		<div class="stend1">
			<div class="jadval">
				<div class="yon">
					<span class="yon-yoz kichik">qadam</span>
					<span class="yon-yoz">token</span>
					<span class="yon-yoz mono">K</span>
					<span class="yon-yoz mono">V</span>
					<span class="yon-yoz kichik"></span>
				</div>

				<div class="ustunlar">
					{#each kataklar as k (k.i)}
						<div class="ustun" bind:this={refs[k.i]}>
							<span class="qadam-yoz" class:hozir={k.hozir} class:bor={k.holat !== 'bosh'}>
								{k.holat === 'bosh' ? '' : k.i + 1}
							</span>

							<span class="tok" class:bosh={k.holat === 'bosh'}>{k.token}</span>

							<span class="quti {k.holat}">k<sub>{k.i}</sub></span>
							<span class="quti {k.holat}">v<sub>{k.i}</sub></span>

							<span class="belgi {k.holat}">
								{k.holat === 'yangi' ? 'yangi' : k.holat === 'cache' ? 'cache' : ''}
							</span>
						</div>
					{/each}
				</div>
			</div>

			<p class="izoh-qator">
				<i class="nuq yangi-nuq"></i> shu qadamda hisoblandi
				<span class="ayirgich">&middot;</span>
				<i class="nuq cache-nuq"></i> cache'dan olindi
				<span class="ayirgich">&middot;</span>
				q faqat yangi token uchun hisoblanadi va darhol ishlatiladi &mdash; shuning uchun Q cache
				degan narsa yo'q
			</p>

			<div class="hisob">
				<div class="hisob-asos" class:kop={rejim === 'yoq'}>
					<span class="hisob-nom">shu paytgacha hisoblangan K/V juftlari</span>
					<span class="hisob-son">{Math.round(korsat)}</span>
				</div>

				<div class="hisob-yon">
					<div class="qator" class:faol={rejim === 'yoq'}>
						<i class="nuq eski-nuq"></i>
						<span class="qator-nom">Cache yo'q</span>
						<span class="qator-son">{jamiYoq}</span>
						<span class="qator-f"><Katex math={OSISH_YOQ} /></span>
					</div>
					<div class="qator" class:faol={rejim === 'bor'}>
						<i class="nuq yangi-nuq"></i>
						<span class="qator-nom">Cache bor</span>
						<span class="qator-son">{jamiBor}</span>
						<span class="qator-f"><Katex math={OSISH_BOR} /></span>
					</div>
					<div class="qator ortiq">
						<span class="qator-nom">ortiqcha ish</span>
						<span class="qator-son">{ortiqcha}</span>
						<span class="qator-f kulrang">juft</span>
					</div>
				</div>
			</div>
		</div>
	</Stend>

	<!-- ================================================================ -->
	<!-- STEND 2                                                          -->
	<!-- ================================================================ -->
	<Stend
		title="Cache qancha joy egallaydi"
		izoh={`Cache o'lchami kontekst uzunligiga chiziqli o'sadi va bu faqat bitta foydalanuvchi uchun. Parallel so'rovlar soniga ko'paytiring - server nechta so'rovni bir vaqtda uddalashi aynan shu raqamga tayanadi.`}
	>
		<svelte:fragment slot="boshqaruv">
			<Swap label="Model" bind:value={modelId} options={MODEL_TANLOV} />

			<label class="slayder">
				<span class="slayder-nom">Kontekst</span>
				<input
					type="range"
					min="0"
					max={UZUNLIKLAR.length - 1}
					step="1"
					bind:value={uzIdx}
					aria-label="Kontekst uzunligi"
				/>
				<span class="slayder-son">{guruh(uzunlik)}</span>
			</label>

			<label class="slayder">
				<span class="slayder-nom">Parallel so'rov</span>
				<input type="range" min="1" max="32" step="1" bind:value={sorov} aria-label="Parallel so'rovlar soni" />
				<span class="slayder-son qisqa">{sorov}</span>
			</label>
		</svelte:fragment>

		<div class="stend2">
			<!-- model konfiguratsiyasi -->
			<div class="konfig">
				<span class="chip">L = {model.qavat}</span>
				<span class="chip">KV head = {model.kvHead}</span>
				<span class="chip attn">{model.attn}</span>
				<span class="chip">d<sub>h</sub> = {model.headDim}</span>
				<span class="chip">fp16 &middot; {model.bayt} bayt</span>
				<span class="chip moljal">
					mo'ljal: {guruh(model.moljalTokenlar)} token, 1 so'rov = {model.moljalNatija}
				</span>
			</div>

			<!-- formula -->
			<div class="formula-blok">
				<div class="formula"><Katex math={FORMULA} /></div>
				<div class="tarif"><Katex math={FORMULA_TARIF} /></div>
				<div class="son-formula">
					2 &times; {model.qavat} &times; {model.kvHead} &times; {model.headDim} &times; {model.bayt}
					= {guruh(baytToken)} bayt = {guruh(kbToken)} KB
				</div>
			</div>

			<!-- katta raqamlar -->
			<div class="raqamlar">
				<div class="raqam">
					<span class="raqam-nom">bir token uchun</span>
					<span class="raqam-son">{guruh(kbToken)}<span class="birlik">KB</span></span>
				</div>
				<div class="raqam">
					<span class="raqam-nom">{guruh(uzunlik)} token, 1 so'rov</span>
					<span class="raqam-son kichikroq">
						{hajmSon(bittaSorov)}<span class="birlik">{hajmBirlik(bittaSorov)}</span>
					</span>
				</div>
				<div class="raqam asosiy-raqam" class:ogoh={oshdi}>
					<span class="raqam-nom">jami cache &middot; {sorov} so'rov</span>
					<span class="raqam-son">
						{hajmSon(jamiBayt)}<span class="birlik">{hajmBirlik(jamiBayt)}</span>
					</span>
				</div>
			</div>

			<!-- ustun -->
			<div class="olcham">
				<div class="olcham-bosh">
					<span class="olcham-nom">H100 xotirasiga nisbatan</span>
					<span class="olcham-son" class:ogoh={oshdi}>
						{oshdi ? `80 GB dan oshdi (x${fmt(ulush, 1)})` : `${fmt(ulush * 100, 1)}%`}
					</span>
				</div>

				<div class="chiziq">
					<div
						class="chiziq-ich"
						class:oshgan={oshdi}
						style="width:{Math.min(1, ulush) * 100}%"
					></div>
				</div>

				<div class="olcham-oyoq">
					<span>0</span>
					<span class="oyoq-ong">80 GB &mdash; H100 ning butun xotirasi (vaznlar bilan birga)</span>
				</div>
			</div>

			{#if oshdi}
				<p class="ogoh-matn">
					Bu hajmdagi cache bitta kartaga sig'maydi &mdash; model vaznlari ham o'sha 80 GB ichida
					turishi kerak. Server bunday holatda parallel so'rovlar sonini kamaytiradi yoki cache'ni
					kichraytiradigan usulga o'tadi.
				</p>
			{/if}
		</div>
	</Stend>
</div>

<style lang="scss">
	.kv-demo {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* ================= boshqaruv ================= */
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
		min-width: 3.8em;
		text-align: right;
	}

	.slayder-son.qisqa {
		min-width: 1.8em;
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

		&:hover:not(:disabled) {
			border-color: theme('colors.purple.300');
			background: theme('colors.purple.50');
			color: theme('colors.purple.700');
		}

		&:disabled {
			opacity: 0.4;
			cursor: default;
		}
	}

	.tugma.asosiy {
		border-color: theme('colors.purple.300');
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	/* ================= STEND 1 ================= */
	.stend1 {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 620px;
	}

	.jadval {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
	}

	.yon,
	.ustun {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.yon {
		width: 52px;
		flex: none;
		text-align: right;
	}

	.yon-yoz {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		height: 24px;
		font-size: 0.72rem;
		color: theme('colors.gray.400');
	}

	.yon-yoz.kichik {
		height: 16px;
		font-size: 0.62rem;
		color: theme('colors.gray.300');
	}

	.yon-yoz.mono {
		font-family: theme('fontFamily.mono');
		color: theme('colors.gray.500');
	}

	.ustunlar {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: 5px;
		flex: 1;
		min-width: 0;
	}

	.ustun {
		min-width: 0;
	}

	.qadam-yoz {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 16px;
		font-family: theme('fontFamily.mono');
		font-size: 0.62rem;
		font-variant-numeric: tabular-nums;
		color: theme('colors.gray.300');
		transition: color 0.25s ease;
	}

	.qadam-yoz.hozir {
		color: theme('colors.purple.600');
		font-weight: 700;
	}

	.tok {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 24px;
		font-size: 0.74rem;
		color: theme('colors.gray.800');
		border-bottom: 1px solid theme('colors.gray.200');
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: color 0.25s ease, border-color 0.25s ease;
	}

	.tok.bosh {
		color: theme('colors.gray.300');
		border-bottom-style: dashed;
	}

	.quti {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 24px;
		border-radius: 4px;
		font-family: theme('fontFamily.mono');
		font-size: 0.66rem;
		border: 1px solid transparent;
		transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
	}

	.quti.bosh {
		background: transparent;
		border: 1px dashed theme('colors.gray.200');
		color: theme('colors.gray.300');
	}

	.quti.cache {
		background: theme('colors.gray.100');
		border-color: theme('colors.gray.200');
		color: theme('colors.gray.500');
	}

	.quti.yangi {
		background: theme('colors.purple.600');
		border-color: theme('colors.purple.600');
		color: white;
	}

	.belgi {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 16px;
		font-family: theme('fontFamily.mono');
		font-size: 0.6rem;
		letter-spacing: 0.02em;
		transition: color 0.3s ease;
	}

	.belgi.yangi {
		color: theme('colors.purple.600');
		font-weight: 600;
	}

	.belgi.cache {
		color: theme('colors.gray.400');
	}

	.belgi.bosh {
		color: transparent;
	}

	.izoh-qator {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.3rem;
		font-size: 0.72rem;
		line-height: 1.5;
		color: theme('colors.gray.400');
	}

	.ayirgich {
		color: theme('colors.gray.300');
		padding: 0 0.15rem;
	}

	.nuq {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 2px;
		flex: none;
	}

	.yangi-nuq {
		background: theme('colors.purple.600');
	}

	.cache-nuq {
		background: theme('colors.gray.200');
		border: 1px solid theme('colors.gray.300');
	}

	.eski-nuq {
		background: theme('colors.gray.400');
	}

	/* ---- hisoblagich ---- */
	.hisob {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
		gap: 0.9rem;
		align-items: stretch;
	}

	.hisob-asos {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.15rem;
		padding: 0.7rem 0.9rem;
		border: 1px solid theme('colors.purple.200');
		background: theme('colors.purple.50');
		border-radius: 6px;
		transition: border-color 0.3s ease, background 0.3s ease;
	}

	.hisob-asos.kop {
		border-color: theme('colors.gray.300');
		background: theme('colors.gray.50');
	}

	.hisob-nom {
		font-size: 0.72rem;
		color: theme('colors.gray.500');
		line-height: 1.4;
	}

	.hisob-son {
		font-family: theme('fontFamily.mono');
		font-size: 2.4rem;
		line-height: 1.1;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: theme('colors.purple.700');
		transition: color 0.3s ease;
	}

	.hisob-asos.kop .hisob-son {
		color: theme('colors.gray.600');
	}

	.hisob-yon {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.3rem;
		padding: 0.7rem 0.9rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
	}

	.qator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.76rem;
		color: theme('colors.gray.400');
		transition: color 0.25s ease;
	}

	.qator.faol {
		color: theme('colors.gray.800');
	}

	.qator-nom {
		flex: 1;
		white-space: nowrap;
	}

	.qator-son {
		font-family: theme('fontFamily.mono');
		font-size: 0.9rem;
		font-variant-numeric: tabular-nums;
		min-width: 2.2em;
		text-align: right;
		color: theme('colors.gray.800');
	}

	.qator-f {
		min-width: 5.4em;
		text-align: right;
		color: theme('colors.gray.400');
	}

	.qator-f :global(.katex) {
		font-size: 0.78rem;
	}

	.qator.ortiq {
		margin-top: 0.15rem;
		padding-top: 0.35rem;
		border-top: 1px dashed theme('colors.gray.200');
		color: theme('colors.gray.500');
	}

	.qator.ortiq .qator-son {
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.kulrang {
		font-size: 0.7rem;
		color: theme('colors.gray.300');
	}

	/* ================= STEND 2 ================= */
	.stend2 {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 620px;
	}

	.konfig {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.chip {
		font-family: theme('fontFamily.mono');
		font-size: 0.68rem;
		padding: 0.2rem 0.45rem;
		border-radius: 3px;
		background: theme('colors.gray.100');
		color: theme('colors.gray.600');
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.chip.attn {
		background: theme('colors.purple.100');
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.chip.moljal {
		background: transparent;
		border: 1px dashed theme('colors.gray.200');
		color: theme('colors.gray.400');
	}

	.formula-blok {
		padding: 0.7rem 0.9rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		background: theme('colors.gray.50');
		overflow-x: auto;
	}

	.formula {
		color: theme('colors.gray.800');
	}

	.formula :global(.katex) {
		font-size: 0.95rem;
	}

	.tarif {
		margin-top: 0.3rem;
		color: theme('colors.gray.400');
	}

	.tarif :global(.katex) {
		font-size: 0.7rem;
	}

	.son-formula {
		margin-top: 0.55rem;
		padding-top: 0.5rem;
		border-top: 1px dashed theme('colors.gray.200');
		font-family: theme('fontFamily.mono');
		font-size: 0.8rem;
		color: theme('colors.purple.700');
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.raqamlar {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.7rem;
	}

	.raqam {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.65rem 0.8rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		min-width: 0;
		transition: border-color 0.3s ease, background 0.3s ease;
	}

	.raqam-nom {
		font-size: 0.7rem;
		color: theme('colors.gray.400');
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.raqam-son {
		font-family: theme('fontFamily.mono');
		font-size: 1.75rem;
		line-height: 1.15;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: theme('colors.gray.800');
		white-space: nowrap;
	}

	.raqam-son.kichikroq {
		font-size: 1.5rem;
	}

	.birlik {
		font-size: 0.8rem;
		font-weight: 500;
		color: theme('colors.gray.400');
		margin-left: 0.25rem;
	}

	.asosiy-raqam {
		border-color: theme('colors.purple.200');
		background: theme('colors.purple.50');
	}

	.asosiy-raqam .raqam-son {
		color: theme('colors.purple.700');
	}

	.asosiy-raqam .birlik {
		color: theme('colors.purple.400');
	}

	.asosiy-raqam.ogoh {
		border-color: theme('colors.red.200');
		background: theme('colors.red.50');
	}

	.asosiy-raqam.ogoh .raqam-son {
		color: theme('colors.red.600');
	}

	.asosiy-raqam.ogoh .birlik {
		color: theme('colors.red.400');
	}

	/* ---- ustun ---- */
	.olcham {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.olcham-bosh {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	.olcham-nom {
		font-size: 0.74rem;
		color: theme('colors.gray.500');
	}

	.olcham-son {
		font-family: theme('fontFamily.mono');
		font-size: 0.82rem;
		font-variant-numeric: tabular-nums;
		color: theme('colors.gray.800');
		transition: color 0.25s ease;
	}

	.olcham-son.ogoh {
		color: theme('colors.red.600');
		font-weight: 600;
	}

	.chiziq {
		position: relative;
		height: 20px;
		border: 1px solid theme('colors.gray.200');
		border-radius: 4px;
		background: theme('colors.gray.50');
		overflow: hidden;
	}

	.chiziq-ich {
		height: 100%;
		background: theme('colors.purple.500');
		border-radius: 3px 0 0 3px;
		transition: width 0.35s ease, background 0.25s ease;
	}

	.chiziq-ich.oshgan {
		background: theme('colors.red.500');
		border-radius: 3px;
	}

	.olcham-oyoq {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-family: theme('fontFamily.mono');
		font-size: 0.66rem;
		color: theme('colors.gray.400');
	}

	.oyoq-ong {
		text-align: right;
	}

	.ogoh-matn {
		font-size: 0.78rem;
		line-height: 1.6;
		color: theme('colors.red.600');
		padding: 0.5rem 0.7rem;
		border: 1px solid theme('colors.red.200');
		background: theme('colors.red.50');
		border-radius: 5px;
	}

	@media (prefers-reduced-motion: reduce) {
		.tugma,
		.tok,
		.quti,
		.belgi,
		.qator,
		.qadam-yoz,
		.raqam,
		.hisob-asos,
		.hisob-son,
		.olcham-son,
		.chiziq-ich {
			transition: none;
		}
	}
</style>
