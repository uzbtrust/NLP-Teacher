<script lang="ts">
	import { base } from '$app/paths';
	import Lab from '~/components/darslik/Lab.svelte';
	import Katex from '~/utils/Katex.svelte';
	import PreLnDemo from '~/components/darslik/demos/PreLnDemo.svelte';
</script>

<svelte:head>
	<title>2.2 Pre-LN — Darslik | Transformer Explainer</title>
	<meta
		name="description"
		content="Normalizatsiyani blokdan keyin emas, oldin qo'yish: Post-LN vs Pre-LN, toza residual yo'l va warmup'siz o'qitish."
	/>
</svelte:head>

<Lab slug="pre-ln">
	<svelte:fragment slot="muammo">
		<p>
			2017-yilgi asl Transformer'da LayerNorm residual qo'shilgandan <em>keyin</em> turgan. Har blok
			shunday hisoblangan:
			<Katex math={String.raw`x_{l+1} = \mathrm{LN}(x_l + F(x_l))`} />. Bu tartib
			<strong>Post-LN</strong> deb ataladi.
		</p>
		<p>
			Bunday modelni to'g'ridan-to'g'ri katta learning rate bilan o'qitib bo'lmasdi: birinchi ming
			qadamda gradientlar portlab yoki so'nib ketardi. Loss NaN'ga aylanardi yoki model umuman
			joyidan qimirlamasdi.
		</p>
		<p>
			Yechim sifatida <strong>learning-rate warmup</strong> (isitish) ishlatilgan - LR ni nolda
			boshlab bir necha ming qadam davomida sekin ko'tarish, keyin pasaytirish. Bu ishlagan, lekin
			narxi bor edi: yana bitta giperparametr (qancha qadam isitiladi?), yana bitta xato qilish
			joyi. Warmup juda qisqa bo'lsa model portlardi, juda uzun bo'lsa hisob behuda ketardi.
		</p>
		<p>
			2020-yilda Xiong va hamkasblar sababni ko'rsatishdi: Post-LN'da residual yo'l "toza" emas. Har
			qavatda LN uni qayta masshtablaydi, shuning uchun teskari tarqalishda gradient chuqurlikka
			yetib bormaydi - pastki qavatlar amalda signal olmaydi. Warmup bu muammoni yo'qotmagan, faqat
			modelni portlashdan saqlab turgan.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="demo">
		<PreLnDemo />
	</svelte:fragment>

	<svelte:fragment slot="ozgarish">
		<p>
			O'zgarish bitta: LN ni <em>qo'shishdan keyin</em> emas, <em>shox ichida</em>, funksiyadan
			oldin qo'yish. Qavat formulasi shunday bo'ladi:
			<Katex math={String.raw`x_{l+1} = x_l + F(\mathrm{LN}(x_l))`} />. Endi
			<Katex math={String.raw`x_l`} /> chiqishgacha hech kim tegmasdan boradi.
		</p>

		<table>
			<thead>
				<tr>
					<th></th>
					<th><span class="eski">Post-LN (2017)</span></th>
					<th><span class="yangi">Pre-LN (2020)</span></th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>Formula</th>
					<td><Katex math={String.raw`\mathrm{LN}(x_l + F(x_l))`} /></td>
					<td><Katex math={String.raw`x_l + F(\mathrm{LN}(x_l))`} /></td>
				</tr>
				<tr>
					<th>Residual yo'l</th>
					<td>LN har qavatda uni qayta masshtablaydi - toza emas</td>
					<td>Toza identity: kirishdan chiqishgacha o'zgarishsiz</td>
				</tr>
				<tr>
					<th>Warmup</th>
					<td>Amalda majburiy</td>
					<td>Shart emas - katta LR bilan darrov boshlash mumkin</td>
				</tr>
				<tr>
					<th>Chuqurlik</th>
					<td>Bir necha o'nlab qavatdan keyin o'qitish beqaror bo'ladi</td>
					<td>Yuzlab qavat barqaror o'qiydi</td>
				</tr>
				<tr>
					<th>Yakuniy norm</th>
					<td>Kerak emas - oxirgi LN blok ichida</td>
					<td>Kerak - stack oxiriga bitta norm qo'yiladi</td>
				</tr>
			</tbody>
		</table>

		<h3>Nega oxirida yana bitta norm kerak</h3>
		<p>
			Pre-LN'da blok chiqishi normalizatsiya qilinmaydi: har qavat residual chiziqqa yangi hissa
			qo'shadi, shuning uchun <Katex math={String.raw`x_l`} /> ning kattaligi chuqurlik bilan asta
			o'sib boradi. Shu sababli oxirgi blokdan keyin bitta yakuniy <strong>final norm</strong> qo'shiladi
			- u chiqishni unembedding (logitlar) hisobiga tayyorlaydi. Bu bugungi deyarli hamma modelda bor.
		</p>

		<h3>Pre-LN sof yutuq emas</h3>
		<p>
			Bir xil sozlashda, ya'ni ikkalasi ham muvaffaqiyatli o'qitilganda, ba'zi tadqiqotlarda Post-LN
			biroz <em>yaxshiroq</em> yakuniy sifat bergan. Lekin uni o'qitish ancha qiyin: warmup kerak,
			LR ga sezgir, chuqurlik oshgani sari beqarorlik kuchayadi. Katta modelda bitta muvaffaqiyatsiz
			run juda qimmatga tushadi, shuning uchun amaliyot barqarorlikni tanladi - va Pre-LN standart
			bo'lib qoldi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="amalda">
		<p>
			Qiziq nuqta: bosh sahifadagi <strong>GPT-2 (2019) allaqachon Pre-LN ishlatadi</strong>. Ya'ni
			bu almashtirish amalda GPT-2'dan oldin qilingan - nazariy tushuntirish esa faqat 2020-yilda
			yozilgan. 2017-yilgi asl Transformer va BERT (2018) hali Post-LN edi.
			<a href="{base}/">jonli GPT-2 demosida</a> LN qadamining residual shoxining ichida turishini
			o'z ko'zingiz bilan ko'rishingiz mumkin.
		</p>
		<p>
			Bugungi ochiq modellar - Llama, Mistral, Qwen, DeepSeek - hammasi bir xil retseptda:
			<strong>Pre-LN + yakuniy RMSNorm</strong>. Bu 2.1-modulda ko'rilgan RMSNorm bilan birga keladi:
			norm arzonroq, o'rni esa shox ichida.
		</p>
		<p>
			Variantlari ham bor. <strong>Gemma 2</strong>'da har bir sublayer atrofida ikkitadan norm
			ishlatilgan - kirishda ham, chiqishda ham (sandwich norm): bu Pre-LN barqarorligini saqlab,
			chiqish kattaligining o'sishini ham jilovlaydi. Yangi modellarda attention ichida
			<code>QK-Norm</code> ham uchraydi - query va key vektorlarini alohida normalizatsiya qilish;
			bu 2.5-modulda blok konstruktorida tilga olinadi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="manba">
		<p>
			Xiong et al., "On Layer Normalization in the Transformer Architecture", ICML 2020 -
			<a href="https://arxiv.org/abs/2002.04745">arXiv:2002.04745</a>
		</p>
		<p>
			Baevski &amp; Auli, "Adaptive Input Representations for Neural Language Modeling", 2018 -
			<a href="https://arxiv.org/abs/1809.10853">arXiv:1809.10853</a>
		</p>
		<p>
			Vaswani et al., "Attention Is All You Need", 2017 -
			<a href="https://arxiv.org/abs/1706.03762">arXiv:1706.03762</a>
		</p>
	</svelte:fragment>
</Lab>
