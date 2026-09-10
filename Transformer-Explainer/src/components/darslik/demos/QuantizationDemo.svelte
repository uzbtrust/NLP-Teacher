<script lang="ts">
	import { onMount } from 'svelte';
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
		return () => {
			if (xatoTween) xatoTween.kill();
			if (gbTween) gbTween.kill();
		};
	});

	function fmt(v: number, n = 2): string {
		const t = v.toFixed(n);
		return t === '-' + (0).toFixed(n) ? (0).toFixed(n) : t;
	}

	// ======================================================================
	// STEND 1 - kvantlash pogonalari va outlier
	// ======================================================================

	// Qatiy massiv: sahifa har safar bir xil ochiladi, tasodif yoq.
	// Nolga yaqin jamlangan, chegaralangan - odatdagi vazn taqsimoti.
	const VAZNLAR: number[] = [
		0.21, -0.38, 0.07, 0.62, -0.15, -0.71, 0.33, 0.02, -0.27, 0.47, 0.13, -0.05, 0.88, -0.44,
		0.29, -0.19, 0.55, -0.62, 0.1, -0.33, 0.41, -0.09, -0.86
	];
	const OUTLIER = 5.2;
	const OUTLIER_IDX = VAZNLAR.length; // qoshilganda shu indeksda turadi
	const GURUH_OLCHAM = 8;

	const BITLAR = [2, 3, 4, 8];
	let bitIdx = 2; // 4 bit
	$: bit = BITLAR[bitIdx];
	$: pogona = Math.pow(2, bit);

	let outlier = 'yoq';
	let guruh = 'yoq';

	const OUTLIER_TANLOV = [
		{ id: 'yoq', label: `yo'q` },
		{ id: 'bor', label: `bor` }
	];
	const GURUH_TANLOV = [
		{ id: 'yoq', label: `bitta masshtab` },
		{ id: 'bor', label: `8 tadan guruh` }
	];

	type Nuqta = {
		i: number;
		qiymat: number;
		aslX: number; // foizda, laning oz oraligi ichida
		qX: number; // yaxlitlangandan keyingi joyi
		daraja: number; // shu pogonada nechanchi bolib turibdi
		xato: number;
		chekka: boolean;
	};

	type Lay = {
		id: string;
		nom: string;
		min: number;
		max: number;
		s: number;
		ishlatilgan: number;
		nuqtalar: Nuqta[];
		qadam: number;
		balandlik: number;
		chekkali: boolean;
	};

	function layYasa(id: string, nom: string, idxlar: number[], hammasi: number[], b: number): Lay {
		const vals = idxlar.map((i) => hammasi[i]);
		let mn = vals[0];
		let mx = vals[0];
		for (const v of vals) {
			if (v < mn) mn = v;
			if (v > mx) mx = v;
		}
		const oxirgi = Math.pow(2, b) - 1; // eng yuqori pogona raqami
		const en = mx - mn;
		const s = en > 1e-9 ? en / oxirgi : 1e-9;

		const sanoq = new Map<number, number>();
		const nuqtalar: Nuqta[] = [];
		let ishlatilgan = 0;
		let chekkali = false;

		for (let k = 0; k < idxlar.length; k++) {
			const v = vals[k];
			const q = Math.max(0, Math.min(oxirgi, Math.round((v - mn) / s)));
			const deq = mn + q * s;
			const oldin = sanoq.get(q) || 0;
			sanoq.set(q, oldin + 1);
			if (oldin === 0) ishlatilgan++;
			const chekka = idxlar[k] === OUTLIER_IDX;
			if (chekka) chekkali = true;
			nuqtalar.push({
				i: idxlar[k],
				qiymat: v,
				aslX: en > 1e-9 ? ((v - mn) / en) * 100 : 50,
				qX: en > 1e-9 ? ((deq - mn) / en) * 100 : 50,
				daraja: oldin,
				xato: Math.abs(v - deq),
				chekka
			});
		}

		let engBaland = 1;
		sanoq.forEach((c) => {
			if (c > engBaland) engBaland = c;
		});
		const qadam = Math.min(8, Math.max(3.5, 88 / engBaland));

		return {
			id,
			nom,
			min: mn,
			max: mx,
			s,
			ishlatilgan,
			nuqtalar,
			qadam,
			balandlik: engBaland * qadam + 7,
			chekkali
		};
	}

	$: toplam = outlier === 'bor' ? VAZNLAR.concat([OUTLIER]) : VAZNLAR.slice();

	$: laylar = ((arr: number[], g: string, b: number): Lay[] => {
		if (g === 'yoq') {
			return [
				layYasa(
					'all',
					`Butun matritsa - bitta masshtab`,
					arr.map((_, i) => i),
					arr,
					b
				)
			];
		}
		const res: Lay[] = [];
		for (let gi = 0; gi * GURUH_OLCHAM < arr.length; gi++) {
			const idx: number[] = [];
			const oxir = Math.min(arr.length, (gi + 1) * GURUH_OLCHAM);
			for (let i = gi * GURUH_OLCHAM; i < oxir; i++) idx.push(i);
			res.push(layYasa('g' + gi, `${gi + 1}-guruh`, idx, arr, b));
		}
		return res;
	})(toplam, guruh, bit);

	// pogona chiziqlari - hamma lay uchun bir xil (har lay oz oraligini 0-100% ga yoyadi)
	$: tiklar = ((b: number): number[] => {
		const oxirgi = Math.pow(2, b) - 1;
		const a: number[] = [];
		for (let k = 0; k <= oxirgi; k++) a.push((k / oxirgi) * 100);
		return a;
	})(bit);

	function ortachaXato(ls: Lay[]): number {
		let yigindi = 0;
		let n = 0;
		for (const l of ls) {
			for (const p of l.nuqtalar) {
				yigindi += p.xato;
				n++;
			}
		}
		return n ? yigindi / n : 0;
	}

	$: xato = ortachaXato(laylar);

	// tayanch holat: outlier yoq, guruh yoq, oshha bit
	$: bazaXato = ortachaXato([
		layYasa(
			'baza',
			`baza`,
			VAZNLAR.map((_, i) => i),
			VAZNLAR,
			bit
		)
	]);
	$: nisbat = bazaXato > 1e-12 ? xato / bazaXato : 1;

	const NISBAT_MAX = 6;
	$: nisbatUlush = Math.min(1, nisbat / NISBAT_MAX);
	$: yomon = nisbat > 1.5;

	// jonli hisoblagichlar
	let korsatXato = 0;
	let korsatNisbat = 1;
	let xatoTween: any = null;

	function qollXato(nx: number, nn: number) {
		if (!mounted || kamHarakat) {
			korsatXato = nx;
			korsatNisbat = nn;
			return;
		}
		if (xatoTween) xatoTween.kill();
		const o = { a: korsatXato, b: korsatNisbat };
		xatoTween = gsap.to(o, {
			a: nx,
			b: nn,
			duration: 0.4,
			ease: 'power2.out',
			onUpdate: () => {
				korsatXato = o.a;
				korsatNisbat = o.b;
			},
			onComplete: () => {
				korsatXato = nx;
				korsatNisbat = nn;
			}
		});
	}

	$: qollXato(xato, nisbat);

	// outlier yoqilgan lahza - demoning eng muhim joyi, uni sezdirib qoyamiz
	let heroEl: HTMLElement;
	let oldingiOutlier = outlier;

	function chaqnat() {
		if (!heroEl || kamHarakat) return;
		gsap.fromTo(
			heroEl,
			{ scale: 1.2 },
			{ scale: 1, duration: 0.5, ease: 'power2.out', clearProps: 'transform' }
		);
	}

	$: if (mounted && outlier !== oldingiOutlier) {
		oldingiOutlier = outlier;
		chaqnat();
	}

	const S_FORMULA = String.raw`s = \frac{w_{\max} - w_{\min}}{2^{b} - 1}`;
	const DEQ_FORMULA = String.raw`\hat{w} = w_{\min} + s\cdot\mathrm{round}\!\left(\frac{w - w_{\min}}{s}\right)`;

	// ======================================================================
	// STEND 2 - xotira kalkulyatori
	// ======================================================================
	type Format = { id: string; label: string; nom: string; bayt: number };

	const FORMATLAR: Format[] = [
		{ id: 'fp16', label: 'fp16', nom: `fp16 - 16 bit`, bayt: 2 },
		{ id: 'int8', label: 'INT8', nom: `INT8 - 8 bit`, bayt: 1 },
		{ id: 'b4', label: '4-bit', nom: `4 bit`, bayt: 0.5 }
	];
	const FORMAT_TANLOV = FORMATLAR.map((f) => ({ id: f.id, label: f.label }));

	let formatId = 'fp16';
	$: format = FORMATLAR.find((f) => f.id === formatId) || FORMATLAR[0];

	const LOG_MIN = 0; // 1B
	const LOG_MAX = Math.log10(405); // 405B
	let logP = Math.log10(70); // sahifa 70B da ochiladi

	$: P = Math.pow(10, logP);
	$: gb = P * format.bayt;

	const TANISH = [7, 70, 405];
	function tanishga(p: number) {
		logP = Math.log10(p);
	}

	type Chegara = { gb: number; nom: string };
	const CHEGARALAR: Chegara[] = [
		{ gb: 24, nom: `RTX 4090` },
		{ gb: 80, nom: `H100` },
		{ gb: 160, nom: `2 x H100` }
	];
	const BAR_MAX = 160;
	const KARTA = 80; // H100

	$: ulush = Math.min(1, gb / BAR_MAX);
	$: oshdi = gb > KARTA;
	$: kerakKarta = Math.max(1, Math.ceil(gb / KARTA - 1e-9));

	function fmtP(p: number): string {
		return p < 10 ? p.toFixed(1) : String(Math.round(p));
	}

	function fmtGb(g: number): string {
		return g < 10 ? g.toFixed(1) : String(Math.round(g));
	}

	let korsatGb = 0;
	let gbTween: any = null;

	function qollGb(n: number) {
		if (!mounted || kamHarakat) {
			korsatGb = n;
			return;
		}
		if (gbTween) gbTween.kill();
		const o = { v: korsatGb };
		gbTween = gsap.to(o, {
			v: n,
			duration: 0.35,
			ease: 'power2.out',
			onUpdate: () => (korsatGb = o.v),
			onComplete: () => (korsatGb = n)
		});
	}

	$: qollGb(gb);

	const XOTIRA_FORMULA = String.raw`\text{xotira} \;=\; P \times b`;
	const XOTIRA_TARIF = String.raw`P = \text{parametrlar soni (mlrd)},\; b = \text{bir parametrga bayt}`;
</script>

<div class="q-demo">
	<!-- ================================================================ -->
	<!-- STEND 1                                                          -->
	<!-- ================================================================ -->
	<Stend
		title="Kvantlash pog'onalari va outlier"
		izoh={`Bit sonini kamaytiring: pog'onalar siyraklashadi va yaxlitlash xatosi o'sadi. Endi outlier'ni yoqing - bitta katta qiymat butun oraliqni cho'zib yuboradi, qolgan yigirma uchta vazn esa bir nechta pog'onaga siqilib qoladi va bir-biridan farq qilmay qo'yadi. Guruhlarga bo'lish shu zararni faqat outlier tushgan guruh ichida qoldiradi.`}
	>
		<svelte:fragment slot="boshqaruv">
			<label class="slayder">
				<span class="slayder-nom">Aniqlik</span>
				<input
					type="range"
					min="0"
					max={BITLAR.length - 1}
					step="1"
					bind:value={bitIdx}
					aria-label="Bit soni"
				/>
				<span class="slayder-son">{bit} bit</span>
			</label>

			<Swap label="Outlier" bind:value={outlier} options={OUTLIER_TANLOV} />
			<Swap label="Masshtab" bind:value={guruh} options={GURUH_TANLOV} />
		</svelte:fragment>

		<div class="q1">
			<!-- formula -->
			<div class="formula-blok">
				<div class="formula-juft">
					<div class="formula"><Katex math={S_FORMULA} /></div>
					<div class="formula"><Katex math={DEQ_FORMULA} /></div>
				</div>
				<div class="son-formula">
					{#if laylar.length === 1}
						s = ({fmt(laylar[0].max, 2)} &minus; {fmt(laylar[0].min, 2)}) / {pogona - 1} = {fmt(
							laylar[0].s,
							4
						)}
					{:else}
						har guruh uchun s alohida hisoblanadi &mdash; pastdagi sarlavhalarga qarang
					{/if}
				</div>
			</div>

			<!-- belgilar -->
			<p class="legend">
				<i class="lg-asl" /> asl vazn
				<span class="ayirgich">&middot;</span>
				<i class="lg-xato" /> yaxlitlash xatosi
				<span class="ayirgich">&middot;</span>
				<i class="lg-q" /> kvantlangan qiymat &mdash; bir pog'onaga tushganlar ustma-ust yig'iladi
				{#if outlier === 'bor'}
					<span class="ayirgich">&middot;</span>
					<i class="lg-chekka" /> outlier
				{/if}
			</p>

			<!-- laylar -->
			<div class="laylar">
				{#each laylar as lay (lay.id)}
					<div class="lay" class:lay-chekka={lay.chekkali && laylar.length > 1}>
						<div class="lay-bosh">
							<span class="lay-nom">{lay.nom}</span>
							<span class="lay-stat">
								oraliq [{fmt(lay.min, 2)}, {fmt(lay.max, 2)}]
								<span class="ayirgich">&middot;</span>
								s = {fmt(lay.s, 4)}
								<span class="ayirgich">&middot;</span>
								<b class:kam={lay.ishlatilgan < pogona / 2}>{lay.ishlatilgan}</b> / {pogona} pog'ona
							</span>
						</div>

						<div class="chizgi">
							<!-- asl qiymatlar va xato -->
							<div class="asl">
								{#each lay.nuqtalar as p (p.i)}
									{#if p.daraja === 0}
										<i class="tortish" style="left:{p.qX}%" />
									{/if}
								{/each}
								{#each lay.nuqtalar as p (p.i)}
									<i
										class="xato-chiziq"
										class:chekka={p.chekka}
										style="left:{Math.min(p.aslX, p.qX)}%; width:{Math.abs(p.aslX - p.qX)}%"
									/>
									<i class="asl-nuqta" class:chekka={p.chekka} style="left:{p.aslX}%" />
								{/each}
							</div>

							<!-- pogonalar -->
							<div class="ladder">
								<i class="ladder-chiziq" />
								{#each tiklar as t, k (k)}
									<i class="tik" class:zich={bit >= 8} style="left:{t}%" />
								{/each}
							</div>

							<!-- kvantlangan qiymatlar -->
							<div class="stack" style="height:{lay.balandlik}px">
								{#each lay.nuqtalar as p (p.i)}
									<i
										class="q-nuqta"
										class:chekka={p.chekka}
										style="left:{p.qX}%; top:{p.daraja * lay.qadam}px"
									/>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- xato -->
			<div class="xato-blok">
				<div class="xato-asos" class:ogoh={yomon}>
					<span class="xato-nom">o'rtacha yaxlitlash xatosi</span>
					<span class="xato-son" bind:this={heroEl}>{fmt(korsatXato, 4)}</span>
				</div>

				<div class="xato-yon">
					<div class="yon-bosh">
						<span class="yon-nom">tayanch holatga nisbatan</span>
						<span class="yon-son" class:ogoh={yomon}>&times;{fmt(korsatNisbat, 2)}</span>
					</div>

					<div class="chiziq">
						<div class="chiziq-ich" class:oshgan={yomon} style="width:{nisbatUlush * 100}%" />
						<span class="birlik-belgi" style="left:{(1 / NISBAT_MAX) * 100}%" />
					</div>

					<div class="chiziq-oyoq">
						<span>&times;1 &mdash; outlier'siz, bitta masshtab</span>
						<span>&times;{NISBAT_MAX}</span>
					</div>
				</div>
			</div>

			{#if outlier === 'bor' && guruh === 'yoq'}
				<p class="ogoh-matn">
					Bitta son butun oraliqni egallab oldi. Pog'onalar bir-biridan uzoqlashdi va qolgan
					vaznlar bir nechta pog'onaga yopishib qoldi &mdash; ular orasidagi farq shu yerda
					yo'qoladi. Aynan shu narsa sodda INT8 quantization'ni katta modellarda buzadi.
				</p>
			{/if}
		</div>
	</Stend>

	<!-- ================================================================ -->
	<!-- STEND 2                                                          -->
	<!-- ================================================================ -->
	<Stend
		title="Vaznlar qancha joy egallaydi"
		izoh={`Vaznlar uchun kerakli xotira - parametrlar soni ko'paytiruv bir parametrga to'g'ri keladigan bayt, boshqa hech nima. Formatni almashtiring: raqam ikki yoki to'rt barobar kichrayadi va model bir kartaga sig'ib qoladi. Bu faqat vaznlar - KV cache va faollashuvlar ustiga qo'shiladi.`}
	>
		<svelte:fragment slot="boshqaruv">
			<label class="slayder">
				<span class="slayder-nom">Parametrlar</span>
				<input
					type="range"
					min={LOG_MIN}
					max={LOG_MAX}
					step="0.01"
					bind:value={logP}
					aria-label="Parametrlar soni"
				/>
				<span class="slayder-son">{fmtP(P)}B</span>
			</label>

			<div class="tanishlar">
				{#each TANISH as t}
					<button
						type="button"
						class="tugma"
						class:asosiy={Math.abs(P - t) / t < 0.02}
						on:click={() => tanishga(t)}>{t}B</button
					>
				{/each}
			</div>

			<Swap label="Format" bind:value={formatId} options={FORMAT_TANLOV} />
		</svelte:fragment>

		<div class="q2">
			<div class="formula-blok">
				<div class="formula"><Katex math={XOTIRA_FORMULA} /></div>
				<div class="tarif"><Katex math={XOTIRA_TARIF} /></div>
				<div class="son-formula">
					{fmtP(P)} mlrd &times; {format.bayt} bayt = {fmtGb(gb)} GB
				</div>
			</div>

			<div class="hisob">
				<div class="hisob-asos" class:ogoh={oshdi}>
					<span class="hisob-nom">{fmtP(P)}B parametr &middot; {format.label}</span>
					<span class="hisob-son">{fmtGb(korsatGb)}<span class="birlik">GB</span></span>
					<span class="hisob-oyoq" class:ogoh={oshdi}>
						{kerakKarta === 1
							? `bitta 80 GB kartaga sig'adi`
							: `kamida ${kerakKarta} ta 80 GB karta kerak`}
					</span>
				</div>

				<div class="hisob-yon">
					{#each FORMATLAR as f (f.id)}
						<div class="qator" class:faol={f.id === formatId}>
							<span class="qator-nom">{f.nom}</span>
							<span class="qator-son">{fmtGb(P * f.bayt)} GB</span>
							<span class="qator-f">{f.bayt} bayt/param</span>
						</div>
					{/each}
				</div>
			</div>

			<div class="olcham">
				<div class="olcham-bosh">
					<span class="olcham-nom">bitta kartaning xotirasiga nisbatan</span>
					<span class="olcham-son" class:ogoh={oshdi}>
						{gb > BAR_MAX ? `160 GB dan ham oshdi` : `${fmt((gb / KARTA) * 100, 0)}% (H100)`}
					</span>
				</div>

				<div class="chiziq katta">
					<div class="chiziq-ich" class:oshgan={oshdi} style="width:{ulush * 100}%" />
					{#each CHEGARALAR as ch (ch.gb)}
						<span class="chegara" style="left:{(ch.gb / BAR_MAX) * 100}%" />
					{/each}
				</div>

				<div class="chegara-yozuv">
					{#each CHEGARALAR as ch (ch.gb)}
						<span
							class="chegara-nom"
							class:otdi={gb >= ch.gb}
							class:ong={ch.gb >= BAR_MAX}
							style="left:{(ch.gb / BAR_MAX) * 100}%"
						>
							{ch.gb} GB &middot; {ch.nom}
						</span>
					{/each}
				</div>
			</div>

			{#if oshdi}
				<p class="ogoh-matn">
					Bu holatda model bitta kartaga sig'maydi. Vaznlarni bir necha GPU orasida bo'lish kerak
					&mdash; narx ham, murakkablik ham shu yerdan boshlanadi. Formatni almashtirib ko'ring.
				</p>
			{/if}
		</div>
	</Stend>
</div>

<style lang="scss">
	.q-demo {
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
		width: 104px;
		accent-color: theme('colors.purple.600');
		cursor: pointer;
	}

	.slayder-son {
		font-family: theme('fontFamily.mono');
		font-size: 0.76rem;
		color: theme('colors.gray.800');
		font-variant-numeric: tabular-nums;
		min-width: 3.6em;
		text-align: right;
	}

	.tanishlar {
		display: flex;
		gap: 0.3rem;
	}

	.tugma {
		font-family: theme('fontFamily.mono');
		font-size: 0.74rem;
		padding: 0.22rem 0.5rem;
		border: 1px solid theme('colors.gray.300');
		border-radius: 4px;
		background: white;
		color: theme('colors.gray.500');
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
		transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;

		&:hover {
			border-color: theme('colors.purple.300');
			background: theme('colors.purple.50');
			color: theme('colors.purple.700');
		}
	}

	.tugma.asosiy {
		border-color: theme('colors.purple.400');
		background: theme('colors.purple.50');
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	/* ================= umumiy ================= */
	.q1,
	.q2 {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 620px;
	}

	.formula-blok {
		padding: 0.7rem 0.9rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		background: theme('colors.gray.50');
		overflow-x: auto;
	}

	.formula-juft {
		display: flex;
		align-items: center;
		gap: 1.6rem;
		flex-wrap: wrap;
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

	.ayirgich {
		color: theme('colors.gray.300');
		padding: 0 0.15rem;
	}

	.ogoh-matn {
		font-size: 0.8rem;
		line-height: 1.6;
		color: theme('colors.gray.600');
		padding: 0.6rem 0.8rem;
		border-left: 2px solid theme('colors.red.300');
		background: theme('colors.red.50');
		border-radius: 0 4px 4px 0;
	}

	/* ================= STEND 1: belgilar ================= */
	.legend {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.3rem;
		font-size: 0.72rem;
		line-height: 1.5;
		color: theme('colors.gray.400');
	}

	.legend i {
		display: inline-block;
		flex: none;
		margin-right: 0.15rem;
	}

	.lg-asl {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: white;
		border: 1.5px solid theme('colors.gray.400');
	}

	.lg-xato {
		width: 16px;
		height: 2px;
		border-radius: 1px;
		background: theme('colors.purple.400');
		vertical-align: middle;
	}

	.lg-q {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: theme('colors.purple.600');
	}

	.lg-chekka {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: theme('colors.red.500');
	}

	/* ================= STEND 1: laylar ================= */
	.laylar {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}

	.lay {
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		padding: 0.55rem 0.75rem 0.7rem;
		background: white;
		transition: border-color 0.25s ease, background 0.25s ease;
	}

	.lay-chekka {
		border-color: theme('colors.red.200');
		background: theme('colors.red.50');
	}

	.lay-bosh {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}

	.lay-nom {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.8rem;
		font-weight: 500;
		color: theme('colors.gray.700');
		white-space: nowrap;
	}

	.lay-stat {
		font-family: theme('fontFamily.mono');
		font-size: 0.68rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.lay-stat b {
		color: theme('colors.gray.700');
		font-weight: 600;
	}

	.lay-stat b.kam {
		color: theme('colors.red.600');
	}

	.chizgi {
		position: relative;
		margin: 0 10px;
	}

	/* --- asl qiymatlar --- */
	.asl {
		position: relative;
		height: 26px;
	}

	.tortish {
		position: absolute;
		top: 13px;
		bottom: 0;
		width: 1px;
		background: theme('colors.purple.200');
		transform: translateX(-50%);
		transition: left 0.4s ease;
	}

	.xato-chiziq {
		position: absolute;
		top: 12px;
		height: 2px;
		border-radius: 1px;
		background: theme('colors.purple.400');
		transition: left 0.4s ease, width 0.4s ease;
	}

	.xato-chiziq.chekka {
		background: theme('colors.red.400');
	}

	.asl-nuqta {
		position: absolute;
		top: 13px;
		width: 9px;
		height: 9px;
		margin: 0;
		border-radius: 50%;
		background: white;
		border: 1.5px solid theme('colors.gray.400');
		transform: translate(-50%, -50%);
		transition: left 0.4s ease;
	}

	.asl-nuqta.chekka {
		border-color: theme('colors.red.500');
	}

	/* --- pogona chiziqlari --- */
	.ladder {
		position: relative;
		height: 13px;
	}

	.ladder-chiziq {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		height: 1px;
		background: theme('colors.gray.300');
	}

	.tik {
		position: absolute;
		top: 0;
		width: 1px;
		height: 10px;
		background: theme('colors.gray.300');
		transform: translateX(-50%);
	}

	.tik.zich {
		height: 7px;
		background: theme('colors.gray.200');
	}

	/* --- kvantlangan qiymatlar --- */
	.stack {
		position: relative;
		margin-top: 3px;
	}

	.q-nuqta {
		position: absolute;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: theme('colors.purple.600');
		transform: translateX(-50%);
		transition: left 0.4s ease, top 0.4s ease;
	}

	.q-nuqta.chekka {
		background: theme('colors.red.500');
	}

	/* ================= STEND 1: xato ================= */
	.xato-blok {
		display: grid;
		grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
		gap: 0.9rem;
		align-items: stretch;
	}

	.xato-asos {
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

	.xato-asos.ogoh {
		border-color: theme('colors.red.200');
		background: theme('colors.red.50');
	}

	.xato-nom {
		font-size: 0.72rem;
		color: theme('colors.gray.500');
		line-height: 1.4;
	}

	.xato-son {
		display: inline-block;
		transform-origin: left center;
		font-family: theme('fontFamily.mono');
		font-size: 2.1rem;
		line-height: 1.15;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: theme('colors.purple.700');
		transition: color 0.3s ease;
	}

	.xato-asos.ogoh .xato-son {
		color: theme('colors.red.600');
	}

	.xato-yon {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.7rem 0.9rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
	}

	.yon-bosh {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	.yon-nom {
		font-size: 0.74rem;
		color: theme('colors.gray.500');
	}

	.yon-son {
		font-family: theme('fontFamily.mono');
		font-size: 1.1rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: theme('colors.gray.800');
		transition: color 0.25s ease;
	}

	.yon-son.ogoh {
		color: theme('colors.red.600');
	}

	.chiziq {
		position: relative;
		height: 18px;
		border: 1px solid theme('colors.gray.200');
		border-radius: 4px;
		background: theme('colors.gray.50');
		overflow: hidden;
	}

	.chiziq.katta {
		height: 26px;
	}

	.chiziq-ich {
		height: 100%;
		background: theme('colors.purple.500');
		transition: width 0.35s ease, background 0.25s ease;
	}

	.chiziq-ich.oshgan {
		background: theme('colors.red.500');
	}

	.birlik-belgi {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		background: theme('colors.gray.800');
		transform: translateX(-50%);
	}

	.chiziq-oyoq {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		font-family: theme('fontFamily.mono');
		font-size: 0.66rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
	}

	/* ================= STEND 2 ================= */
	.hisob {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
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

	.hisob-asos.ogoh {
		border-color: theme('colors.red.200');
		background: theme('colors.red.50');
	}

	.hisob-nom {
		font-size: 0.72rem;
		color: theme('colors.gray.500');
		white-space: nowrap;
	}

	.hisob-son {
		font-family: theme('fontFamily.mono');
		font-size: 2.4rem;
		line-height: 1.1;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: theme('colors.purple.700');
		white-space: nowrap;
		transition: color 0.3s ease;
	}

	.hisob-asos.ogoh .hisob-son {
		color: theme('colors.red.600');
	}

	.birlik {
		font-size: 0.85rem;
		font-weight: 500;
		color: theme('colors.purple.400');
		margin-left: 0.28rem;
	}

	.hisob-asos.ogoh .birlik {
		color: theme('colors.red.400');
	}

	.hisob-oyoq {
		font-size: 0.72rem;
		color: theme('colors.gray.500');
		margin-top: 0.15rem;
	}

	.hisob-oyoq.ogoh {
		color: theme('colors.red.600');
		font-weight: 600;
	}

	.hisob-yon {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.35rem;
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
		font-size: 0.92rem;
		font-variant-numeric: tabular-nums;
		min-width: 5em;
		text-align: right;
		color: theme('colors.gray.800');
	}

	.qator.faol .qator-son {
		color: theme('colors.purple.700');
		font-weight: 700;
	}

	.qator-f {
		min-width: 7em;
		text-align: right;
		font-family: theme('fontFamily.mono');
		font-size: 0.68rem;
		color: theme('colors.gray.300');
		font-variant-numeric: tabular-nums;
	}

	/* --- olcham chizigi --- */
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

	.chegara {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 1px;
		background: theme('colors.gray.400');
		transform: translateX(-50%);
	}

	.chegara-yozuv {
		position: relative;
		height: 15px;
	}

	.chegara-nom {
		position: absolute;
		top: 0;
		font-family: theme('fontFamily.mono');
		font-size: 0.65rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		transform: translateX(-50%);
		transition: color 0.25s ease;
	}

	.chegara-nom.ong {
		transform: translateX(-100%);
	}

	.chegara-nom.otdi {
		color: theme('colors.red.500');
	}

	@media (prefers-reduced-motion: reduce) {
		.tortish,
		.xato-chiziq,
		.asl-nuqta,
		.q-nuqta,
		.chiziq-ich,
		.lay,
		.tugma,
		.qator,
		.xato-son,
		.hisob-son,
		.olcham-son,
		.chegara-nom,
		.xato-asos,
		.hisob-asos {
			transition: none;
		}
	}
</style>
