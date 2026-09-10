<script lang="ts">
	import { base } from '$app/paths';
	import Lab from '~/components/darslik/Lab.svelte';
	import Katex from '~/utils/Katex.svelte';
	import FlashAttentionDemo from '~/components/darslik/demos/FlashAttentionDemo.svelte';

	const S_F = String.raw`S = QK^{\top},\quad P = \mathrm{softmax}(S),\quad O = PV`;
	const OLCHAM = String.raw`n^2 = 8192^2 \approx 67\ \text{mln}`;
	const M_F = String.raw`m_{\text{yangi}} = \max\!\left(m_{\text{eski}},\ \max_{j \in \text{blok}} S_{ij}\right)`;
	const L_F = String.raw`\ell_{\text{yangi}} = \underbrace{e^{\,m_{\text{eski}} - m_{\text{yangi}}}}_{\text{qayta masshtablash}}\ \ell_{\text{eski}} \;+\; \sum_{j \in \text{blok}} e^{\,S_{ij} - m_{\text{yangi}}}`;
	const O_F = String.raw`O_{\text{yangi}} = e^{\,m_{\text{eski}} - m_{\text{yangi}}}\, O_{\text{eski}} \;+\; \sum_{j \in \text{blok}} e^{\,S_{ij} - m_{\text{yangi}}}\, v_j`;
	const OXIR_F = String.raw`O_i = O / \ell`;
	const XOTIRA_F = String.raw`O(n^2) \;\longrightarrow\; O(n)`;
</script>

<svelte:head>
	<title>3.4 FlashAttention — Darslik | Transformer Explainer</title>
	<meta
		name="description"
		content="Attention matritsasini umuman yozmaslik: tiling, online softmax va recomputation. Nima uchun tezlik kamroq hisoblashdan emas, kamroq xotira yurishidan keladi."
	/>
</svelte:head>

<Lab slug="flash-attention">
	<svelte:fragment slot="muammo">
		<p>
			Standart attention uch qadamdan iborat: <Katex math={S_F} />. Yozilishi qisqa, lekin bu
			yozuvda ko'rinmaydigan narsa bor. <code>S</code> hisoblanadi va <strong>xotiraga yoziladi</strong>.
			Keyin u qaytadan o'qiladi, softmax olinadi, <code>P</code> yana yoziladi. Keyin <code>P</code>
			yana o'qiladi va <code>V</code> ga ko'paytiriladi.
		</p>
		<p>
			<code>S</code> va <code>P</code> &mdash; <code>n &times; n</code> o'lchamdagi matritsalar.
			Ketma-ketlik uzunligi 8192 bo'lsa, bitta head uchun <Katex math={OLCHAM} /> ta son. Bu ikki
			jihatdan yomon. Birinchisi ko'rinib turibdi: xotira <code>n^2</code> bo'yicha o'sadi.
			Ikkinchisi kamroq ko'rinadi, lekin muhimroq: bu matritsalar GPU ning <strong>sekin
			xotirasiga</strong> yozilib, keyin o'sha yerdan qaytadan o'qiladi. Vaqt hisobda emas, ana shu
			yurishda ketadi.
		</p>

		<h3>GPU da ikki xil xotira bor</h3>
		<p>
			GPU ning xotirasi bitta emas. Chipning o'zida kichkina va juda tez SRAM bor; chipdan tashqarida
			esa katta, lekin sezilarli sekinroq HBM turadi. A100 uchun raqamlar shunday:
		</p>

		<table>
			<thead>
				<tr>
					<th></th>
					<th><span class="yangi">SRAM (chip ustida)</span></th>
					<th><span class="eski">HBM (chipdan tashqarida)</span></th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>Hajm</th>
					<td>~20 MB</td>
					<td>40&ndash;80 GB</td>
				</tr>
				<tr>
					<th>O'tkazuvchanlik</th>
					<td>~19 TB/s</td>
					<td>~1.5&ndash;2.0 TB/s</td>
				</tr>
				<tr>
					<th>Nima uchun ishlatiladi</th>
					<td>hozir ustida ishlanayotgan kichik blok</td>
					<td>model vaznlari, KV cache, oraliq matritsalar</td>
				</tr>
			</tbody>
		</table>

		<p>
			SRAM taxminan <strong>o'n barobar tez</strong>, lekin mingdan bir marta kichik. Attention xuddi
			shu nomutanosiblikka tushib qoladi: <code>n &times; n</code> matritsa SRAM ga sig'maydi, demak
			u HBM ga chiqishi shart, va HBM sekin.
		</p>
		<p>
			Natijada attention <strong>memory-bound</strong> (xotiraga taqalgan) amalga aylanadi. Bu shuni
			anglatadiki, GPU ning hisoblash birliklari o'z ishini allaqachon tugatgan va bo'sh turibdi
			&mdash; ular ma'lumot yetib kelishini kutadi. Bunday holatda kernel'ni tezlashtirishning yagona
			yo'li kamroq <em>hisoblash</em> emas, kamroq <em>yurish</em>. FlashAttention aynan shu yerdan
			boshlanadi: uning nomidagi "IO-Awareness" &mdash; kernel qaysi xotiradan nima o'qiyotganini
			bilishi degani.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="demo">
		<FlashAttentionDemo />
	</svelte:fragment>

	<svelte:fragment slot="ozgarish">
		<p>
			Tri Dao va hammualliflari 2022-yilda attention'ni qayta yozishdi &mdash; formulani emas, uni
			GPU da bajaradigan <strong>kernel</strong>ni. Uch g'oya birgalikda ishlaydi.
		</p>

		<h3>1. Tiling &mdash; bloklarga bo'lish</h3>
		<p>
			<code>Q</code>, <code>K</code> va <code>V</code> bloklarga bo'linadi, blok o'lchami SRAM ga
			sig'adigan qilib tanlanadi. Kernel bir vaqtda faqat bitta <code>Q</code>-blok va bitta
			<code>KV</code>-blok kesishmasi ustida ishlaydi. Butun <code>n &times; n</code> matritsa hech
			qachon bir joyda mavjud bo'lmaydi.
		</p>

		<h3>2. Online softmax &mdash; butun qatorni ko'rmasdan normallashtirish</h3>
		<p>
			Bu yerda muammo bor: softmax maxrajda butun qator bo'yicha yig'indi talab qiladi, blok esa
			qatorning faqat bir bo'lagini ko'radi. Yechim 2018-yilda Milakov va Gimelshein tomonidan
			ta'riflangan: har qator uchun ikkita ishlayotgan qiymatni saqlash yetadi &mdash; hozirgacha
			ko'rilgan maksimum <code>m</code> va normallashtirish yig'indisi <code>l</code>.
		</p>
		<p>Har yangi blokda avval maksimum yangilanadi:</p>
		<p><Katex math={M_F} displayMode /></p>
		<p>
			Agar maksimum o'sgan bo'lsa, oldingi qisman natijalar noto'g'ri asosga hisoblangan bo'lib
			qoladi. Ularni tashlab yuborish shart emas &mdash; bitta koeffitsiyentga ko'paytirish kifoya:
		</p>
		<p><Katex math={L_F} displayMode /></p>
		<p><Katex math={O_F} displayMode /></p>
		<p>
			Hamma bloklar o'tib bo'lgach <Katex math={OXIR_F} />. Demodagi jadvalda o'sha
			<code>exp(m_eski - m_yangi)</code> koeffitsiyentini jonli ko'rishingiz mumkin: maksimum
			o'zgarmagan qatorda u 1 ga teng, o'sgan qatorda esa birdan kichik chiqadi va oldingi
			yig'indini pasaytiradi.
		</p>

		<h3>3. Recomputation &mdash; saqlash o'rniga qayta hisoblash</h3>
		<p>
			Backward pass uchun odatda <code>P</code> saqlanadi. FlashAttention uni saqlamaydi &mdash;
			forward'dan faqat <code>m</code> va <code>l</code> qoladi, <code>P</code> esa backward paytida
			qaytadan hisoblanadi. Bu qo'shimcha FLOP demak. Lekin qo'shimcha FLOP arzon, HBM yurishi esa
			qimmat: kernel baribir tezroq chiqadi. Bu &mdash; memory-bound rejimda o'ylashning eng aniq
			misoli.
		</p>

		<p>
			Uch g'oyaning natijasi: xotira <Katex math={XOTIRA_F} /> ga tushadi va HBM yurishi bir necha
			barobar kamayadi.
		</p>

		<h3>Eng muhim jumla</h3>
		<p>
			<strong>Chiqish standart attention bilan bit-ma-bit bir xil.</strong> Bu approksimatsiya emas,
			taqribiy usul emas, sifat va tezlik o'rtasidagi savdolashuv emas. Demodagi "chiqish farqi: 0"
			qatori shuni ko'rsatadi: matritsa yozilmasa ham, natija o'zgarmaydi.
		</p>
		<p>
			Shu joyda FlashAttention <span class="eski">siyrak (sparse)</span> attention usullaridan tubdan
			ajraladi. Siyrak usullar attention matritsasining bir qismini <em>tashlab yuboradi</em> &mdash;
			ular tezroq ishlaydi, lekin boshqa narsani hisoblaydi va natija boshqacha chiqadi. FlashAttention
			esa hech nimani tashlamaydi, u faqat hisoblash tartibini o'zgartiradi. Siyrak usullar
			darslikning 05-qismida alohida ko'riladi &mdash; ularni bu bilan chalkashtirmaslik kerak.
		</p>
		<p>
			Amaliy oqibati katta: FlashAttention <strong>model tuzilishini umuman o'zgartirmaydi</strong>.
			Bu darslikdagi boshqa modullardan farqli o'laroq, bu yerda arxitekturaga bitta ham qo'l
			tegmaydi. O'zgargan narsa &mdash; bitta amalning GPU da qanday bajarilishi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="amalda">
		<p>
			Amalda buni yoqish uchun odatda hech narsa yozish kerak emas. PyTorch'da
			<code>torch.nn.functional.scaled_dot_product_attention</code> chaqirilganda kutubxona mos
			backend'ni o'zi tanlaydi va shartlar bajarilsa FlashAttention kernel'iga tushadi. Ko'p
			modellarda "FlashAttention'ga o'tish" amalda attention'ni qo'lda yozilgan
			<code>matmul + softmax + matmul</code> ketma-ketligidan shu bitta chaqiruvga almashtirishdan
			iborat.
		</p>

		<h3>Uchta avlod</h3>
		<table>
			<thead>
				<tr>
					<th>Versiya</th>
					<th>Yil</th>
					<th>Asosiy hissa</th>
					<th>Qaysi GPU</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>FlashAttention</th>
					<td>2022</td>
					<td>tiling, online softmax, recomputation &mdash; asosiy g'oya</td>
					<td>Ampere (A100) va undan keyingilar</td>
				</tr>
				<tr>
					<th><span class="yangi">FlashAttention-2</span></th>
					<td>2023</td>
					<td>
						matmul bo'lmagan amallar kamaytirildi; parallelizatsiya ketma-ketlik uzunligi bo'yicha
						ham; warp'lar orasida ish taqsimoti yaxshilandi
					</td>
					<td>Ampere (A100)</td>
				</tr>
				<tr>
					<th><span class="yangi">FlashAttention-3</span></th>
					<td>2024</td>
					<td>
						warp-specialization; TMA orqali asinxron ko'chirish va WGMMA hisobini overlap qilish;
						FP8 qo'llab-quvvatlash
					</td>
					<td>Hopper (H100)</td>
				</tr>
			</tbody>
		</table>

		<p>
			<strong>FlashAttention-2</strong> nima uchun shunchalik ko'p yutdi? GPU da matritsa
			ko'paytirish birligi boshqa amallardan bir necha barobar tez. Demak har bir ortiqcha bo'lish
			yoki qo'shish nisbatan qimmatga tushadi &mdash; FA2 aynan shularni siyraklashtirdi. Ikkinchi
			o'zgarish parallelizatsiyaga tegishli: FA1 ishni batch va head bo'yicha taqsimlagan edi, uzun
			kontekst va kichik batch da esa bu GPU ni to'liq band qilishga yetmaydi. FA2 ketma-ketlik
			uzunligi bo'yicha ham parallellashtiradi. Natija: FA1 ga nisbatan taxminan
			<strong>2 barobar tez</strong>, A100 ning nazariy chegarasining <strong>~70%</strong> iga
			chiqadi.
		</p>
		<p>
			<strong>FlashAttention-3</strong> esa Hopper me'morchiligiga bog'liq. U H100 dagi asinxron
			ko'chirish (TMA) va yangi matmul birligi (WGMMA) borligiga tayanadi: ma'lumot ko'chirilayotgan
			paytda hisob to'xtamaydi, ikkalasi bir-birining ustiga qo'yiladi. FA2 ga nisbatan
			<strong>1.5&ndash;2 barobar</strong>, FP16 da H100 da <strong>740 TFLOPs/s</strong> gacha
			(~75% bandlik), FP8 da esa <strong>1.2 PFLOPs/s</strong> atrofida. Muhim shart: bu raqamlar
			H100 uchun. Eski kartada FA3 ni yoqib bo'lmaydi, u yerda FA2 amaldagi chegara bo'lib qoladi.
		</p>

		<h3>Nima uchun uni yoqmaslik uchun sabab yo'q</h3>
		<p>
			Bu darslikdagi ko'p qarorlar savdolashuvga olib keladi: GQA cache'ni kichraytiradi, lekin
			head'lar sonini kamaytiradi; quantization xotirani tejaydi, lekin aniqlikni biroz yo'qotadi.
			FlashAttention bunday emas. U <strong>kernel</strong> &mdash; chiqish bir xil, vaznlar o'sha,
			natija o'sha. Shuning uchun uni o'chirib qo'yishning texnik sababi yo'q; yagona savol qo'lingizdagi
			GPU va kutubxona uni qo'llab-quvvatlaydimi yoki yo'qmi.
		</p>

		<h3>Bu modul 3.1&ndash;3.3 dan nimasi bilan farq qiladi</h3>
		<p>
			<a href="{base}/darslik/kv-cache">KV cache</a>,
			<a href="{base}/darslik/gqa">MQA/GQA</a> va <a href="{base}/darslik/mla">MLA</a> bitta o'q
			bo'ylab harakat qiladi: ular <strong>cache o'lchamini</strong> kichraytiradi, ya'ni xotirada
			nechta bayt turishini. FlashAttention boshqa o'qda: cache o'lchamiga u umuman tegmaydi, u
			<strong>xotira yurishini</strong> &mdash; ma'lumot HBM va chip o'rtasida necha marta borib
			kelishini kamaytiradi.
		</p>
		<p>
			Shuning uchun ular bir-birini almashtirmaydi, balki bir-biriga qo'shiladi. Amaldagi inference
			server bir vaqtda GQA ham, FlashAttention ham, sahifalangan cache ham ishlatadi &mdash; har biri
			boshqa cho'ntakdan tejaydi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="manba">
		<p>
			Tri Dao, Daniel Y. Fu, Stefano Ermon, Atri Rudra, Christopher Re.
			<em>FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness.</em>
			NeurIPS 2022.
			<a href="https://arxiv.org/abs/2205.14135" target="_blank" rel="noreferrer">arXiv:2205.14135</a>
		</p>
		<p>
			Tri Dao.
			<em>FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning.</em> 2023.
			<a href="https://arxiv.org/abs/2307.08691" target="_blank" rel="noreferrer">arXiv:2307.08691</a>
		</p>
		<p>
			Jay Shah, Ganesh Bikshandi, Ying Zhang, Vijay Thakkar, Pradeep Ramani, Tri Dao.
			<em>FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision.</em> 2024.
			<a href="https://arxiv.org/abs/2407.08608" target="_blank" rel="noreferrer">arXiv:2407.08608</a>
		</p>
		<p>
			Qo'shimcha &mdash; online softmax g'oyasining manbasi: Maxim Milakov, Natalia Gimelshein.
			<em>Online normalizer calculation for softmax.</em> 2018.
			<a href="https://arxiv.org/abs/1805.02867" target="_blank" rel="noreferrer">arXiv:1805.02867</a>
		</p>
	</svelte:fragment>
</Lab>
