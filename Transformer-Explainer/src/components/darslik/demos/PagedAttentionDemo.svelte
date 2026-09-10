<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Stend from '~/components/darslik/Stend.svelte';
	import Swap from '~/components/darslik/Swap.svelte';
	import { gsap } from '~/utils/gsap';

	// ======================================================================
	// UMUMIY
	// ======================================================================
	let mounted = false;
	let kamHarakat = false;

	function fmt(v: number, n = 1): string {
		return v.toFixed(n);
	}

	// ======================================================================
	// STEND 1 - xotira xaritasi
	// ======================================================================
	const BLOK_TOKEN = 16;
	const JAMI_BLOK = 96;
	const USTUN = 12;
	const JAMI_TOKEN = JAMI_BLOK * BLOK_TOKEN; // 1536

	type Sorov = {
		nom: string;
		tok: number; // haqiqatda ishlatilgan token
		moljalTok: number; // so'rov e'lon qilgan maksimal uzunlik
		rang: string;
		och: string;
	};

	// Barcha qiymatlar qat'iy: demo har safar bir xil ochiladi.
	const SOROVLAR: Sorov[] = [
		{ nom: `A`, tok: 205, moljalTok: 512, rang: '#7c3aed', och: '#7c3aed26' },
		{ nom: `B`, tok: 90, moljalTok: 384, rang: '#2563eb', och: '#2563eb26' },
		{ nom: `C`, tok: 202, moljalTok: 512, rang: '#0d9488', och: '#0d948826' },
		{ nom: `D`, tok: 138, moljalTok: 512, rang: '#d97706', och: '#d9770626' },
		{ nom: `E`, tok: 60, moljalTok: 256, rang: '#db2777', och: '#db277726' },
		{ nom: `F`, tok: 250, moljalTok: 512, rang: '#16a34a', och: '#16a34a26' },
		{ nom: `G`, tok: 172, moljalTok: 384, rang: '#4f46e5', och: '#4f46e526' },
		{ nom: `H`, tok: 45, moljalTok: 256, rang: '#dc2626', och: '#dc262626' }
	];

	const blokSoni = (t: number) => Math.ceil(t / BLOK_TOKEN);

	// Fizik bloklarni tarqatish tartibi - oldindan yozilgan, tasodifiy emas.
	const TARTIB: number[] = [
		11, 56, 94, 64, 16, 53, 31, 20, 22, 2, 3, 80, 57, 8, 21, 40, 74, 37, 92, 48, 45, 43, 59, 81, 44,
		28, 36, 67, 50, 95, 77, 39, 75, 58, 29, 84, 19, 7, 18, 23, 54, 73, 9, 0, 63, 71, 26, 51, 66, 10,
		14, 46, 49, 17, 82, 27, 62, 61, 52, 15, 25, 70, 38, 55, 6, 33, 13, 87, 93, 89, 86, 30, 35, 68,
		79, 4, 5, 90, 72, 47, 65, 32, 24, 60, 12, 78, 76, 41, 88, 1, 42, 34, 69, 91, 85, 83
	];

	const REJIMLAR = [
		{ id: 'uzluksiz', label: `Uzluksiz ajratish` },
		{ id: 'paged', label: `PagedAttention` }
	];
	let rejim = 'uzluksiz';

	const BOSHLANGICH = 3;
	let faol = BOSHLANGICH; // foydalanuvchi nechta so'rov yubordi

	type Katak = { r: number; tur: 'ish' | 'rezerv' } | null;

	function birinchiJoy(x: Katak[], kerak: number): number {
		let ket = 0;
		for (let i = 0; i < x.length; i++) {
			ket = x[i] === null ? ket + 1 : 0;
			if (ket >= kerak) return i - kerak + 1;
		}
		return -1;
	}

	function engUzunBosh(x: Katak[]): number {
		let ket = 0;
		let m = 0;
		for (let i = 0; i < x.length; i++) {
			ket = x[i] === null ? ket + 1 : 0;
			if (ket > m) m = ket;
		}
		return m;
	}

	type Chizma = {
		xarita: Katak[];
		joylashgan: number[];
		kutmoqda: number[];
		jadval: { r: number; fizik: number[] }[];
		baza: { r: number; boshi: number; uzunlik: number }[];
		ishBlok: number;
		bandBlok: number;
		boshBlok: number;
		ishTok: number;
		isrofTok: number;
		yana: number;
		engUzun: number;
	};

	function joylash(rj: string, n: number): Chizma {
		const xarita: Katak[] = new Array(JAMI_BLOK).fill(null);
		const joylashgan: number[] = [];
		const kutmoqda: number[] = [];
		const jadval: { r: number; fizik: number[] }[] = [];
		const baza: { r: number; boshi: number; uzunlik: number }[] = [];

		if (rj === 'paged') {
			let p = 0;
			for (let i = 0; i < n; i++) {
				const k = blokSoni(SOROVLAR[i].tok);
				if (p + k > JAMI_BLOK) {
					kutmoqda.push(i);
					continue;
				}
				const fizik: number[] = [];
				for (let j = 0; j < k; j++) {
					const b = TARTIB[p++];
					xarita[b] = { r: i, tur: 'ish' };
					fizik.push(b);
				}
				joylashgan.push(i);
				jadval.push({ r: i, fizik });
			}
		} else {
			for (let i = 0; i < n; i++) {
				const s = SOROVLAR[i];
				const kerak = blokSoni(s.moljalTok);
				const ish = blokSoni(s.tok);
				const boshi = birinchiJoy(xarita, kerak);
				if (boshi < 0) {
					kutmoqda.push(i);
					continue;
				}
				for (let j = 0; j < kerak; j++) {
					xarita[boshi + j] = { r: i, tur: j < ish ? 'ish' : 'rezerv' };
				}
				joylashgan.push(i);
				baza.push({ r: i, boshi, uzunlik: kerak });
			}
		}

		let ishBlok = 0;
		let bandBlok = 0;
		let ishTok = 0;
		for (const i of joylashgan) {
			const s = SOROVLAR[i];
			ishBlok += blokSoni(s.tok);
			bandBlok += rj === 'paged' ? blokSoni(s.tok) : blokSoni(s.moljalTok);
			ishTok += s.tok;
		}

		// Yana nechta so'rov sig'adi: hali joylashmagan so'rovlarni navbat bilan sinaymiz.
		const nomzod: number[] = [];
		for (let i = 0; i < SOROVLAR.length; i++) if (!joylashgan.includes(i)) nomzod.push(i);

		let yana = 0;
		if (rj === 'paged') {
			let bosh = JAMI_BLOK - ishBlok;
			for (const i of nomzod) {
				const k = blokSoni(SOROVLAR[i].tok);
				if (k <= bosh) {
					bosh -= k;
					yana += 1;
				}
			}
		} else {
			const nusxa: Katak[] = xarita.slice();
			for (const i of nomzod) {
				const kerak = blokSoni(SOROVLAR[i].moljalTok);
				const b = birinchiJoy(nusxa, kerak);
				if (b < 0) continue;
				for (let j = 0; j < kerak; j++) nusxa[b + j] = { r: i, tur: 'rezerv' };
				yana += 1;
			}
		}

		return {
			xarita,
			joylashgan,
			kutmoqda,
			jadval,
			baza,
			ishBlok,
			bandBlok,
			boshBlok: JAMI_BLOK - bandBlok,
			ishTok,
			isrofTok: bandBlok * BLOK_TOKEN - ishTok,
			yana,
			engUzun: engUzunBosh(xarita)
		};
	}

	$: chizma = joylash(rejim, faol);

	$: hammasiJoylashdi = chizma.joylashgan.length === SOROVLAR.length;
	$: tiqildi = chizma.yana === 0 && !hammasiJoylashdi;

	$: ulushIsh = (chizma.ishTok / JAMI_TOKEN) * 100;
	$: ulushIsrof = (chizma.isrofTok / JAMI_TOKEN) * 100;
	$: ichkiIsrof = chizma.bandBlok > 0 ? (chizma.isrofTok / (chizma.bandBlok * BLOK_TOKEN)) * 100 : 0;

	// hisoblagichlarni silliq o'zgartirish
	let kIsh = 0;
	let kIsrof = 0;
	let kIchki = 0;
	let sonTween: any = null;

	function qollaSon(a: number, b: number, c: number) {
		if (!mounted || kamHarakat) {
			kIsh = a;
			kIsrof = b;
			kIchki = c;
			return;
		}
		if (sonTween) sonTween.kill();
		const o = { a: kIsh, b: kIsrof, c: kIchki };
		sonTween = gsap.to(o, {
			a,
			b,
			c,
			duration: 0.45,
			ease: 'power2.out',
			onUpdate: () => {
				kIsh = o.a;
				kIsrof = o.b;
				kIchki = o.c;
			},
			onComplete: () => {
				kIsh = a;
				kIsrof = b;
				kIchki = c;
			}
		});
	}

	$: qollaSon(ulushIsh, ulushIsrof, ichkiIsrof);

	function katakStil(k: Katak): string {
		if (!k) return '';
		const s = SOROVLAR[k.r];
		if (k.tur === 'ish') return `background:${s.rang};border-color:${s.rang}`;
		return `background:${s.och};border-color:${s.rang}77`;
	}

	function katakYoz(k: Katak, i: number): string {
		if (!k) return `blok ${i}: bo'sh`;
		const s = SOROVLAR[k.r];
		const holat = k.tur === 'ish' ? `to'lgan` : `band qilingan, lekin bo'sh`;
		return `blok ${i}: so'rov ${s.nom} - ${holat}`;
	}

	let kataklar: HTMLElement[] = [];

	function tolqin(faqatYangi = -1) {
		if (!mounted || kamHarakat) return;
		const els: HTMLElement[] = [];
		for (let i = 0; i < JAMI_BLOK; i++) {
			const k = chizma.xarita[i];
			if (!k) continue;
			if (faqatYangi >= 0 && k.r !== faqatYangi) continue;
			if (kataklar[i]) els.push(kataklar[i]);
		}
		if (!els.length) return;
		gsap.fromTo(
			els,
			{ scale: 0.45, opacity: 0.15 },
			{
				scale: 1,
				opacity: 1,
				duration: 0.4,
				ease: 'power2.out',
				stagger: { each: 0.006, from: 'start' },
				clearProps: 'scale,opacity,transform'
			}
		);
	}

	async function rejimAlmashdi(_r: string) {
		if (!mounted) return; // sahifa ochilganda demo darhol to'liq ko'rinadi
		await tick();
		tolqin();
	}

	$: rejimAlmashdi(rejim);

	async function qosh() {
		if (faol >= SOROVLAR.length) return;
		const i = faol;
		faol += 1;
		await tick();
		tolqin(i);
	}

	function boshidan() {
		faol = BOSHLANGICH;
	}

	// ======================================================================
	// STEND 2 - batch vaqt chizig'i
	// ======================================================================
	const QADAM = 30;

	type Seg = { tur: 'ish' | 'yangi' | 'bosh' | 'isrof'; u: number; nom?: string; davom?: boolean };
	type Yol = { segs: Seg[] };

	const STATIK: Yol[] = [
		{ segs: [{ tur: 'ish', u: 8, nom: `A` }, { tur: 'isrof', u: 22 }] },
		{ segs: [{ tur: 'ish', u: 20, nom: `B` }, { tur: 'isrof', u: 10 }] },
		{ segs: [{ tur: 'ish', u: 12, nom: `C` }, { tur: 'isrof', u: 18 }] },
		{ segs: [{ tur: 'ish', u: 30, nom: `D` }] },
		{ segs: [{ tur: 'ish', u: 6, nom: `E` }, { tur: 'isrof', u: 24 }] },
		{ segs: [{ tur: 'ish', u: 16, nom: `F` }, { tur: 'isrof', u: 14 }] }
	];

	const DAVOMIY: Yol[] = [
		{
			segs: [
				{ tur: 'ish', u: 8, nom: `A` },
				{ tur: 'bosh', u: 1 },
				{ tur: 'yangi', u: 14, nom: `G` },
				{ tur: 'bosh', u: 1 },
				{ tur: 'yangi', u: 6, nom: `H`, davom: true }
			]
		},
		{
			segs: [
				{ tur: 'ish', u: 20, nom: `B` },
				{ tur: 'bosh', u: 1 },
				{ tur: 'yangi', u: 9, nom: `I`, davom: true }
			]
		},
		{
			segs: [
				{ tur: 'ish', u: 12, nom: `C` },
				{ tur: 'bosh', u: 1 },
				{ tur: 'yangi', u: 5, nom: `J` },
				{ tur: 'bosh', u: 1 },
				{ tur: 'yangi', u: 11, nom: `K`, davom: true }
			]
		},
		{ segs: [{ tur: 'ish', u: 30, nom: `D` }] },
		{
			segs: [
				{ tur: 'ish', u: 6, nom: `E` },
				{ tur: 'bosh', u: 1 },
				{ tur: 'yangi', u: 11, nom: `L` },
				{ tur: 'bosh', u: 1 },
				{ tur: 'yangi', u: 11, nom: `M`, davom: true }
			]
		},
		{
			segs: [
				{ tur: 'ish', u: 16, nom: `F` },
				{ tur: 'bosh', u: 1 },
				{ tur: 'yangi', u: 13, nom: `N`, davom: true }
			]
		}
	];

	const BATCH_REJIMLAR = [
		{ id: 'statik', label: `Statik batch` },
		{ id: 'davomiy', label: `Continuous batching` }
	];
	let batch = 'statik';

	$: yollar = batch === 'statik' ? STATIK : DAVOMIY;

	function segYoz(s: Seg): string {
		const bosh = s.nom ? `so'rov ${s.nom}: ` : `bo'sh o'rin: `;
		return `${bosh}${s.u} qadam`;
	}

	function bandlik(y: Yol[]): number {
		let ish = 0;
		for (const q of y) for (const s of q.segs) if (s.tur === 'ish' || s.tur === 'yangi') ish += s.u;
		return (ish / (y.length * QADAM)) * 100;
	}

	function tugagan(y: Yol[]): number {
		let n = 0;
		for (const q of y) for (const s of q.segs) if ((s.tur === 'ish' || s.tur === 'yangi') && !s.davom) n += 1;
		return n;
	}

	$: bandNishon = bandlik(yollar);
	$: tugaganSoni = tugagan(yollar);

	let kBand = 0;
	let bandTween: any = null;

	function qollaBand(nishon: number) {
		if (!mounted || kamHarakat) {
			kBand = nishon;
			return;
		}
		if (bandTween) bandTween.kill();
		const o = { v: kBand };
		bandTween = gsap.to(o, {
			v: nishon,
			duration: 0.45,
			ease: 'power2.out',
			onUpdate: () => (kBand = o.v),
			onComplete: () => (kBand = nishon)
		});
	}

	$: qollaBand(bandNishon);

	onMount(() => {
		mounted = true;
		kamHarakat = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		kIsh = ulushIsh;
		kIsrof = ulushIsrof;
		kIchki = ichkiIsrof;
		kBand = bandNishon;
		return () => {
			if (sonTween) sonTween.kill();
			if (bandTween) bandTween.kill();
		};
	});
</script>

<div class="pa-demo">
	<!-- ================================================================ -->
	<!-- STEND 1                                                          -->
	<!-- ================================================================ -->
	<Stend
		title="Bir xil so'rovlar, ikki xil joylashtirish"
		izoh={`Uzluksiz ajratishda har bir so'rov o'zining eng uzun bo'lishi mumkin bo'lgan javobiga joy band qiladi - shu och rangli quyruqlar hech qachon to'lmasligi mumkin. "Yangi so'rov qo'shish" ni bosib boring: uzluksiz rejim uchinchi so'rovdan keyin to'xtaydi, PagedAttention esa sakkiztasini ham sig'diradi.`}
	>
		<svelte:fragment slot="boshqaruv">
			<Swap label="Rejim" bind:value={rejim} options={REJIMLAR} />
			<button
				type="button"
				class="tugma asosiy"
				on:click={qosh}
				disabled={faol >= SOROVLAR.length}
			>
				Yangi so'rov qo'shish
			</button>
			<button type="button" class="tugma" on:click={boshidan} disabled={faol === BOSHLANGICH}>
				Boshidan
			</button>
		</svelte:fragment>

		<div class="stend1">
			<div class="tuzilma">
				<!-- xotira xaritasi -->
				<section class="xarita">
					<div class="qator-bosh">
						<span class="bosh-nom">GPU KV cache xotirasi</span>
						<span class="bosh-yon">{JAMI_BLOK} blok &middot; 1 blok = {BLOK_TOKEN} token</span>
					</div>

					<div class="tor" style="grid-template-columns: repeat({USTUN}, 1fr)">
						{#each chizma.xarita as k, i}
							<span
								class="katak"
								class:bosh={!k}
								class:rezerv={k && k.tur === 'rezerv'}
								bind:this={kataklar[i]}
								style={katakStil(k)}
								title={katakYoz(k, i)}
							>
								{#if k && k.tur === 'ish'}<i class="belgi">{SOROVLAR[k.r].nom}</i>{/if}
							</span>
						{/each}
					</div>

					<div class="afsona">
						<span class="afs"><i class="nuq tola"></i>to'lgan blok</span>
						<span class="afs"><i class="nuq rez"></i>band qilingan, bo'sh</span>
						<span class="afs"><i class="nuq erk"></i>hech kimga berilmagan</span>
					</div>
				</section>

				<!-- jadval paneli -->
				<aside class="panel">
					<div class="panel-bosh">
						{rejim === 'paged' ? `BLOK JADVALI` : `BAZAVIY MANZIL`}
					</div>

					{#if rejim === 'paged'}
						<p class="panel-izoh">
							mantiqiy blok &rarr; fizik blok. Fizik bloklar uzluksiz bo'lishi shart emas.
						</p>
						<ul class="qatorlar">
							{#each chizma.jadval as j (j.r)}
								<li class="qat">
									<span class="nuq" style="background:{SOROVLAR[j.r].rang}"></span>
									<span class="qat-nom">{SOROVLAR[j.r].nom}</span>
									<span class="qat-son">
										[{j.fizik.slice(0, 4).join(', ')}{j.fizik.length > 4 ? ', ...' : ''}]
									</span>
									<span class="qat-yon">{j.fizik.length} blok</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="panel-izoh">
							jadval yo'q: bitta bazaviy manzil va uzunlik. Uzunlik e'lon qilingan maksimal
							javobga teng.
						</p>
						<ul class="qatorlar">
							{#each chizma.baza as b (b.r)}
								<li class="qat">
									<span class="nuq" style="background:{SOROVLAR[b.r].rang}"></span>
									<span class="qat-nom">{SOROVLAR[b.r].nom}</span>
									<span class="qat-son">blok {b.boshi} &hellip; {b.boshi + b.uzunlik - 1}</span>
									<span class="qat-yon">
										{blokSoni(SOROVLAR[b.r].tok)}/{b.uzunlik}
									</span>
								</li>
							{/each}
						</ul>
					{/if}

					{#if chizma.kutmoqda.length}
						<div class="navbat">
							<span class="navbat-nom">navbatda kutmoqda</span>
							<span class="navbat-roy">
								{#each chizma.kutmoqda as i (i)}
									<span class="kutgan" style="border-color:{SOROVLAR[i].rang}; color:{SOROVLAR[i].rang}">
										{SOROVLAR[i].nom}
									</span>
								{/each}
							</span>
						</div>
					{/if}
				</aside>
			</div>

			{#if chizma.kutmoqda.length}
				<p class="ogoh-matn">
					Joy yo'q. So'rov <strong>{SOROVLAR[chizma.kutmoqda[0]].nom}</strong> uchun
					{blokSoni(SOROVLAR[chizma.kutmoqda[0]].moljalTok)} ta ketma-ket blok kerak, eng katta bo'sh
					diapazon esa {chizma.engUzun} blok. Xotirada {chizma.boshBlok} ta bo'sh blok bor &mdash;
					lekin bu so'rovga ulardan foydalanish taqiqlangan, chunki ular bitta uzluksiz bo'lak emas.
				</p>
			{/if}

			<!-- raqamlar -->
			<div class="raqamlar">
				<div class="raqam">
					<span class="raqam-nom">ishlatilgan xotira</span>
					<span class="raqam-son">{fmt(kIsh)}<span class="birlik">%</span></span>
					<span class="raqam-yon">{chizma.ishTok} token &middot; {chizma.ishBlok} blok</span>
				</div>

				<div class="raqam isrof-raqam" class:yomon={ulushIsrof > 25}>
					<span class="raqam-nom">isrof: band, lekin bo'sh</span>
					<span class="raqam-son">{fmt(kIsrof)}<span class="birlik">%</span></span>
					<span class="raqam-yon">
						band qilingan joyning {fmt(kIchki)}% i
					</span>
				</div>

				<div class="raqam sig-raqam" class:nol={tiqildi}>
					<span class="raqam-nom">yana nechta so'rov sig'adi</span>
					<span class="raqam-son">{chizma.yana}</span>
					<span class="raqam-yon">
						{hammasiJoylashdi
							? `xotirada ${chizma.joylashgan.length} so'rov, navbat bo'sh`
							: tiqildi
								? `${chizma.boshBlok} blok bo'sh, lekin yetmaydi`
								: `bo'sh: ${chizma.boshBlok} blok`}
					</span>
				</div>
			</div>
		</div>
	</Stend>

	<!-- ================================================================ -->
	<!-- STEND 2                                                          -->
	<!-- ================================================================ -->
	<Stend
		title="Batch ichida GPU nima qilyapti"
		izoh={`Statik batch'da barcha so'rovlar birga boshlanadi va eng uzuni tugagunicha hech kim chiqa olmaydi - shtrixlangan maydon shu kutish. Continuous batching har generatsiya qadamidan keyin tugaganini chiqarib, o'rniga navbatdagini kiritadi. Buni PagedAttention mumkin qiladi: yangi so'rovga katta uzluksiz bo'lak emas, bir nechta bo'sh blok yetadi.`}
	>
		<svelte:fragment slot="boshqaruv">
			<Swap label="Rejalashtirish" bind:value={batch} options={BATCH_REJIMLAR} />
		</svelte:fragment>

		<div class="stend2">
			<div class="chiziqlar">
				{#each yollar as y, i}
					<div class="yol">
						<span class="yol-nom">slot {i + 1}</span>
						<div class="yol-trek">
							{#each y.segs as s, j (j)}
								<span
									class="seg {s.tur}"
									class:davom={s.davom}
									style="width:{(s.u / QADAM) * 100}%"
									title={segYoz(s)}
								>
									{#if s.nom && s.u >= 5}<i class="seg-nom">{s.nom}</i>{/if}
								</span>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<div class="oq">
				<span>0</span>
				<span class="oq-orta">generatsiya qadami &rarr;</span>
				<span>{QADAM}</span>
			</div>

			<div class="afsona afsona-2">
				<span class="afs"><i class="nuq ish-nuq"></i>boshlang'ich batch ishlayapti</span>
				<span class="afs"><i class="nuq yangi-nuq"></i>navbatdan kirgan yangi so'rov</span>
				<span class="afs"><i class="nuq bosh-nuq"></i>yangi so'rovni joylashtirish</span>
				<span class="afs"><i class="nuq isrof-nuq"></i>tugagan, lekin o'rni bo'sh turibdi</span>
			</div>

			<div class="raqamlar ikki">
				<div class="raqam asosiy-raqam">
					<span class="raqam-nom">GPU bandligi</span>
					<span class="raqam-son">{fmt(kBand)}<span class="birlik">%</span></span>
					<span class="raqam-yon">{yollar.length} slot &times; {QADAM} qadam</span>
				</div>
				<div class="raqam">
					<span class="raqam-nom">shu {QADAM} qadamda tugagan so'rov</span>
					<span class="raqam-son">{tugaganSoni}</span>
					<span class="raqam-yon">
						{batch === 'statik'
							? `hammasi oxirgi qadamda birga chiqadi`
							: `chiqqan zahoti o'rni to'ldiriladi`}
					</span>
				</div>
			</div>
		</div>
	</Stend>
</div>

<style lang="scss">
	.pa-demo {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* ================= boshqaruv ================= */
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
		min-width: 640px;
	}

	.tuzilma {
		display: grid;
		grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
		gap: 1.1rem;
		align-items: start;
	}

	.qator-bosh {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.8rem;
		margin-bottom: 0.45rem;
	}

	.bosh-nom {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.84rem;
		font-weight: 500;
		color: theme('colors.gray.700');
	}

	.bosh-yon {
		font-family: theme('fontFamily.mono');
		font-size: 0.66rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.tor {
		display: grid;
		gap: 3px;
	}

	.katak {
		position: relative;
		aspect-ratio: 1 / 1;
		border-radius: 3px;
		border: 1px solid transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.3s ease, border-color 0.3s ease;
	}

	.katak.bosh {
		background: theme('colors.gray.50');
		border-color: theme('colors.gray.200');
		border-style: dashed;
	}

	.katak.rezerv {
		border-style: dashed;
	}

	.belgi {
		font-family: theme('fontFamily.mono');
		font-size: 0.56rem;
		font-style: normal;
		line-height: 1;
		color: white;
		opacity: 0.85;
	}

	.afsona {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem 0.85rem;
		margin-top: 0.55rem;
	}

	.afs {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.68rem;
		color: theme('colors.gray.400');
		white-space: nowrap;
	}

	.nuq {
		display: inline-block;
		width: 9px;
		height: 9px;
		border-radius: 2px;
		flex: none;
	}

	.nuq.tola {
		background: theme('colors.gray.600');
	}

	.nuq.rez {
		background: theme('colors.gray.200');
		border: 1px dashed theme('colors.gray.400');
	}

	.nuq.erk {
		background: theme('colors.gray.50');
		border: 1px dashed theme('colors.gray.300');
	}

	/* ---- panel ---- */
	.panel {
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		padding: 0.65rem 0.75rem 0.7rem;
		background: theme('colors.gray.50');
		min-width: 0;
	}

	.panel-bosh {
		font-family: theme('fontFamily.mono');
		font-size: 0.68rem;
		letter-spacing: 0.08em;
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.panel-izoh {
		margin: 0.3rem 0 0.6rem;
		font-size: 0.68rem;
		line-height: 1.5;
		color: theme('colors.gray.400');
	}

	.qatorlar {
		display: flex;
		flex-direction: column;
		gap: 0.28rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.qat {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.24rem 0.4rem;
		background: white;
		border: 1px solid theme('colors.gray.200');
		border-radius: 4px;
		min-width: 0;
	}

	.qat-nom {
		font-family: theme('fontFamily.mono');
		font-size: 0.72rem;
		font-weight: 600;
		color: theme('colors.gray.700');
		flex: none;
	}

	.qat-son {
		font-family: theme('fontFamily.mono');
		font-size: 0.68rem;
		color: theme('colors.gray.500');
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
		min-width: 0;
	}

	.qat-yon {
		font-family: theme('fontFamily.mono');
		font-size: 0.62rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		flex: none;
	}

	.navbat {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		flex-wrap: wrap;
		margin-top: 0.6rem;
		padding-top: 0.5rem;
		border-top: 1px dashed theme('colors.gray.300');
	}

	.navbat-nom {
		font-size: 0.66rem;
		color: theme('colors.gray.400');
		white-space: nowrap;
	}

	.navbat-roy {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.kutgan {
		font-family: theme('fontFamily.mono');
		font-size: 0.66rem;
		font-weight: 600;
		padding: 0.06rem 0.3rem;
		border: 1px dashed;
		border-radius: 3px;
		background: white;
	}

	.ogoh-matn {
		font-size: 0.78rem;
		line-height: 1.6;
		color: theme('colors.red.600');
		padding: 0.5rem 0.7rem;
		border: 1px solid theme('colors.red.200');
		background: theme('colors.red.50');
		border-radius: 5px;
		margin: 0;
	}

	/* ---- raqamlar ---- */
	.raqamlar {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.7rem;
	}

	.raqamlar.ikki {
		grid-template-columns: repeat(2, 1fr);
	}

	.raqam {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.6rem 0.8rem 0.65rem;
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

	.birlik {
		font-size: 0.85rem;
		font-weight: 500;
		color: theme('colors.gray.400');
		margin-left: 0.12rem;
	}

	.raqam-yon {
		font-family: theme('fontFamily.mono');
		font-size: 0.64rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.isrof-raqam.yomon {
		border-color: theme('colors.red.200');
		background: theme('colors.red.50');
	}

	.isrof-raqam.yomon .raqam-son {
		color: theme('colors.red.600');
	}

	.isrof-raqam.yomon .birlik {
		color: theme('colors.red.400');
	}

	.sig-raqam {
		border-color: theme('colors.purple.200');
		background: theme('colors.purple.50');
	}

	.sig-raqam .raqam-son {
		color: theme('colors.purple.700');
	}

	.sig-raqam.nol {
		border-color: theme('colors.gray.200');
		background: theme('colors.gray.50');
	}

	.sig-raqam.nol .raqam-son {
		color: theme('colors.gray.400');
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

	/* ================= STEND 2 ================= */
	.stend2 {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		min-width: 640px;
	}

	.chiziqlar {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.yol {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.yol-nom {
		width: 48px;
		flex: none;
		font-family: theme('fontFamily.mono');
		font-size: 0.66rem;
		color: theme('colors.gray.400');
		text-align: right;
	}

	.yol-trek {
		display: flex;
		flex: 1;
		height: 26px;
		min-width: 0;
		border: 1px solid theme('colors.gray.200');
		border-radius: 4px;
		overflow: hidden;
		background: white;
	}

	.seg {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 0;
		transition: width 0.4s ease, background 0.3s ease;
	}

	.seg.ish {
		background: theme('colors.purple.600');
	}

	.seg.yangi {
		background: theme('colors.purple.300');
	}

	.seg.bosh {
		background: theme('colors.gray.300');
	}

	.seg.isrof {
		background: repeating-linear-gradient(
			45deg,
			theme('colors.gray.100'),
			theme('colors.gray.100') 4px,
			theme('colors.gray.200') 4px,
			theme('colors.gray.200') 8px
		);
	}

	.seg.davom {
		border-right: 2px dashed white;
	}

	.seg-nom {
		font-family: theme('fontFamily.mono');
		font-size: 0.62rem;
		font-style: normal;
		line-height: 1;
		color: white;
		opacity: 0.9;
	}

	.seg.yangi .seg-nom {
		color: theme('colors.purple.900');
		opacity: 0.75;
	}

	.oq {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-left: calc(48px + 0.6rem);
		font-family: theme('fontFamily.mono');
		font-size: 0.64rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
	}

	.oq-orta {
		color: theme('colors.gray.300');
	}

	.afsona-2 {
		gap: 0.15rem 0.9rem;
		margin-top: 0;
	}

	.nuq.ish-nuq {
		background: theme('colors.purple.600');
	}

	.nuq.yangi-nuq {
		background: theme('colors.purple.300');
	}

	.nuq.bosh-nuq {
		background: theme('colors.gray.300');
	}

	.nuq.isrof-nuq {
		background: repeating-linear-gradient(
			45deg,
			theme('colors.gray.100'),
			theme('colors.gray.100') 3px,
			theme('colors.gray.300') 3px,
			theme('colors.gray.300') 6px
		);
		border: 1px solid theme('colors.gray.200');
	}

	@media (prefers-reduced-motion: reduce) {
		.tugma,
		.katak,
		.raqam,
		.seg {
			transition: none;
		}
	}
</style>
