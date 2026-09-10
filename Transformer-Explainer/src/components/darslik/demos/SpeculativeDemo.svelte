<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Stend from '~/components/darslik/Stend.svelte';
	import Katex from '~/utils/Katex.svelte';
	import { gsap } from '~/utils/gsap';

	// ======================================================================
	// UMUMIY
	// ======================================================================
	let mounted = false;
	let kamHarakat = false;

	function fmt(v: number, n = 2): string {
		return v.toFixed(n);
	}

	const CHECK = '\u2713';
	const CROSS = '\u2717';
	const DASH = '\u2013';

	// SVG uchun ranglar (tailwind palitrasi bilan bir xil)
	const GRAY_100 = '#f3f4f6';
	const GRAY_200 = '#e5e7eb';
	const GRAY_300 = '#d1d5db';
	const GRAY_400 = '#9ca3af';
	const PURPLE_400 = '#c084fc';
	const PURPLE_700 = '#7e22ce';

	// ======================================================================
	// STEND 1 - qadam-baqadam draft / verify sikli
	// ======================================================================

	// target model chiqaradigan "to'g'ri" ketma-ketlik.
	// 0-token - prompt, qolgani generatsiya qilinadi.
	const TARGET = [`Bugun`, `havo`, `juda`, `issiq`, `va`, `quyoshli`, `bo'ladi`, `deb`, `aytishdi`];

	// draft modelning oldindan yozilgan taxminlari (tasodifiy emas).
	// 4- va 7- pozitsiyada u adashadi: `hamda` va `deydi`.
	const DRAFT = [``, `havo`, `juda`, `issiq`, `hamda`, `quyoshli`, `bo'ladi`, `deydi`, `aytishdi`];

	const OXIR = TARGET.length;

	type Tur = 'prompt' | 'qabul' | 'tuzatildi' | 'bonus';
	type Chiqqan = { t: string; tur: Tur; qadam: number };
	type Faza = 'kutish' | 'taxmin' | 'tekshir' | 'natija';

	type Round = {
		bosh: number;
		taklif: string[];
		qabul: number; // nechta taklif mos keldi
		radBor: boolean;
		qoshimcha: string; // target qo'shgan token
		qoshimchaTur: Tur;
		tashlandi: string[];
		chiqqan: number;
		yangiPos: number;
		draftK: number;
	};

	let gamma = 4;
	let pos = 1;
	let chiqarilgan: Chiqqan[] = [];
	let passlar = 0;
	let tokenlar = 0;
	let draftQadam = 0;
	let faza: Faza = 'kutish';
	let band = false;
	let joriy: Round | null = null;

	let oqimEl: HTMLElement;
	let taymer: any[] = [];

	function taymerTozala() {
		taymer.forEach((t) => t && t.kill && t.kill());
		taymer = [];
	}

	function tanla(sel: string): HTMLElement[] {
		if (!oqimEl) return [];
		return Array.from(oqimEl.querySelectorAll(sel)) as HTMLElement[];
	}

	// --- bitta qadamni oldindan hisoblash ---------------------------------
	function tayyorla(p: number, g: number): Round | null {
		const qolgan = OXIR - p;
		if (qolgan <= 0) return null;

		const k = Math.min(g, qolgan);
		const taklif: string[] = [];
		for (let i = 0; i < k; i++) taklif.push(DRAFT[p + i]);

		// chapdan o'ngga solishtirish: birinchi mos kelmagan joy
		let j = k;
		for (let i = 0; i < k; i++) {
			if (taklif[i] !== TARGET[p + i]) {
				j = i;
				break;
			}
		}

		const radBor = j < k;
		let qoshimcha = '';
		let qoshimchaTur: Tur = 'bonus';

		if (radBor) {
			qoshimcha = TARGET[p + j];
			qoshimchaTur = 'tuzatildi';
		} else if (p + k < OXIR) {
			qoshimcha = TARGET[p + k];
			qoshimchaTur = 'bonus';
		}

		const tashlandi = radBor ? taklif.slice(j + 1) : [];
		const chiqqan = j + (qoshimcha ? 1 : 0);

		return {
			bosh: p,
			taklif,
			qabul: j,
			radBor,
			qoshimcha,
			qoshimchaTur,
			tashlandi,
			chiqqan,
			yangiPos: p + chiqqan,
			draftK: k
		};
	}

	function qollaNatija(r: Round) {
		const q = passlar + 1;
		const yangi: Chiqqan[] = [];
		for (let i = 0; i < r.qabul; i++) {
			yangi.push({ t: TARGET[r.bosh + i], tur: 'qabul', qadam: q });
		}
		if (r.qoshimcha) yangi.push({ t: r.qoshimcha, tur: r.qoshimchaTur, qadam: q });

		chiqarilgan = [...chiqarilgan, ...yangi];
		passlar = q;
		tokenlar += r.chiqqan;
		draftQadam += r.draftK;
		pos = r.yangiPos;
		faza = 'natija';
	}

	// --- ko'rinish --------------------------------------------------------
	type Katak = { kalit: string; t: string; rol: string; belgi: string; tag: string; yangi: boolean };

	function qurKorinish(ch: Chiqqan[], r: Round | null, f: Faza, q: number): Katak[] {
		const out: Katak[] = [];

		ch.forEach((c, i) => {
			const yangi = f === 'natija' && c.qadam === q;
			let tag = `q${c.qadam}`;
			if (c.tur === 'prompt') tag = `prompt`;
			else if (c.tur === 'tuzatildi') tag = `tuzatildi`;
			else if (c.tur === 'bonus') tag = `bonus`;
			out.push({
				kalit: 'c' + i,
				t: c.t,
				rol: c.tur,
				belgi: yangi && c.tur === 'qabul' ? CHECK : '',
				tag,
				yangi
			});
		});

		if (r && (f === 'taxmin' || f === 'tekshir')) {
			r.taklif.forEach((t, i) => {
				let belgi = '';
				if (f === 'tekshir') {
					belgi = i < r.qabul ? CHECK : i === r.qabul ? CROSS : DASH;
				}
				out.push({ kalit: 'p' + i, t, rol: 'taxmin', belgi, tag: `taxmin`, yangi: true });
			});
		}

		if (r && f === 'natija') {
			r.tashlandi.forEach((t, i) => {
				out.push({ kalit: 'd' + i, t, rol: 'rad', belgi: DASH, tag: `tashlandi`, yangi: false });
			});
		}

		return out;
	}

	$: korinish = qurKorinish(chiqarilgan, joriy, faza, passlar);
	$: tugadi = pos >= OXIR;

	// --- animatsiya -------------------------------------------------------
	function animTaxmin() {
		if (!mounted || kamHarakat) return;
		const els = tanla('[data-rol="taxmin"]');
		if (!els.length) return;
		gsap.fromTo(
			els,
			{ opacity: 0, y: -8 },
			{
				opacity: 1,
				y: 0,
				duration: 0.3,
				ease: 'power2.out',
				stagger: 0.07,
				clearProps: 'opacity,transform'
			}
		);
	}

	function animTekshir() {
		if (!mounted || kamHarakat) return;
		const els = tanla('[data-rol="taxmin"] .belgi');
		if (!els.length) return;
		gsap.fromTo(
			els,
			{ opacity: 0, scale: 0.5 },
			{
				opacity: 1,
				scale: 1,
				duration: 0.25,
				ease: 'back.out(2.2)',
				stagger: 0.06,
				clearProps: 'opacity,transform'
			}
		);
	}

	function animNatija() {
		if (!mounted || kamHarakat) return;

		const qabullar = tanla('[data-rol="qabul"][data-yangi="1"]');
		if (qabullar.length) {
			gsap.fromTo(
				qabullar,
				{ scale: 0.94 },
				{ scale: 1, duration: 0.3, ease: 'power2.out', stagger: 0.05, clearProps: 'transform' }
			);
		}

		const tuzatilgan = tanla('[data-yangi="1"][data-rol="tuzatildi"], [data-yangi="1"][data-rol="bonus"]');
		if (tuzatilgan.length) {
			gsap.fromTo(
				tuzatilgan,
				{ opacity: 0, scale: 0.8, y: 6 },
				{
					opacity: 1,
					scale: 1,
					y: 0,
					duration: 0.4,
					ease: 'back.out(2)',
					clearProps: 'opacity,transform'
				}
			);
		}

		const radlar = tanla('[data-rol="rad"]');
		if (radlar.length) {
			gsap.fromTo(
				radlar,
				{ opacity: 1, y: 0 },
				{ opacity: 0.45, y: 5, duration: 0.4, ease: 'power2.out' }
			);
		}
	}

	// --- boshqaruv --------------------------------------------------------
	function tozala() {
		taymerTozala();
		joriy = null;
		faza = 'kutish';
		band = false;
		pos = 1;
		passlar = 0;
		tokenlar = 0;
		draftQadam = 0;
		chiqarilgan = [{ t: TARGET[0], tur: 'prompt', qadam: 0 }];
	}

	function darhol() {
		const r = tayyorla(pos, gamma);
		if (!r) return;
		joriy = r;
		qollaNatija(r);
	}

	function boshidan() {
		tozala();
	}

	async function keyingi() {
		if (band || pos >= OXIR) return;
		const r = tayyorla(pos, gamma);
		if (!r) return;

		band = true;
		joriy = r;

		if (!mounted || kamHarakat) {
			qollaNatija(r);
			band = false;
			return;
		}

		faza = 'taxmin';
		await tick();
		animTaxmin();

		taymer.push(
			gsap.delayedCall(0.62, async () => {
				faza = 'tekshir';
				await tick();
				animTekshir();
			})
		);

		taymer.push(
			gsap.delayedCall(1.45, async () => {
				qollaNatija(r);
				await tick();
				animNatija();
				band = false;
			})
		);
	}

	// gamma o'zgarsa sikl boshidan boshlanadi - nisbat solishtiriladigan bo'lsin
	async function gammaOzgardi(_g: number) {
		if (!mounted) return;
		tozala();
		darhol();
		await tick();
		animNatija();
	}

	$: gammaOzgardi(gamma);

	// --- hisoblagichlar ---------------------------------------------------
	$: nisbat = passlar > 0 ? tokenlar / passlar : 0;

	let korsatNisbat = 0;
	let nisbatTween: any = null;

	function qollaNisbat(n: number) {
		if (!mounted || kamHarakat) {
			korsatNisbat = n;
			return;
		}
		if (nisbatTween) nisbatTween.kill();
		const o = { v: korsatNisbat };
		nisbatTween = gsap.to(o, {
			v: n,
			duration: 0.4,
			ease: 'power2.out',
			onUpdate: () => (korsatNisbat = o.v),
			onComplete: () => (korsatNisbat = n)
		});
	}

	$: qollaNisbat(nisbat);

	const CHEGARA_F = String.raw`1 \;\le\; \text{token/qadam} \;\le\; \gamma + 1`;

	// boshlang'ich holat: sahifa ochilganda bitta sikl allaqachon bajarilgan bo'lsin
	tozala();
	darhol();

	// ======================================================================
	// STEND 2 - kutilayotgan foyda
	// ======================================================================
	let alpha = 0.8;
	let gammaB = 4;

	function kutilgan(a: number, g: number): number {
		if (a >= 0.9995) return g + 1;
		return (1 - Math.pow(a, g + 1)) / (1 - a);
	}

	const CH_W = 760;
	const CH_H = 280;
	const ML = 54;
	const MR = 92;
	const MT = 18;
	const MB = 36;
	const PW = CH_W - ML - MR;
	const PH = CH_H - MT - MB;
	const G_MIN = 1;
	const G_MAX = 10;
	const Y_MAX = 11;

	function X(g: number): number {
		return ML + ((g - G_MIN) / (G_MAX - G_MIN)) * PW;
	}

	function Y(v: number): number {
		return MT + (1 - v / Y_MAX) * PH;
	}

	function yol(a: number): string {
		const n = 60;
		let d = '';
		for (let i = 0; i <= n; i++) {
			const g = G_MIN + ((G_MAX - G_MIN) * i) / n;
			d += (i === 0 ? 'M' : 'L') + fmt(X(g), 1) + ' ' + fmt(Y(kutilgan(a, g)), 1) + ' ';
		}
		return d.trim();
	}

	const ORNAK = [0.3, 0.5, 0.7, 0.9];
	const Y_TICK = [0, 2, 4, 6, 8, 10];
	const X_TICK = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

	$: joriyYol = yol(alpha);
	$: eKut = kutilgan(alpha, gammaB);
	$: maksimum = gammaB + 1;
	$: ulush = eKut / maksimum;
	$: nuqtaX = X(gammaB);
	$: nuqtaY = Y(eKut);

	// yonidagi qadam bilan farq: gamma ni bittaga oshirish nima beradi
	$: keyingiFoyda = kutilgan(alpha, gammaB + 1) - eKut;

	const KUT_F = String.raw`\mathbb{E}[\text{token/qadam}] \;=\; \frac{1 - \alpha^{\gamma+1}}{1 - \alpha}`;
	const KUT_TARIF = String.raw`\alpha = \text{qabul qilish darajasi},\quad \gamma = \text{bir qadamda taxmin qilinadigan token}`;

	onMount(() => {
		mounted = true;
		kamHarakat = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		korsatNisbat = nisbat;
		return () => {
			taymerTozala();
			if (nisbatTween) nisbatTween.kill();
		};
	});
</script>

<div class="sp-demo">
	<!-- ================================================================ -->
	<!-- STEND 1                                                          -->
	<!-- ================================================================ -->
	<Stend
		title="Bir qadam: taxmin qil, bir yo'la tekshir"
		izoh={`Keyingi qadam ni bosing. Draft model gamma ta tokenni ketma-ket taxmin qiladi, target model ularning hammasini BITTA forward pass da tekshiradi. Birinchi mos kelmagan joyda taxmin uziladi va o'sha o'ringa target ning o'z tokeni qo'yiladi, undan keyingilari tashlanadi. Pastdagi katta raqam - bitta target passiga to'g'ri keladigan token soni; oddiy decoding da u har doim 1.00.`}
	>
		<svelte:fragment slot="boshqaruv">
			<label class="slayder">
				<span class="slayder-nom">&gamma; (taxmin uzunligi)</span>
				<input type="range" min="1" max="8" step="1" bind:value={gamma} aria-label="gamma" />
				<span class="slayder-son qisqa">{gamma}</span>
			</label>

			<button type="button" class="tugma asosiy" on:click={keyingi} disabled={tugadi || band}>
				Keyingi qadam
			</button>
			<button type="button" class="tugma" on:click={boshidan} disabled={passlar === 0}>
				Boshidan
			</button>
		</svelte:fragment>

		<div class="stend1">
			<!-- faza chizig'i -->
			<div class="fazalar">
				<span class="faza-bir" class:faol={faza === 'taxmin'}>
					<i class="raq">1</i> draft taxmin qiladi
					<span class="faza-yon">{gamma} ta arzon qadam</span>
				</span>
				<span class="strelka">&rarr;</span>
				<span class="faza-bir" class:faol={faza === 'tekshir'}>
					<i class="raq">2</i> target tekshiradi
					<span class="faza-yon">1 ta forward pass</span>
				</span>
				<span class="strelka">&rarr;</span>
				<span class="faza-bir" class:faol={faza === 'natija'}>
					<i class="raq">3</i> qabul / tuzatish
					<span class="faza-yon">kamida 1 token</span>
				</span>
			</div>

			<!-- token oqimi -->
			<div class="oqim" bind:this={oqimEl}>
				{#each korinish as k (k.kalit)}
					<div class="katak" data-rol={k.rol} data-yangi={k.yangi ? '1' : '0'}>
						<span class="belgi {k.rol}" class:ha={k.belgi === CHECK} class:yoq={k.belgi === CROSS}>
							{k.belgi}
						</span>
						<span class="soz {k.rol}">{k.t}</span>
						<span class="tag {k.rol}">{k.tag}</span>
					</div>
				{/each}

				{#if tugadi}
					<div class="katak">
						<span class="belgi"></span>
						<span class="soz tamom">tugadi</span>
						<span class="tag"></span>
					</div>
				{/if}
			</div>

			<!-- legenda -->
			<p class="izoh-qator">
				<i class="nuq taxmin-nuq"></i> draft taxmini (hali tekshirilmagan)
				<span class="ayirgich">&middot;</span>
				<i class="nuq qabul-nuq"></i> qabul qilindi
				<span class="ayirgich">&middot;</span>
				<i class="nuq tuzat-nuq"></i> target qo'ygan token
				<span class="ayirgich">&middot;</span>
				<i class="nuq rad-nuq"></i> tashlandi
			</p>

			<!-- hisoblagichlar -->
			<div class="hisob">
				<div class="hisob-asos">
					<span class="hisob-nom">bir target forward pass ga to'g'ri keladigan token</span>
					<span class="hisob-son">{passlar === 0 ? '--' : fmt(korsatNisbat, 2)}</span>
					<span class="hisob-f"><Katex math={CHEGARA_F} /></span>
				</div>

				<div class="hisob-yon">
					<div class="qator faol">
						<span class="qator-nom">target model forward pass</span>
						<span class="qator-son">{passlar}</span>
					</div>
					<div class="qator faol">
						<span class="qator-nom">chiqarilgan token</span>
						<span class="qator-son">{tokenlar}</span>
					</div>
					<div class="qator">
						<span class="qator-nom">draft model qadamlari</span>
						<span class="qator-son">{draftQadam}</span>
						<span class="qator-f kulrang">arzon</span>
					</div>
					<div class="qator taqqos">
						<span class="qator-nom">oddiy decoding bo'lsa</span>
						<span class="qator-son">{tokenlar}</span>
						<span class="qator-f kulrang">pass &middot; 1.00</span>
					</div>
				</div>
			</div>
		</div>
	</Stend>

	<!-- ================================================================ -->
	<!-- STEND 2                                                          -->
	<!-- ================================================================ -->
	<Stend
		title="Kutilayotgan foyda: alpha va gamma"
		izoh={`alpha past bo'lsa gamma ni oshirishning foydasi yo'q - egri chiziq tezda tekislanadi va qo'shimcha draft qadamlari behuda ketadi. Draft model target ga qanchalik o'xshash bo'lsa, shuncha ko'p yutamiz.`}
	>
		<svelte:fragment slot="boshqaruv">
			<label class="slayder">
				<span class="slayder-nom">&alpha; (qabul darajasi)</span>
				<input
					type="range"
					min="0.1"
					max="0.95"
					step="0.05"
					bind:value={alpha}
					aria-label="alpha qabul darajasi"
				/>
				<span class="slayder-son">{fmt(alpha, 2)}</span>
			</label>

			<label class="slayder">
				<span class="slayder-nom">&gamma;</span>
				<input type="range" min="1" max="10" step="1" bind:value={gammaB} aria-label="gamma" />
				<span class="slayder-son qisqa">{gammaB}</span>
			</label>
		</svelte:fragment>

		<div class="stend2">
			<div class="formula-blok">
				<div class="formula"><Katex math={KUT_F} /></div>
				<div class="tarif"><Katex math={KUT_TARIF} /></div>
			</div>

			<div class="grafik">
				<svg viewBox="0 0 {CH_W} {CH_H}" role="img" aria-label="Kutilayotgan tokenlar soni egri chizigi">
					<!-- y setka -->
					{#each Y_TICK as t}
						<line x1={ML} y1={Y(t)} x2={ML + PW} y2={Y(t)} stroke={GRAY_100} stroke-width="1" />
						<text x={ML - 10} y={Y(t) + 4} text-anchor="end" class="tik">{t}</text>
					{/each}

					<!-- x o'qi -->
					<line x1={ML} y1={Y(0)} x2={ML + PW} y2={Y(0)} stroke={GRAY_300} stroke-width="1" />
					{#each X_TICK as g}
						<text x={X(g)} y={Y(0) + 18} text-anchor="middle" class="tik">{g}</text>
					{/each}
					<text x={ML + PW / 2} y={CH_H - 4} text-anchor="middle" class="oq-nom">
						&gamma; &mdash; bir qadamda taxmin qilinadigan token
					</text>
					<text
						x="14"
						y={MT + PH / 2}
						text-anchor="middle"
						class="oq-nom"
						transform="rotate(-90 14 {MT + PH / 2})"
					>
						kutilayotgan token / qadam
					</text>

					<!-- oddiy decoding chizig'i -->
					<line
						x1={ML}
						y1={Y(1)}
						x2={ML + PW}
						y2={Y(1)}
						stroke={GRAY_400}
						stroke-width="1"
						stroke-dasharray="4 4"
					/>
					<text x={ML + PW + 6} y={Y(1) + 13} class="ornak-yoz">oddiy = 1</text>

					<!-- namuna egri chiziqlari -->
					{#each ORNAK as a}
						<path d={yol(a)} fill="none" stroke={GRAY_200} stroke-width="1.5" />
						<text x={ML + PW + 6} y={Y(kutilgan(a, G_MAX)) + 4} class="ornak-yoz">
							&#945;={fmt(a, 2)}
						</text>
					{/each}

					<!-- joriy egri chiziq -->
					<path d={joriyYol} fill="none" stroke={PURPLE_700} stroke-width="2.5" stroke-linecap="round" />

					<!-- joriy nuqta -->
					<line
						x1={nuqtaX}
						y1={nuqtaY}
						x2={nuqtaX}
						y2={Y(0)}
						stroke={PURPLE_400}
						stroke-width="1"
						stroke-dasharray="3 3"
					/>
					<line
						x1={ML}
						y1={nuqtaY}
						x2={nuqtaX}
						y2={nuqtaY}
						stroke={PURPLE_400}
						stroke-width="1"
						stroke-dasharray="3 3"
					/>
					<circle cx={nuqtaX} cy={nuqtaY} r="6" fill="#ffffff" stroke={PURPLE_700} stroke-width="2.5" />
					<circle cx={nuqtaX} cy={nuqtaY} r="2.5" fill={PURPLE_700} />
					<text x={nuqtaX + 10} y={nuqtaY - 9} class="nuqta-yoz">{fmt(eKut, 2)}</text>
				</svg>
			</div>

			<div class="raqamlar">
				<div class="raqam asosiy-raqam">
					<span class="raqam-nom">kutilayotgan token / qadam</span>
					<span class="raqam-son">{fmt(eKut, 2)}</span>
				</div>
				<div class="raqam">
					<span class="raqam-nom">nazariy maksimum (&gamma; + 1)</span>
					<span class="raqam-son kichikroq">{maksimum}<span class="birlik">token</span></span>
				</div>
				<div class="raqam">
					<span class="raqam-nom">maksimumning ulushi</span>
					<span class="raqam-son kichikroq">{fmt(ulush * 100, 0)}<span class="birlik">%</span></span>
				</div>
			</div>

			<p class="qoshimcha-izoh">
				&gamma; ni bittaga oshirsangiz, kutilayotgan token
				<strong>+{fmt(keyingiFoyda, 3)}</strong> ga o'sadi &mdash; lekin har qadamda draft modelning
				yana bitta chaqiruvi qo'shiladi. Shu ikki egri chiziq kesishgan joyda optimal &gamma; turadi.
			</p>
		</div>
	</Stend>
</div>

<style lang="scss">
	.sp-demo {
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
		min-width: 2.6em;
		text-align: right;
	}

	.slayder-son.qisqa {
		min-width: 1.4em;
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
		gap: 1.05rem;
		min-width: 620px;
	}

	/* ---- faza chizig'i ---- */
	.fazalar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.faza-bir {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.6rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 5px;
		font-size: 0.74rem;
		color: theme('colors.gray.500');
		background: white;
		transition: border-color 0.25s ease, background 0.25s ease, color 0.25s ease;
	}

	.faza-bir.faol {
		border-color: theme('colors.purple.300');
		background: theme('colors.purple.50');
		color: theme('colors.purple.700');
	}

	.raq {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background: theme('colors.gray.100');
		color: theme('colors.gray.500');
		font-family: theme('fontFamily.mono');
		font-size: 0.6rem;
		font-style: normal;
		flex: none;
		transition: background 0.25s ease, color 0.25s ease;
	}

	.faza-bir.faol .raq {
		background: theme('colors.purple.600');
		color: white;
	}

	.faza-yon {
		font-family: theme('fontFamily.mono');
		font-size: 0.64rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
	}

	.strelka {
		color: theme('colors.gray.300');
		font-size: 0.8rem;
	}

	/* ---- token oqimi ---- */
	.oqim {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 6px 5px;
		min-height: 88px;
		padding: 0.7rem 0.6rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		background: theme('colors.gray.50');
	}

	.katak {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		min-width: 0;
	}

	.belgi {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 15px;
		font-family: theme('fontFamily.mono');
		font-size: 0.78rem;
		line-height: 1;
		color: theme('colors.gray.300');
	}

	.belgi.ha {
		color: theme('colors.purple.600');
		font-weight: 700;
	}

	.belgi.yoq {
		color: theme('colors.gray.600');
		font-weight: 700;
	}

	.soz {
		display: block;
		padding: 0.3rem 0.55rem;
		border-radius: 4px;
		font-size: 0.82rem;
		line-height: 1.15;
		white-space: nowrap;
		border: 1px solid transparent;
		transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
	}

	.soz.prompt {
		background: theme('colors.gray.100');
		border-color: theme('colors.gray.200');
		color: theme('colors.gray.500');
	}

	.soz.qabul {
		background: theme('colors.purple.600');
		border-color: theme('colors.purple.600');
		color: white;
	}

	.soz.tuzatildi {
		background: white;
		border-color: theme('colors.purple.600');
		border-style: solid;
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.soz.bonus {
		background: theme('colors.purple.100');
		border-color: theme('colors.purple.300');
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.soz.taxmin {
		background: white;
		border: 1px dashed theme('colors.gray.300');
		color: theme('colors.gray.400');
	}

	.soz.rad {
		background: transparent;
		border: 1px dashed theme('colors.gray.200');
		color: theme('colors.gray.400');
		text-decoration: line-through;
	}

	.soz.tamom {
		background: transparent;
		border: 1px dashed theme('colors.purple.200');
		color: theme('colors.purple.400');
		font-family: theme('fontFamily.mono');
		font-size: 0.7rem;
	}

	.tag {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 13px;
		font-family: theme('fontFamily.mono');
		font-size: 0.56rem;
		letter-spacing: 0.02em;
		color: theme('colors.gray.300');
		white-space: nowrap;
	}

	.tag.tuzatildi,
	.tag.bonus {
		color: theme('colors.purple.600');
		font-weight: 600;
	}

	.tag.taxmin {
		color: theme('colors.gray.400');
	}

	.tag.prompt {
		color: theme('colors.gray.400');
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

	.taxmin-nuq {
		background: white;
		border: 1px dashed theme('colors.gray.400');
	}

	.qabul-nuq {
		background: theme('colors.purple.600');
	}

	.tuzat-nuq {
		background: white;
		border: 1px solid theme('colors.purple.600');
	}

	.rad-nuq {
		background: theme('colors.gray.200');
		border: 1px solid theme('colors.gray.300');
	}

	/* ---- hisoblagich ---- */
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
	}

	.hisob-f {
		color: theme('colors.gray.400');
		margin-top: 0.15rem;
	}

	.hisob-f :global(.katex) {
		font-size: 0.72rem;
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

	.qator.faol .qator-son {
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.qator-f {
		min-width: 5.2em;
		text-align: right;
	}

	.kulrang {
		font-size: 0.7rem;
		color: theme('colors.gray.300');
	}

	.qator.taqqos {
		margin-top: 0.15rem;
		padding-top: 0.35rem;
		border-top: 1px dashed theme('colors.gray.200');
	}

	/* ================= STEND 2 ================= */
	.stend2 {
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

	.formula {
		color: theme('colors.gray.800');
	}

	.formula :global(.katex) {
		font-size: 1rem;
	}

	.tarif {
		margin-top: 0.35rem;
		color: theme('colors.gray.400');
	}

	.tarif :global(.katex) {
		font-size: 0.7rem;
	}

	.grafik {
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		padding: 0.4rem 0.3rem 0.1rem;
		background: white;
	}

	.grafik svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.tik {
		font-family: theme('fontFamily.mono');
		font-size: 10px;
		fill: theme('colors.gray.400');
	}

	.oq-nom {
		font-size: 10px;
		fill: theme('colors.gray.400');
		letter-spacing: 0.04em;
	}

	.ornak-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 9.5px;
		fill: theme('colors.gray.400');
	}

	.nuqta-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 13px;
		font-weight: 700;
		fill: theme('colors.purple.700');
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
	}

	.raqam.asosiy-raqam {
		border-color: theme('colors.purple.200');
		background: theme('colors.purple.50');
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

	.asosiy-raqam .raqam-son {
		color: theme('colors.purple.700');
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

	.qoshimcha-izoh {
		font-size: 0.76rem;
		line-height: 1.6;
		color: theme('colors.gray.500');
		margin: 0;
	}

	.qoshimcha-izoh strong {
		font-family: theme('fontFamily.mono');
		color: theme('colors.purple.700');
		font-variant-numeric: tabular-nums;
	}

	@media (prefers-reduced-motion: reduce) {
		.soz,
		.faza-bir,
		.raq,
		.tugma {
			transition: none;
		}
	}
</style>
