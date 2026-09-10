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
		korsat = hbmNishon;
		return () => {
			if (sonTween) sonTween.kill();
		};
	});

	function fmt(v: number, n = 2): string {
		const t = v.toFixed(n);
		return t === '-' + (0).toFixed(n) ? (0).toFixed(n) : t;
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

	// o'nlik birliklar: brief'dagi raqamlar shu hisobda (134 MB, 2.1 GB)
	function hajm(b: number): string {
		if (b >= 1e9) {
			const v = b / 1e9;
			return fmt(v, v >= 100 ? 0 : 1) + ' GB';
		}
		if (b >= 1e6) {
			const v = b / 1e6;
			return fmt(v, v >= 100 ? 0 : v >= 10 ? 1 : 2) + ' MB';
		}
		if (b >= 1e3) {
			const v = b / 1e3;
			return fmt(v, v >= 100 ? 0 : v >= 10 ? 1 : 2) + ' KB';
		}
		return guruh(b) + ' bayt';
	}

	// ======================================================================
	// STEND 1 - matritsa yoziladimi yo'qmi
	// ======================================================================
	const N = 8;
	const IDX = [0, 1, 2, 3, 4, 5, 6, 7];

	// Qat'iy yozilgan score matritsasi: sahifa har safar bir xil ochiladi.
	const SKOR: number[][] = [
		[0.9, -0.4, 1.6, 0.2, -1.1, 2.3, 0.5, -0.8],
		[-0.5, 1.2, 0.3, 2.0, 0.7, -1.4, 1.8, 0.1],
		[1.4, 0.6, -0.9, 0.8, 2.5, 0.2, -0.6, 1.1],
		[0.2, -1.3, 0.7, 1.5, -0.2, 0.9, 2.1, 0.4],
		[2.2, 0.5, 1.0, -0.7, 0.3, 1.7, 0.6, -1.0],
		[-0.8, 0.4, 1.9, 0.6, 1.3, -0.5, 0.8, 2.4],
		[0.6, 2.0, -0.3, 1.1, 0.9, 0.4, -1.2, 1.5],
		[1.0, -0.6, 0.5, 2.6, 1.2, 0.1, 0.7, -0.4]
	];

	// V ning bitta ustuni - chiqishni bitta son bilan kuzatish uchun
	const VEK: number[] = [0.5, -1.2, 0.8, 1.6, -0.4, 0.9, -0.7, 1.3];

	const REJIMLAR = [
		{ id: 'standart', label: 'Standart' },
		{ id: 'flash', label: 'FlashAttention' }
	];
	let rejim = 'flash';

	const BLOKLAR = [2, 4, 8];
	let blokIdx = 1; // 4 x 4
	$: b = BLOKLAR[blokIdx];
	$: nb = N / b;
	$: jamiBlok = nb * nb;

	// nechta blok qayta ishlandi. Sahifa ochilganda demo darhol o'qiladigan holatda tursin.
	let qadam = 2;
	$: if (qadam > jamiBlok) qadam = jamiBlok;

	$: faolK = qadam - 1;
	$: faolQb = qadam > 0 ? Math.floor(faolK / nb) : 0;
	$: faolKb = qadam > 0 ? faolK % nb : 0;

	type Qator = { m: number; l: number; o: number };

	function holatHisobla(bb: number, qq: number) {
		const nbb = N / bb;
		const qator: Qator[] = IDX.map(() => ({ m: -Infinity, l: 0, o: 0 }));
		const koef: number[] = IDX.map(() => Number.NaN);
		const eskiM: number[] = IDX.map(() => -Infinity);

		for (let k = 0; k < qq; k++) {
			const qb = Math.floor(k / nbb);
			const kb = k % nbb;
			const r0 = qb * bb;
			const c0 = kb * bb;
			for (let i = r0; i < r0 + bb; i++) {
				const st = qator[i];
				let blokMax = -Infinity;
				for (let j = c0; j < c0 + bb; j++) blokMax = Math.max(blokMax, SKOR[i][j]);
				const mYangi = Math.max(st.m, blokMax);
				const kf = st.m === -Infinity ? 0 : Math.exp(st.m - mYangi);
				let dl = 0;
				let dO = 0;
				for (let j = c0; j < c0 + bb; j++) {
					const p = Math.exp(SKOR[i][j] - mYangi);
					dl += p;
					dO += p * VEK[j];
				}
				eskiM[i] = st.m;
				koef[i] = st.m === -Infinity ? Number.NaN : kf;
				st.l = kf * st.l + dl;
				st.o = kf * st.o + dO;
				st.m = mYangi;
			}
		}
		return { qator, koef, eskiM };
	}

	$: holat = holatHisobla(b, qadam);
	$: tola = holatHisobla(b, jamiBlok);

	// standart attention: butun qator bo'ylab softmax
	const O_STANDART: number[] = IDX.map((i) => {
		const mx = Math.max(...SKOR[i]);
		const e = SKOR[i].map((v) => Math.exp(v - mx));
		const s = e.reduce((a, c) => a + c, 0);
		return e.reduce((a, c, j) => a + c * VEK[j], 0) / s;
	});

	$: O_FLASH = IDX.map((i) => (tola.qator[i].l > 0 ? tola.qator[i].o / tola.qator[i].l : 0));
	$: farq = Math.max(...IDX.map((i) => Math.abs(O_FLASH[i] - O_STANDART[i])));
	$: farqMatn = farq < 1e-12 ? '0' : farq.toExponential(1);

	// hozirgi Q blokdagi qatorlar
	$: qBlokQatorlar = Array.from({ length: b }, (_, t) => faolQb * b + t);

	// katak holati
	function kholat(i: number, j: number, r: string, bb: number, nbb: number, qq: number): string {
		if (r === 'standart') return 'yozildi';
		const k = Math.floor(i / bb) * nbb + Math.floor(j / bb);
		if (k === qq - 1) return 'faol';
		if (k < qq - 1) return 'sondi';
		return 'bosh';
	}

	// ---- HBM yurishi (n = 8192, bitta head, fp16) ----
	const N_KATTA = 8192;
	const MATRITSA_BAYT = N_KATTA * N_KATTA * 2; // 134 217 728 bayt
	const YURISH = 4; // S yoz, S o'qi, P yoz, P o'qi
	$: hbmNishon = rejim === 'standart' ? MATRITSA_BAYT * YURISH : 0;

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
			duration: 0.45,
			ease: 'power2.out',
			onUpdate: () => (korsat = o.v),
			onComplete: () => (korsat = nishon)
		});
	}

	$: qollaSon(hbmNishon);

	// ---- animatsiya ----
	let hujayra: HTMLElement[] = [];

	function chaqnatBlok() {
		if (!mounted || kamHarakat || rejim !== 'flash' || qadam === 0) return;
		const els: HTMLElement[] = [];
		const r0 = faolQb * b;
		const c0 = faolKb * b;
		for (let i = r0; i < r0 + b; i++) {
			for (let j = c0; j < c0 + b; j++) {
				const e = hujayra[i * N + j];
				if (e) els.push(e);
			}
		}
		if (!els.length) return;
		gsap.fromTo(
			els,
			{ opacity: 0.15, scale: 0.75 },
			{
				opacity: 1,
				scale: 1,
				duration: 0.4,
				ease: 'power2.out',
				stagger: 0.015,
				clearProps: 'opacity,transform'
			}
		);
	}

	function toldir() {
		if (!mounted || kamHarakat) return;
		const els = hujayra.filter(Boolean);
		if (!els.length) return;
		gsap.fromTo(els, { opacity: 0.1 }, { opacity: 1, duration: 0.45, ease: 'power2.out', clearProps: 'opacity' });
	}

	let animRejim = rejim;
	function rejimOzgardi(r: string) {
		if (r === animRejim) return;
		animRejim = r;
		if (!mounted) return;
		tick().then(() => (r === 'standart' ? toldir() : chaqnatBlok()));
	}
	$: rejimOzgardi(rejim);

	async function keyingi() {
		if (rejim !== 'flash' || qadam >= jamiBlok) return;
		qadam += 1;
		await tick();
		chaqnatBlok();
	}

	function boshidan() {
		qadam = 0;
		const els = hujayra.filter(Boolean);
		if (els.length) gsap.set(els, { clearProps: 'opacity,transform' });
	}

	async function blokOzgardi() {
		await tick();
		chaqnatBlok();
	}

	const F_M = String.raw`m_{\text{yangi}} = \max\!\left(m_{\text{eski}},\ \max_{j \in \text{blok}} S_{ij}\right)`;
	const F_L = String.raw`\ell_{\text{yangi}} = e^{\,m_{\text{eski}} - m_{\text{yangi}}}\,\ell_{\text{eski}} \;+\; \sum_{j \in \text{blok}} e^{\,S_{ij} - m_{\text{yangi}}}`;
	const F_O = String.raw`O_{\text{yangi}} = e^{\,m_{\text{eski}} - m_{\text{yangi}}}\,O_{\text{eski}} \;+\; \sum_{j \in \text{blok}} e^{\,S_{ij} - m_{\text{yangi}}}\, v_j`;
	const F_OXIR = String.raw`O_i = O / \ell`;

	// ======================================================================
	// STEND 2 - o'sish grafigi
	// ======================================================================
	const UZUNLIKLAR = [512, 1024, 2048, 4096, 8192, 16384, 32768];
	let uzIdx = 4; // 8192
	$: n = UZUNLIKLAR[uzIdx];

	// bitta head, fp16
	function standartBayt(v: number): number {
		return v * v * 2;
	}
	// m va l: har qator uchun ikkita son, fp32
	function flashBayt(v: number): number {
		return 2 * v * 4;
	}

	$: stdB = standartBayt(n);
	$: flB = flashBayt(n);
	$: nisbat = stdB / flB; // = n / 4

	// grafik geometriyasi
	const GW = 760;
	const GH = 250;
	const X0 = 74;
	const X1 = 668;
	const Y0 = 22;
	const Y1 = 186;
	const LOG_MIN = 3; // 1 KB
	const LOG_MAX = 9.6;

	function gx(i: number): number {
		return X0 + (i * (X1 - X0)) / (UZUNLIKLAR.length - 1);
	}
	function gy(bayt: number): number {
		const t = (Math.log10(bayt) - LOG_MIN) / (LOG_MAX - LOG_MIN);
		return Y1 - Math.max(0, Math.min(1, t)) * (Y1 - Y0);
	}
	function chiziq(f: (v: number) => number): string {
		return UZUNLIKLAR.map((v, i) => `${gx(i)},${fmt(gy(f(v)), 1)}`).join(' ');
	}

	$: yolStandart = chiziq(standartBayt);
	$: yolFlash = chiziq(flashBayt);

	const SETKA = [
		{ log: 3, nom: '1 KB' },
		{ log: 6, nom: '1 MB' },
		{ log: 9, nom: '1 GB' }
	];

	function setkaY(l: number): number {
		return Y1 - ((l - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (Y1 - Y0);
	}

	function qisqaN(v: number): string {
		return v >= 1024 ? `${v / 1024}k` : String(v);
	}

	const F_STD = String.raw`\text{standart} \;=\; n^2 \times 2\ \text{bayt}`;
	const F_FL = String.raw`\text{FlashAttention} \;=\; 2n \times 4\ \text{bayt}\quad (m,\ \ell)`;
</script>

<div class="fa-demo">
	<!-- ================================================================ -->
	<!-- STEND 1                                                          -->
	<!-- ================================================================ -->
	<Stend
		title="Matritsa yoziladimi yoki yo'qmi"
		izoh={`Standart rejimda butun n x n matritsa bir yo'la hisoblanadi va HBM ga yoziladi - keyin qaytadan o'qiladi. FlashAttention rejimida "Keyingi blok" ni bosing: har blok SRAM ichida hisoblanadi, m va l yangilanadi, so'ng katak so'nadi, chunki u hech qayerga yozilmaydi. Oxirida ikkala yo'lning chiqishi bir xil - bu approksimatsiya emas.`}
	>
		<svelte:fragment slot="boshqaruv">
			<Swap label="Rejim" bind:value={rejim} options={REJIMLAR} />

			<label class="slayder">
				<span class="slayder-nom">Blok</span>
				<input
					type="range"
					min="0"
					max={BLOKLAR.length - 1}
					step="1"
					bind:value={blokIdx}
					on:input={blokOzgardi}
					aria-label="Blok o'lchami"
				/>
				<span class="slayder-son">{b}&times;{b}</span>
			</label>

			<button
				type="button"
				class="tugma asosiy"
				on:click={keyingi}
				disabled={rejim !== 'flash' || qadam >= jamiBlok}
			>
				Keyingi blok
			</button>
			<button
				type="button"
				class="tugma"
				on:click={boshidan}
				disabled={rejim !== 'flash' || qadam === 0}
			>
				Boshidan
			</button>
		</svelte:fragment>

		<div class="stend1">
			<div class="yuqori">
				<!-- ---------------- matritsa ---------------- -->
				<div class="mat-blok">
					<div class="mat-bosh">
						<span class="mat-nom">S = QK<sup>T</sup> &middot; n = 8</span>
						<span class="mat-yorliq" class:yozildi={rejim === 'standart'}>
							{rejim === 'standart' ? `HBM ga yozildi` : `SRAM ichida - yozilmaydi`}
						</span>
					</div>

					<div class="mat-tana">
						<div class="ust-qator">
							<span class="burchak"></span>
							{#each IDX as j}
								<span
									class="ind"
									class:faol={rejim === 'flash' && qadam > 0 && Math.floor(j / b) === faolKb}
								>
									{j}
								</span>
							{/each}
						</div>

						{#each IDX as i}
							<div class="mat-qator">
								<span
									class="ind chap"
									class:faol={rejim === 'flash' && qadam > 0 && Math.floor(i / b) === faolQb}
								>
									{i}
								</span>
								{#each IDX as j}
									<span
										class="hujayra {kholat(i, j, rejim, b, nb, qadam)}"
										class:chek-o={(j + 1) % b === 0 && j !== N - 1}
										class:chek-p={(i + 1) % b === 0 && i !== N - 1}
										bind:this={hujayra[i * N + j]}
									>
										{fmt(SKOR[i][j], 1)}
									</span>
								{/each}
							</div>
						{/each}

						<div class="ost-yoz">
							<span class="ost-chap">Q qatorlari &darr;</span>
							<span>K ustunlari &rarr;</span>
						</div>
					</div>

					<div class="afsona">
						{#if rejim === 'standart'}
							<span class="af"><i class="q yozildi"></i> hisoblandi va HBM ga yozildi</span>
						{:else}
							<span class="af"><i class="q faol"></i> hozir SRAM ichida</span>
							<span class="af"><i class="q sondi"></i> so'ndi - saqlanmadi</span>
							<span class="af"><i class="q bosh"></i> hali navbat kelmadi</span>
						{/if}
					</div>
				</div>

				<!-- ---------------- yon panel ---------------- -->
				<div class="panel">
					<div class="ier">
						<div class="qutik hbm">
							<span class="q-nom">HBM</span>
							<span class="q-son">40&ndash;80 GB</span>
							<span class="q-tez">~1.5&ndash;2.0 TB/s</span>
						</div>

						<svg class="oq" class:kop={rejim === 'standart'} viewBox="0 0 96 44" aria-hidden="true">
							<line class="oq-chiziq" x1="10" y1="22" x2="86" y2="22" />
							<polygon class="oq-uch" points="94,22 82,15 82,29" />
							<polygon class="oq-uch" points="2,22 14,15 14,29" />
						</svg>

						<div class="qutik sram" class:faol={rejim === 'flash'}>
							<span class="q-nom">SRAM</span>
							<span class="q-son">~20 MB</span>
							<span class="q-tez">~19 TB/s</span>
						</div>
					</div>

					<div class="hisob" class:kop={rejim === 'standart'}>
						<span class="hisob-nom">
							n &times; n matritsalar uchun HBM yurishi
							<span class="hisob-shart">n = 8192, bitta head, fp16</span>
						</span>
						<span class="hisob-son">{hajm(korsat)}</span>
						<span class="hisob-tag">
							{#if rejim === 'standart'}
								S yoz &rarr; S o'qi &rarr; P yoz &rarr; P o'qi = 4 &times; {hajm(MATRITSA_BAYT)}
							{:else}
								n &times; n matritsa HBM ga umuman chiqmaydi
							{/if}
						</span>
					</div>

					<ul class="yurish">
						{#if rejim === 'standart'}
							<li><span class="mrk qizil"></span> S = QK<sup>T</sup> ni HBM ga yoz</li>
							<li><span class="mrk qizil"></span> S ni HBM dan qayta o'qi, softmax ol</li>
							<li><span class="mrk qizil"></span> P ni HBM ga yoz</li>
							<li><span class="mrk qizil"></span> P ni qayta o'qi, PV ni hisobla</li>
						{:else}
							<li><span class="mrk"></span> Q, K, V bloklarini SRAM ga ko'chir</li>
							<li><span class="mrk"></span> blok ichidagi S ni SRAM da hisobla</li>
							<li><span class="mrk"></span> m, l va qisman O ni yangila</li>
							<li><span class="mrk"></span> blokni tashla &mdash; hech narsa yozilmaydi</li>
						{/if}
					</ul>

					<div class="progress">
						<span class="pr-nom">Blok</span>
						<span class="pr-son">
							{rejim === 'flash' ? `${qadam} / ${jamiBlok}` : `1 / 1`}
						</span>
						<div class="pr-chiziq">
							<div
								class="pr-ich"
								class:tola={rejim === 'standart'}
								style="width:{rejim === 'standart' ? 100 : (qadam / jamiBlok) * 100}%"
							></div>
						</div>
					</div>
				</div>
			</div>

			<!-- ---------------- online softmax holati ---------------- -->
			<div class="online" class:sonuq={rejim === 'standart'}>
				<div class="on-bosh">
					<span class="on-nom">
						{#if rejim === 'flash'}
							Online softmax &middot; Q blok {faolQb} &times; KV blok {faolKb}
						{:else}
							Online softmax ishlatilmaydi
						{/if}
					</span>
					<span class="on-yon">
						{#if rejim === 'flash'}
							qator {qBlokQatorlar[0]}&ndash;{qBlokQatorlar[qBlokQatorlar.length - 1]}
							&middot; ustun {faolKb * b}&ndash;{faolKb * b + b - 1}
						{:else}
							butun qator bir yo'la ko'riladi, chunki u allaqachon xotirada
						{/if}
					</span>
				</div>

				{#if rejim === 'flash'}
					<div class="formulalar">
						<div class="f"><Katex math={F_M} /></div>
						<div class="f"><Katex math={F_L} /></div>
						<div class="f"><Katex math={F_O} /></div>
						<div class="f oxir">
							hamma blok tugagach: <Katex math={F_OXIR} />
						</div>
					</div>

					<div class="jadval">
						<div class="j-bosh">
							<span>qator</span>
							<span>m eski</span>
							<span>m yangi</span>
							<span>koef = e^(m eski &minus; m yangi)</span>
							<span>l</span>
							<span>O (qisman)</span>
						</div>
						{#each qBlokQatorlar as i}
							<div class="j-qator" class:bosh={qadam === 0}>
								<span class="j-i">{i}</span>
								<span class="j-s">
									{#if holat.eskiM[i] === -Infinity}
										<span class="yoq">&minus;&infin;</span>
									{:else}
										{fmt(holat.eskiM[i], 2)}
									{/if}
								</span>
								<span class="j-s">
									{#if holat.qator[i].m === -Infinity}
										<span class="yoq">&minus;&infin;</span>
									{:else}
										{fmt(holat.qator[i].m, 2)}
									{/if}
								</span>
								<span class="j-s koef">
									{#if Number.isNaN(holat.koef[i])}
										<span class="yoq">birinchi blok</span>
									{:else}
										{fmt(holat.koef[i], 3)}
									{/if}
								</span>
								<span class="j-s">{fmt(holat.qator[i].l, 3)}</span>
								<span class="j-s oq-son">{fmt(holat.qator[i].o, 3)}</span>
							</div>
						{/each}
					</div>

					<p class="on-izoh">
						Koeffitsiyent 1 dan kichik chiqqan qatorda maksimum shu blokda o'sgan &mdash; oldingi
						qisman yig'indi va qisman chiqish o'sha koeffitsiyentga qayta masshtablanadi. Butun
						qatorni ko'rish shart emas.
						{#if b === N}
							<strong>Blok o'lchami butun matritsaga teng:</strong> bunda tiling yo'q, chunki blok SRAM
							ga sig'ishi kerak edi.
						{/if}
					</p>
				{:else}
					<p class="on-izoh">
						Standart yo'lda softmax butun qatorni bir vaqtda ko'radi. Buning uchun qator xotirada
						turishi kerak, xotira esa HBM. Slayderni FlashAttention ga o'tkazing.
					</p>
				{/if}
			</div>

			<!-- ---------------- chiqish solishtiruvi ---------------- -->
			<div class="chiqish">
				<div class="ch-qator">
					<span class="ch-nom eski">standart O</span>
					{#each O_STANDART as v}
						<span class="ch-son">{fmt(v, 4)}</span>
					{/each}
				</div>
				<div class="ch-qator">
					<span class="ch-nom yangi">FlashAttention O</span>
					{#each O_FLASH as v}
						<span class="ch-son">{fmt(v, 4)}</span>
					{/each}
				</div>
				<div class="ch-farq">
					<span class="ch-farq-nom">chiqish farqi</span>
					<span class="ch-farq-son">max |O<sub>std</sub> &minus; O<sub>flash</sub>| = {farqMatn}</span>
					<span class="ch-farq-tag">bir xil natija, boshqa yo'l bilan olingan</span>
				</div>
			</div>
		</div>
	</Stend>

	<!-- ================================================================ -->
	<!-- STEND 2                                                          -->
	<!-- ================================================================ -->
	<Stend
		title="Xotira ketma-ketlik uzunligiga qanday bog'liq"
		izoh={`Standart attention n x n matritsani saqlaydi, shuning uchun xotira kvadratik o'sadi; FlashAttention har qator uchun atigi ikkita son (m va l) saqlaydi, shuning uchun chiziqli. Grafik o'qi logarifmik - aks holda binafsha chiziq umuman ko'rinmas edi. Bu raqamlar BITTA head uchun: haqiqiy sarf head soniga va batch hajmiga ko'paytiriladi.`}
	>
		<svelte:fragment slot="boshqaruv">
			<label class="slayder">
				<span class="slayder-nom">Ketma-ketlik n</span>
				<input
					type="range"
					min="0"
					max={UZUNLIKLAR.length - 1}
					step="1"
					bind:value={uzIdx}
					aria-label="Ketma-ketlik uzunligi"
				/>
				<span class="slayder-son">{guruh(n)}</span>
			</label>
		</svelte:fragment>

		<div class="stend2">
			<div class="formula-blok">
				<div class="f2"><Katex math={F_STD} /></div>
				<div class="f2"><Katex math={F_FL} /></div>
				<div class="son-formula">
					{guruh(n)} &times; {guruh(n)} &times; 2 = {guruh(stdB)} bayt
					<span class="ayirgich">&middot;</span>
					2 &times; {guruh(n)} &times; 4 = {guruh(flB)} bayt
				</div>
			</div>

			<svg class="grafik" viewBox="0 0 {GW} {GH}" role="img" aria-label="Xotira o'sishi grafigi">
				<!-- setka -->
				{#each SETKA as g}
					<line
						class="setka"
						x1={X0}
						y1={setkaY(g.log)}
						x2={X1}
						y2={setkaY(g.log)}
					/>
					<text class="setka-yoz" x={X0 - 10} y={setkaY(g.log) + 4} text-anchor="end">{g.nom}</text>
				{/each}

				<!-- tanlangan n -->
				<line class="nishon" x1={gx(uzIdx)} y1={Y0 - 6} x2={gx(uzIdx)} y2={Y1} />

				<!-- egri chiziqlar -->
				<polyline class="yol std" points={yolStandart} />
				<polyline class="yol fl" points={yolFlash} />

				<!-- nuqtalar -->
				{#each UZUNLIKLAR as v, i}
					<circle class="nuqta std" cx={gx(i)} cy={gy(standartBayt(v))} r={i === uzIdx ? 5 : 2.5} />
					<circle class="nuqta fl" cx={gx(i)} cy={gy(flashBayt(v))} r={i === uzIdx ? 5 : 2.5} />
				{/each}

				<!-- x o'qi -->
				<line class="oq-chiz" x1={X0} y1={Y1} x2={X1} y2={Y1} />
				{#each UZUNLIKLAR as v, i}
					<text class="x-yoz" class:faol={i === uzIdx} x={gx(i)} y={Y1 + 18} text-anchor="middle">
						{qisqaN(v)}
					</text>
				{/each}
				<text class="oq-nom" x={X1} y={Y1 + 38} text-anchor="end">ketma-ketlik uzunligi n</text>

				<!-- seriya yozuvlari -->
				<text class="seriya std" x={gx(UZUNLIKLAR.length - 1) + 10} y={gy(standartBayt(32768)) + 4}>
					standart
				</text>
				<text class="seriya fl" x={gx(UZUNLIKLAR.length - 1) + 10} y={gy(flashBayt(32768)) + 4}>
					Flash
				</text>
			</svg>

			<div class="raqamlar">
				<div class="raqam eski-raqam">
					<span class="raqam-nom">standart attention &middot; n = {guruh(n)}</span>
					<span class="raqam-son">{hajm(stdB)}</span>
					<span class="raqam-tag">n<sup>2</sup> bo'yicha o'sadi</span>
				</div>
				<div class="raqam yangi-raqam">
					<span class="raqam-nom">FlashAttention &middot; n = {guruh(n)}</span>
					<span class="raqam-son">{hajm(flB)}</span>
					<span class="raqam-tag">n bo'yicha o'sadi</span>
				</div>
				<div class="raqam nisbat-raqam">
					<span class="raqam-nom">farq</span>
					<span class="raqam-son">{guruh(nisbat)}&times;</span>
					<span class="raqam-tag">kam qo'shimcha xotira</span>
				</div>
			</div>

			<p class="ost-izoh">
				Chap ustundagi raqam bitta head uchun. Amaldagi modelda uni head soniga va batch hajmiga
				ko'paytiring: 32 head va 8 ta parallel so'rov bo'lsa, ko'paytuvchi 256 ga chiqadi. O'ng
				ustundagi raqam esa o'sha ko'paytmadan keyin ham deyarli sezilmaydi.
			</p>
		</div>
	</Stend>
</div>

<style lang="scss">
	.fa-demo {
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
		min-width: 3.4em;
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
		gap: 1.1rem;
		min-width: 720px;
	}

	.yuqori {
		display: grid;
		grid-template-columns: auto minmax(300px, 1fr);
		gap: 1.1rem;
		align-items: start;
	}

	/* ---- matritsa ---- */
	.mat-blok {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.mat-bosh {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.8rem;
	}

	.mat-nom {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.84rem;
		font-weight: 500;
		color: theme('colors.gray.700');
	}

	.mat-yorliq {
		font-family: theme('fontFamily.mono');
		font-size: 0.66rem;
		padding: 0.16rem 0.42rem;
		border-radius: 3px;
		white-space: nowrap;
		background: theme('colors.purple.100');
		color: theme('colors.purple.700');
		transition: background 0.25s ease, color 0.25s ease;
	}

	.mat-yorliq.yozildi {
		background: theme('colors.red.100');
		color: theme('colors.red.600');
		font-weight: 600;
	}

	.mat-tana {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.ust-qator,
	.mat-qator {
		display: grid;
		grid-template-columns: 18px repeat(8, 36px);
		gap: 3px;
	}

	.ind {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 14px;
		font-family: theme('fontFamily.mono');
		font-size: 0.6rem;
		color: theme('colors.gray.300');
		font-variant-numeric: tabular-nums;
		transition: color 0.25s ease;
	}

	.ind.chap {
		height: auto;
	}

	.ind.faol {
		color: theme('colors.purple.600');
		font-weight: 700;
	}

	.burchak {
		display: block;
	}

	.hujayra {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 26px;
		border-radius: 3px;
		font-family: theme('fontFamily.mono');
		font-size: 0.62rem;
		font-variant-numeric: tabular-nums;
		border: 1px solid transparent;
		transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
	}

	.hujayra.bosh {
		background: white;
		border-color: theme('colors.gray.200');
		border-style: dashed;
		color: transparent;
	}

	.hujayra.faol {
		background: theme('colors.purple.600');
		border-color: theme('colors.purple.600');
		color: white;
		font-weight: 600;
	}

	.hujayra.sondi {
		background: theme('colors.gray.50');
		border-color: theme('colors.gray.100');
		color: theme('colors.gray.300');
	}

	.hujayra.yozildi {
		background: theme('colors.gray.100');
		border-color: theme('colors.gray.200');
		color: theme('colors.gray.700');
	}

	.hujayra.chek-o {
		margin-right: 2px;
	}

	.hujayra.chek-p {
		margin-bottom: 2px;
	}

	.ost-yoz {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.2rem;
		padding-left: 21px;
		font-family: theme('fontFamily.mono');
		font-size: 0.62rem;
		color: theme('colors.gray.300');
	}

	.ost-chap {
		color: theme('colors.gray.300');
	}

	.afsona {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem 0.8rem;
		padding-left: 21px;
		font-size: 0.68rem;
		color: theme('colors.gray.400');
	}

	.af {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		white-space: nowrap;
	}

	.q {
		display: inline-block;
		width: 9px;
		height: 9px;
		border-radius: 2px;
		border: 1px solid transparent;
		flex: none;
	}

	.q.faol {
		background: theme('colors.purple.600');
	}

	.q.sondi {
		background: theme('colors.gray.50');
		border-color: theme('colors.gray.200');
	}

	.q.bosh {
		background: white;
		border-color: theme('colors.gray.300');
		border-style: dashed;
	}

	.q.yozildi {
		background: theme('colors.gray.100');
		border-color: theme('colors.gray.300');
	}

	/* ---- panel ---- */
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
	}

	.ier {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 0.4rem;
	}

	.qutik {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.5rem 0.6rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		background: theme('colors.gray.50');
		min-width: 0;
		transition: border-color 0.3s ease, background 0.3s ease;
	}

	.qutik.sram.faol {
		border-color: theme('colors.purple.300');
		background: theme('colors.purple.50');
	}

	.q-nom {
		font-family: theme('fontFamily.mono');
		font-size: 0.76rem;
		font-weight: 600;
		color: theme('colors.gray.700');
	}

	.qutik.sram.faol .q-nom {
		color: theme('colors.purple.700');
	}

	.q-son,
	.q-tez {
		font-family: theme('fontFamily.mono');
		font-size: 0.64rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.oq {
		width: 62px;
		height: 30px;
		flex: none;
	}

	.oq-chiziq {
		stroke: theme('colors.purple.400');
		stroke-width: 2;
		transition: stroke-width 0.3s ease, stroke 0.3s ease;
	}

	.oq-uch {
		fill: theme('colors.purple.400');
		transition: fill 0.3s ease;
	}

	.oq.kop .oq-chiziq {
		stroke: theme('colors.red.400');
		stroke-width: 9;
	}

	.oq.kop .oq-uch {
		fill: theme('colors.red.400');
	}

	.hisob {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.65rem 0.8rem;
		border: 1px solid theme('colors.purple.200');
		background: theme('colors.purple.50');
		border-radius: 6px;
		transition: border-color 0.3s ease, background 0.3s ease;
	}

	.hisob.kop {
		border-color: theme('colors.red.200');
		background: theme('colors.red.50');
	}

	.hisob-nom {
		font-size: 0.7rem;
		color: theme('colors.gray.500');
		line-height: 1.4;
	}

	.hisob-shart {
		display: block;
		font-family: theme('fontFamily.mono');
		font-size: 0.62rem;
		color: theme('colors.gray.400');
	}

	.hisob-son {
		font-family: theme('fontFamily.mono');
		font-size: 1.9rem;
		line-height: 1.15;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: theme('colors.purple.700');
		transition: color 0.3s ease;
	}

	.hisob.kop .hisob-son {
		color: theme('colors.red.600');
	}

	.hisob-tag {
		font-family: theme('fontFamily.mono');
		font-size: 0.62rem;
		color: theme('colors.gray.400');
		line-height: 1.4;
	}

	.yurish {
		display: flex;
		flex-direction: column;
		gap: 0.22rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.yurish li {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		font-size: 0.72rem;
		line-height: 1.45;
		color: theme('colors.gray.500');
	}

	.mrk {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: theme('colors.purple.400');
		flex: none;
	}

	.mrk.qizil {
		background: theme('colors.red.400');
	}

	.progress {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.pr-nom {
		font-size: 0.7rem;
		color: theme('colors.gray.400');
	}

	.pr-son {
		font-family: theme('fontFamily.mono');
		font-size: 0.74rem;
		color: theme('colors.gray.700');
		font-variant-numeric: tabular-nums;
		min-width: 3.6em;
	}

	.pr-chiziq {
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: theme('colors.gray.100');
		overflow: hidden;
	}

	.pr-ich {
		height: 100%;
		background: theme('colors.purple.500');
		transition: width 0.3s ease, background 0.3s ease;
	}

	.pr-ich.tola {
		background: theme('colors.gray.400');
	}

	/* ---- online softmax ---- */
	.online {
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		padding: 0.7rem 0.85rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		transition: opacity 0.3s ease;
	}

	.online.sonuq {
		background: theme('colors.gray.50');
	}

	.on-bosh {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.on-nom {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.82rem;
		font-weight: 500;
		color: theme('colors.gray.700');
	}

	.on-yon {
		font-family: theme('fontFamily.mono');
		font-size: 0.68rem;
		color: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
	}

	.formulalar {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.5rem 0.65rem;
		background: theme('colors.gray.50');
		border-radius: 5px;
		overflow-x: auto;
	}

	.f {
		color: theme('colors.gray.800');
		white-space: nowrap;
	}

	.f :global(.katex) {
		font-size: 0.84rem;
	}

	.f.oxir {
		margin-top: 0.15rem;
		padding-top: 0.3rem;
		border-top: 1px dashed theme('colors.gray.200');
		font-size: 0.7rem;
		color: theme('colors.gray.500');
	}

	.jadval {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.j-bosh,
	.j-qator {
		display: grid;
		grid-template-columns: 46px 1fr 1fr 1.5fr 1fr 1fr;
		gap: 4px;
		align-items: center;
	}

	.j-bosh {
		padding-bottom: 0.25rem;
		border-bottom: 1px solid theme('colors.gray.200');
	}

	.j-bosh span {
		font-size: 0.64rem;
		color: theme('colors.gray.400');
		text-align: right;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.j-bosh span:first-child {
		text-align: left;
	}

	.j-qator {
		padding: 0.16rem 0;
		border-bottom: 1px solid theme('colors.gray.100');
	}

	.j-i {
		font-family: theme('fontFamily.mono');
		font-size: 0.7rem;
		color: theme('colors.purple.700');
		font-variant-numeric: tabular-nums;
	}

	.j-s {
		font-family: theme('fontFamily.mono');
		font-size: 0.72rem;
		color: theme('colors.gray.800');
		font-variant-numeric: tabular-nums;
		text-align: right;
		white-space: nowrap;
	}

	.j-s.koef {
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.j-s.oq-son {
		color: theme('colors.gray.600');
	}

	.yoq {
		color: theme('colors.gray.300');
		font-weight: 400;
		font-size: 0.66rem;
	}

	.on-izoh {
		margin: 0;
		font-size: 0.74rem;
		line-height: 1.6;
		color: theme('colors.gray.500');
	}

	.on-izoh strong {
		color: theme('colors.gray.700');
	}

	/* ---- chiqish ---- */
	.chiqish {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 0.65rem 0.8rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
	}

	.ch-qator {
		display: grid;
		grid-template-columns: 130px repeat(8, 1fr);
		gap: 4px;
		align-items: center;
	}

	.ch-nom {
		font-size: 0.7rem;
		white-space: nowrap;
	}

	.ch-nom.eski {
		color: theme('colors.gray.400');
	}

	.ch-nom.yangi {
		color: theme('colors.purple.700');
		font-weight: 600;
	}

	.ch-son {
		font-family: theme('fontFamily.mono');
		font-size: 0.66rem;
		color: theme('colors.gray.700');
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.ch-farq {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		flex-wrap: wrap;
		margin-top: 0.4rem;
		padding-top: 0.45rem;
		border-top: 1px dashed theme('colors.gray.200');
	}

	.ch-farq-nom {
		font-size: 0.72rem;
		color: theme('colors.gray.400');
	}

	.ch-farq-son {
		font-family: theme('fontFamily.mono');
		font-size: 0.86rem;
		font-weight: 700;
		color: theme('colors.purple.700');
		font-variant-numeric: tabular-nums;
	}

	.ch-farq-tag {
		font-size: 0.7rem;
		color: theme('colors.gray.400');
	}

	/* ================= STEND 2 ================= */
	.stend2 {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 720px;
	}

	.formula-blok {
		padding: 0.7rem 0.9rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		background: theme('colors.gray.50');
		overflow-x: auto;
	}

	.f2 {
		color: theme('colors.gray.800');
		white-space: nowrap;
	}

	.f2 :global(.katex) {
		font-size: 0.9rem;
	}

	.son-formula {
		margin-top: 0.5rem;
		padding-top: 0.45rem;
		border-top: 1px dashed theme('colors.gray.200');
		font-family: theme('fontFamily.mono');
		font-size: 0.78rem;
		color: theme('colors.purple.700');
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.ayirgich {
		color: theme('colors.gray.300');
		padding: 0 0.35rem;
	}

	.grafik {
		width: 100%;
		height: auto;
		display: block;
	}

	.setka {
		stroke: theme('colors.gray.100');
		stroke-width: 1;
	}

	.setka-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 10px;
		fill: theme('colors.gray.400');
	}

	.nishon {
		stroke: theme('colors.gray.300');
		stroke-width: 1;
		stroke-dasharray: 3 3;
		transition: x1 0.3s ease, x2 0.3s ease;
	}

	.yol {
		fill: none;
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}

	.yol.std {
		stroke: theme('colors.gray.400');
	}

	.yol.fl {
		stroke: theme('colors.purple.600');
	}

	.nuqta.std {
		fill: theme('colors.gray.400');
	}

	.nuqta.fl {
		fill: theme('colors.purple.600');
	}

	.oq-chiz {
		stroke: theme('colors.gray.200');
		stroke-width: 1;
	}

	.x-yoz {
		font-family: theme('fontFamily.mono');
		font-size: 10px;
		fill: theme('colors.gray.400');
		font-variant-numeric: tabular-nums;
	}

	.x-yoz.faol {
		fill: theme('colors.purple.700');
		font-weight: 700;
	}

	.oq-nom {
		font-family: theme('fontFamily.mono');
		font-size: 10px;
		fill: theme('colors.gray.300');
	}

	.seriya {
		font-family: theme('fontFamily.mono');
		font-size: 11px;
	}

	.seriya.std {
		fill: theme('colors.gray.500');
	}

	.seriya.fl {
		fill: theme('colors.purple.700');
		font-weight: 600;
	}

	.raqamlar {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.7rem;
	}

	.raqam {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.65rem 0.8rem;
		border: 1px solid theme('colors.gray.200');
		border-radius: 6px;
		min-width: 0;
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
		font-size: 1.6rem;
		line-height: 1.15;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: theme('colors.gray.800');
		white-space: nowrap;
	}

	.raqam-tag {
		font-family: theme('fontFamily.mono');
		font-size: 0.64rem;
		color: theme('colors.gray.400');
	}

	.eski-raqam .raqam-son {
		color: theme('colors.gray.500');
	}

	.yangi-raqam {
		border-color: theme('colors.purple.200');
		background: theme('colors.purple.50');
	}

	.yangi-raqam .raqam-son {
		color: theme('colors.purple.700');
	}

	.nisbat-raqam .raqam-son {
		color: theme('colors.gray.800');
	}

	.ost-izoh {
		margin: 0;
		font-size: 0.74rem;
		line-height: 1.6;
		color: theme('colors.gray.500');
	}

	@media (prefers-reduced-motion: reduce) {
		.tugma,
		.hujayra,
		.ind,
		.mat-yorliq,
		.qutik,
		.hisob,
		.hisob-son,
		.pr-ich,
		.oq-chiziq,
		.oq-uch,
		.nishon,
		.online {
			transition: none;
		}
	}
</style>
