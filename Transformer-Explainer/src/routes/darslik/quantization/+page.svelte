<script lang="ts">
	import { base } from '$app/paths';
	import Lab from '~/components/darslik/Lab.svelte';
	import Katex from '~/utils/Katex.svelte';
	import QuantizationDemo from '~/components/darslik/demos/QuantizationDemo.svelte';

	const Q_F = String.raw`w_q = \mathrm{round}\!\left(\frac{w}{s}\right), \qquad s = \frac{\max - \min}{2^{b} - 1}`;
</script>

<svelte:head>
	<title>3.7 Quantization — Darslik | Transformer Explainer</title>
	<meta
		name="description"
		content="Vaznlarni 16 bitdan 4 bitga tushirish: outlier muammosi, GPTQ, AWQ, NF4 va FP8 - nimani yutamiz, nimani yo'qotamiz."
	/>
</svelte:head>

<Lab slug="quantization">
	<svelte:fragment slot="muammo">
		<p>
			70 milliard parametrli model fp16 formatida <strong>140 GB</strong> joy oladi. Bugungi
			eng katta bitta GPU esa 80 GB. Ya'ni model umuman sig'maydi — bir nechta GPU, ular
			orasidagi almashinuv, murakkabroq kod va bir necha barobar qimmatroq server kerak
			bo'ladi.
		</p>
		<p>
			Ikkinchi tomoni birinchisidan ham qiziqroq. Bu qismning boshida ko'rgan edik: decode
			fazasi memory-bound. Har bir token uchun modelning barcha vaznlari xotiradan o'qib
			chiqiladi. Agar vazn ikki barobar kichik bo'lsa, o'qish ham ikki barobar tez — demak
			generatsiya tezligi ham deyarli shuncha oshadi. Quantization faqat "sig'dirish" usuli
			emas, u to'g'ridan-to'g'ri tezlik usuli.
		</p>
		<p>
			Savol esa bitta: vaznlarni qanchalik qo'pollashtirish mumkin, modelning javobi
			buzilmasdan?
		</p>
	</svelte:fragment>

	<svelte:fragment slot="demo">
		<QuantizationDemo />
	</svelte:fragment>

	<svelte:fragment slot="ozgarish">
		<p>
			Asosiy g'oya sodda. Vazn taqsimoti nolga yaqin jamlangan va chegaralangan — uni to'liq
			fp16 aniqlik bilan saqlash isrof. Eng kichik va eng katta qiymat orasidagi oraliqni
			<code>2^b</code> ta pog'onaga bo'lib, har bir vaznni eng yaqin pog'onaga yaxlitlash
			mumkin:
		</p>
		<p><Katex math={Q_F} displayMode /></p>
		<p>
			Yaxlitlash xatosi paydo bo'ladi, va bu xato bitlar kamayganda tez o'sadi. Demoda bit
			slayderini surib buni ko'rish mumkin: 8 bitda pog'onalar shunchalik zichki, nuqtalar
			deyarli joyidan qimirlamaydi; 3 bitda esa ular bir-biriga yopishib qoladi.
		</p>

		<h3>Outlier — bitta son yuzta sonni buzadi</h3>
		<p>
			Formulaga yana bir qarang: masshtab <code>s</code> eng katta va eng kichik qiymat
			orqali aniqlanadi. Demak agar taqsimotda bitta juda katta qiymat bo'lsa, u butun
			oraliqni cho'zib yuboradi, pog'onalar bir-biridan uzoqlashadi, va qolgan barcha
			"normal" vaznlar ikki-uch pog'onaga siqilib, orasidagi farqni yo'qotadi. Demoda
			"outlier" tugmasini bosganingizda o'rtacha xato aynan shu sababdan sakraydi.
		</p>
		<p>
			Bu nazariy tashvish emas. LLM.int8() maqolasi shuni ko'rsatdi: taxminan
			<strong>6.7 milliard</strong> parametrdan boshlab modellarda <code>emergent outlier
			features</code> paydo bo'ladi — ba'zi o'lchamlar muntazam ravishda juda katta
			faollashuv qiymatlariga ega bo'ladi. Sodda INT8 quantization aynan shu chegaradan
			boshlab modelni buzadi, undan kichik modellarda esa muammosiz ishlaydi. Aynan shuning
			uchun kichik tajribalar bu muammoni ko'rsatmaydi.
		</p>
		<p>
			Ikki yechim yo'nalishi bor. Birinchisi — aralash aniqlik: outlier bo'lgan o'lchamlar
			(o'lchamlarning taxminan 0.1% i) fp16 da qoldiriladi, qolgani INT8 da hisoblanadi.
			Ikkinchisi — <code>guruhlarga bo'lish</code>: butun matritsaga bitta masshtab o'rniga
			har 64 yoki 128 ta vazn uchun alohida masshtab. Shunda outlier ta'siri o'z guruhi
			bilan cheklanadi. Demoda uchinchi tugma aynan buni ko'rsatadi — xato qaytadan tushadi.
		</p>

		<h3>Asosiy usullar</h3>
		<table>
			<thead>
				<tr>
					<th>Usul</th>
					<th>Yil</th>
					<th>Asosiy g'oya</th>
					<th>Tipik bit</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>LLM.int8()</th>
					<td>2022</td>
					<td>outlier o'lchamlarni fp16 da qoldirish, qolganini INT8 da</td>
					<td>8</td>
				</tr>
				<tr>
					<th>GPTQ</th>
					<td>2022</td>
					<td>
						qavat-baqavat yaxlitlash; har vaznni yaxlitlaganda qolganlarini ikkinchi tartibli
						ma'lumot (Hessian) yordamida tuzatib borish
					</td>
					<td>3 - 4</td>
				</tr>
				<tr>
					<th>AWQ</th>
					<td>2023</td>
					<td>
						muhim kanallarni faollashuv kattaligi bo'yicha topib, ularni kvantlashdan oldin
						masshtablash - aralash aniqliksiz
					</td>
					<td>4</td>
				</tr>
				<tr>
					<th>NF4</th>
					<td>2023</td>
					<td>pog'onalar teng oraliqda emas, normal taqsimotga moslangan</td>
					<td>4</td>
				</tr>
				<tr>
					<th>FP8</th>
					<td>2022 -</td>
					<td>apparatda qo'llab-quvvatlanadi (H100); dinamik diapazoni keng, outlier'ga chidamli</td>
					<td>8</td>
				</tr>
			</tbody>
		</table>

		<p>
			GPTQ 175 milliard parametrli modelni taxminan to'rt GPU-soatda kvantlaydi va buning
			uchun modelni qayta o'qitish shart emas — bu <code>post-training</code> usul.
			AWQ ning kuzatuvi esa nozikroq: vaznlarning atigi 1% i sifat uchun hal qiluvchi, lekin
			qaysilari muhimligini vaznning <em>o'zi</em> emas, <em>faollashuv</em> kattaligi
			ko'rsatadi. Muhim kanallarni alohida formatda saqlash o'rniga ularni oldindan
			masshtablash yetarli — natijada butun matritsa bir xil formatda qoladi, bu esa apparat
			uchun ancha qulay va tezroq.
		</p>
		<p>
			NF4 esa QLoRA bilan birga keldi: 4 bitli NormalFloat, ustiga masshtab
			koeffitsiyentlarining o'zini ham kvantlash (<code>double quantization</code>) va paged
			optimizers. Shu uchlik 65B modelni bitta 48 GB GPU da fine-tune qilish imkonini berdi.
		</p>

		<h3>Nimani kvantlaymiz</h3>
		<p>
			Bu yerda ikkita alohida tanlov bor va ular ko'pincha aralashtiriladi.
			<strong>Weight-only</strong>: vaznlar 4 bitda saqlanadi, hisoblashdan oldin fp16 ga
			ochiladi. Xotira va o'qish tejaladi, hisob aniqligi saqlanadi. Decode memory-bound
			bo'lgani uchun ko'p hollarda aynan shu yetarli.
			<strong>Weight + activation</strong>: faollashuvlar ham kvantlanadi. Bu qiyinroq —
			outlier aynan faollashuvlarda — va u ko'proq katta batch bilan ishlaydigan,
			compute-bound holatlarda foyda beradi.
		</p>
		<p>
			Uchinchi, mustaqil o'q — <strong>KV cache quantization</strong>. Bu yerda vaznlar emas,
			3.1-modulda ko'rgan cache INT8 yoki FP8 da saqlanadi. Uzun kontekstda cache vaznlardan
			ham katta bo'lib ketishi mumkin, shuning uchun u yerda bu usul vazn quantization'dan
			ko'proq foyda beradi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="amalda">
		<p>
			Amalda uchta yo'l keng tarqalgan: <code>bitsandbytes</code> (eng sodda, kod ichida
			bitta bayroq), GPTQ va AWQ paketlari (oldindan kvantlangan model, tezroq inference), va
			<code>GGUF</code> formati — llama.cpp uchun, modelni noutbukda yoki hatto telefonda
			ishlatish uchun.
		</p>
		<p>
			Amaliy qoida sodda: <strong>4 bit odatda sezilarli sifat yo'qotmaydi</strong>, 3 bitda
			pasayish seziladi, 2 bitda esa deyarli har doim buziladi. Shuning uchun 4 bit amaliy
			chegara bo'lib qoldi. Va yana bir raqam: 7B model fp16 da ~14 GB, 4 bitda ~3.5 GB;
			70B model 140 GB dan ~35 GB ga tushadi — ya'ni bitta H100 ga sig'adigan bo'ladi.
			Bu bitta usul katta modelni kim ishlata olishini o'zgartirdi.
		</p>

		<h3>03-qism yakuni</h3>
		<p>
			Bu qismda ko'rilgan yettita usul turlicha ko'rinadi, lekin ular bitta narsani qildi:
			bir xil javobni arzonroq oldi. <a href="{base}/darslik/kv-cache">KV cache</a> ortiqcha
			hisobni tashladi, <a href="{base}/darslik/gqa">GQA</a> va
			<a href="{base}/darslik/mla">MLA</a> cache'ni kichraytirdi,
			<a href="{base}/darslik/flash-attention">FlashAttention</a> xotira yurishini kamaytirdi,
			<a href="{base}/darslik/paged-attention">PagedAttention</a> xotirani isrofsiz
			joylashtirdi, <a href="{base}/darslik/speculative">speculative decoding</a> qadamlar
			sonini kamaytirdi, quantization esa har bir baytni kichraytirdi.
		</p>
		<p>
			Diqqatga sazovor tomoni shundaki, ularning deyarli hech biri modelning javobini
			o'zgartirmaydi. FlashAttention va speculative decoding uchun bu matematik jihatdan
			kafolatlangan, PagedAttention uchun ham — u umuman modelga tegmaydi. Ya'ni bu yettita
			usul sifatdan chegirma so'ramaydi.
		</p>
		<p>
			04-qismda savol teskarisiga aylanadi. Model qanday qilib arzonroq emas, qanday qilib
			<em>yaxshiroq</em> bo'ladi — va bu yerda birinchi marta haqiqiy almashuvlar boshlanadi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="manba">
		<p>
			Tim Dettmers va b. <em
				>LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale.</em
			> NeurIPS 2022.
			<a href="https://arxiv.org/abs/2208.07339" target="_blank" rel="noreferrer"
				>arXiv:2208.07339</a
			>
		</p>
		<p>
			Elias Frantar va b. <em
				>GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers.</em
			> ICLR 2023.
			<a href="https://arxiv.org/abs/2210.17323" target="_blank" rel="noreferrer"
				>arXiv:2210.17323</a
			>
		</p>
		<p>
			Ji Lin va b. <em
				>AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration.</em
			> MLSys 2024.
			<a href="https://arxiv.org/abs/2306.00978" target="_blank" rel="noreferrer"
				>arXiv:2306.00978</a
			>
		</p>
		<p>
			Tim Dettmers va b. <em>QLoRA: Efficient Finetuning of Quantized LLMs.</em> NeurIPS 2023.
			<a href="https://arxiv.org/abs/2305.14314" target="_blank" rel="noreferrer"
				>arXiv:2305.14314</a
			>
		</p>
	</svelte:fragment>
</Lab>
