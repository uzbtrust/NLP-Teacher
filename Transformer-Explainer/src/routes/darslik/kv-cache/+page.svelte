<script lang="ts">
	import { base } from '$app/paths';
	import Lab from '~/components/darslik/Lab.svelte';
	import Katex from '~/utils/Katex.svelte';
	import KvCacheDemo from '~/components/darslik/demos/KvCacheDemo.svelte';

	const ORTIQCHA = String.raw`1 + 2 + \dots + n \;=\; \frac{n(n+1)}{2} \;\approx\; \frac{n^2}{2}`;
	const BAYT_F = String.raw`\text{bayt/token} \;=\; 2 \times L \times h_{kv} \times d_h \times b`;
</script>

<svelte:head>
	<title>3.1 KV Cache — Darslik | Transformer Explainer</title>
	<meta
		name="description"
		content="Nima uchun generatsiyada K va V saqlanadi, Q esa saqlanmaydi; prefill va decode fazalari nimasi bilan farq qiladi va KV cache qancha xotira talab qiladi."
	/>
</svelte:head>

<Lab slug="kv-cache">
	<svelte:fragment slot="muammo">
		<p>
			Model matnni bir yo'la yozmaydi. U <strong>token-token</strong> yozadi: bitta token chiqaradi,
			uni ketma-ketlik oxiriga qo'shadi, keyin butun ketma-ketlikka qarab keyingi tokenni chiqaradi.
			Har bir yangi token uchun attention butun oldingi kontekstga murojaat qiladi &mdash; bu
			arxitekturaning o'zgarmas qismi.
		</p>
		<p>
			Sodda amalga oshirishda har qadamda butun ketma-ketlik modeldan qaytadan o'tkaziladi, ya'ni
			<strong>hamma token uchun K va V qaytadan hisoblanadi</strong>. Lekin oldingi tokenlarning K
			va V si o'zgargan emas. Causal mask tufayli har bir token faqat o'zidan oldingilarga qaray
			oladi, demak <em>kelajak o'tmishga ta'sir qilmaydi</em>: to'rtinchi token qo'shilgani
			birinchi tokenning k va v vektorlarini qimirlatmaydi. Ular birinchi marta hisoblanganda
			qanday bo'lsa, oxirigacha shundayligicha qoladi.
		</p>
		<p>
			Hisob oddiy. Birinchi qadamda 1 ta token uchun, ikkinchisida 2 ta, uchinchisida 3 ta &mdash;
			<Katex math={ORTIQCHA} /> marta. Ya'ni n ta token yozish uchun taxminan
			<code>n^2/2</code> marta K/V hisoblanadi, holbuki haqiqatan kerakligi <code>n</code> ta.
			Kontekst uzayganda bu farq chidab bo'lmas darajaga chiqadi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="demo">
		<KvCacheDemo />
	</svelte:fragment>

	<svelte:fragment slot="ozgarish">
		<p>
			Yechim shu qadar sodda-ki, uni alohida ixtiro deb atash ham qiyin: hisoblangan K va V ni
			saqlab qo'yish. Har qadamda faqat <strong>bitta yangi token</strong> uchun k va v hisoblanadi
			va cache oxiriga qo'shiladi. Attention esa cache'dagi to'liq K va V ga qaraydi. Ish hajmi
			kvadratikdan chiziqliga tushadi, natija esa <em>aynan bir xil</em> &mdash; bu tezlashtirish
			hech qanday taqribiylik kiritmaydi.
		</p>

		<h3>Nega faqat K va V? Q qayerda?</h3>
		<p>
			Attention'da q, k va v uch xil rol o'ynaydi. Har qadamda faqat yangi tokenning
			<strong>q</strong> vektori kerak: u cache'dagi barcha k lar bilan solishtiriladi va natijada v
			larning aralashmasi olinadi. Oldingi tokenlarning q vektorlari esa boshqa hech qachon
			ishlatilmaydi &mdash; ular o'z qadamida ishini bajarib bo'lgan. Shuning uchun ularni
			saqlashning ma'nosi yo'q: <strong>"Q cache" degan narsa mavjud emas</strong>, faqat K va V
			saqlanadi.
		</p>

		<h3>Ikki faza: prefill va decode</h3>
		<p>
			Cache paydo bo'lishi bilan generatsiya bir jinsli jarayon bo'lmay qoladi. U ikkita butunlay
			boshqacha fazaga bo'linadi, va bu shu modulning eng muhim g'oyasi.
		</p>

		<table>
			<thead>
				<tr>
					<th></th>
					<th><span class="yangi">prefill</span></th>
					<th><span class="yangi">decode</span></th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>Nima kiradi</th>
					<td>butun prompt bir yo'la</td>
					<td>har qadamda bitta token</td>
				</tr>
				<tr>
					<th>Hisob turi</th>
					<td>matritsa &times; matritsa</td>
					<td>matritsa &times; vektor</td>
				</tr>
				<tr>
					<th>Parallellik</th>
					<td>hamma token parallel</td>
					<td>ketma-ket, qadam-baqadam</td>
				</tr>
				<tr>
					<th>Nima cheklaydi</th>
					<td>hisob quvvati &mdash; <code>compute-bound</code></td>
					<td>xotira o'tkazuvchanligi &mdash; <code>memory-bound</code></td>
				</tr>
				<tr>
					<th>GPU holati</th>
					<td>to'la ishlaydi</td>
					<td><span class="eski">kutadi</span></td>
				</tr>
			</tbody>
		</table>

		<p>
			Decode fazasida har bir vazn matritsasi xotiradan o'qiladi, lekin ustida juda kam amal
			bajariladi &mdash; bitta vektorga ko'paytiriladi, tamom. GPU'ning hisoblash bloklari bo'sh
			turadi, butun vaqt vaznlarni xotiradan tortib olishga ketadi. Prefill'da esa o'sha bir marta
			o'qilgan vazn butun promptga ishlatiladi, shuning uchun GPU to'yinadi.
		</p>
		<p>
			Amaliy xulosa: <strong>birinchi tokengacha kutish (TTFT) va keyingi tokenlar tezligi
			butunlay boshqa qonunga bo'ysunadi</strong>. Ularni bitta "tezlik" raqamiga qo'shib yuborish
			xato bo'ladi &mdash; ikkalasini alohida o'lchash kerak, chunki ularni yaxshilash usullari ham
			har xil.
		</p>

		<h3>Cache qancha joy egallaydi</h3>
		<p>Bir token uchun kerak bo'ladigan bayt soni to'g'ridan-to'g'ri hisoblanadi:</p>
		<p><Katex math={BAYT_F} displayMode={true} /></p>
		<p>
			Bu yerda 2 &mdash; K va V ikkitaligi uchun, <code>L</code> &mdash; qavatlar soni,
			<code>h_kv</code> &mdash; KV head soni, <code>d_h</code> &mdash; head o'lchami,
			<code>b</code> &mdash; bitta son necha bayt egallashi (fp16 uchun 2).
		</p>

		<table>
			<thead>
				<tr>
					<th>Model</th>
					<th>Hisob</th>
					<th>Bir token</th>
					<th>Kontekst</th>
					<th>Cache</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>GPT-2 small</th>
					<td><code>2 &times; 12 &times; 12 &times; 64 &times; 2</code></td>
					<td>36 KB</td>
					<td>1024 token</td>
					<td>36 MB</td>
				</tr>
				<tr>
					<th>Llama 2 7B</th>
					<td><code>2 &times; 32 &times; 32 &times; 128 &times; 2</code></td>
					<td>512 KB</td>
					<td>4096 token</td>
					<td><span class="yangi">2 GB</span></td>
				</tr>
				<tr>
					<th>Llama 3 8B</th>
					<td><code>2 &times; 32 &times; 8 &times; 128 &times; 2</code></td>
					<td>128 KB</td>
					<td>8192 token</td>
					<td>1 GB</td>
				</tr>
			</tbody>
		</table>

		<p>
			Llama 2 7B da MHA ishlatilgan &mdash; 32 ta head ning har biri o'z K va V siga ega. Llama 3
			8B da esa GQA bor: head lar soni o'sha-o'sha, lekin KV head faqat 8 ta. Shuning uchun
			ikkinchisi ikki barobar uzun kontekstda ikki barobar kam joy egallaydi.
		</p>
		<p>
			Ikkita narsani ajratib olish kerak. Birinchisi: cache o'lchami kontekst uzunligiga
			<strong>chiziqli o'sadi</strong> &mdash; kontekstni ikki barobar uzaytirsangiz, cache ham ikki
			barobar kattalashadi. Ikkinchisi, va muhimrog'i: bu raqam <strong>bir foydalanuvchi
			uchun</strong>. 32 ta so'rovni bir vaqtda xizmat qilayotgan serverda u 32 marta ko'payadi.
		</p>
		<p>
			Model vaznlari xotirada qat'iy joy egallaydi &mdash; ular o'zgarmaydi. Cache esa o'zgaruvchan:
			u har bir so'rov bilan o'sadi va so'rov tugagach bo'shaydi. Kartada vaznlardan keyin qolgan
			bo'sh joy aynan cache uchun ishlatiladi, shuning uchun <strong>server bir vaqtda nechta
			so'rovni uddalashi to'g'ridan-to'g'ri shu raqamga bog'liq</strong>.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="amalda">
		<p>
			Amalda KV cache'ni yoqish kerak emas &mdash; u allaqachon yoqilgan. HuggingFace
			Transformers'da <code>use_cache=True</code> sukut bo'yicha o'rnatilgan, va
			<code>generate()</code> chaqirganingizda cache ishlatiladi. Uni <code>False</code> qilib
			ko'rish mumkin: natija bir xil chiqadi, faqat generatsiya sezilarli sekinlashadi.
		</p>
		<p>
			Modeldan qaytadigan <code>past_key_values</code> &mdash; aynan o'sha cache. U har bir qavat
			uchun K va V tenzorlarini saqlaydi va keyingi chaqiruvga qaytib kiritiladi. Uzunligi har
			qadamda bittaga o'sib boradi; agar uni qo'lda boshqarsangiz (masalan, o'z generatsiya
			siklingizni yozsangiz), aynan shu obyektni bir qadamdan keyingisiga uzatasiz.
		</p>
		<p>
			Va endi eng muhimi. Cache tezlik muammosini hal qildi, lekin uning o'rniga
			<strong>yangi muammo tug'ildi: xotira</strong>. 03-qismning qolgan modullari &mdash;
			<a href="{base}/darslik/gqa">GQA</a>, <a href="{base}/darslik/mla">MLA</a>,
			<a href="{base}/darslik/paged-attention">PagedAttention</a>,
			<a href="{base}/darslik/quantization">quantization</a> &mdash; hammasi bitta ishni qiladi:
			yuqoridagi formuladan chiqadigan raqamni kichraytiradi. GQA <code>h_kv</code> ni tushiradi,
			MLA K va V ni siqib latent vektorga aylantiradi, quantization <code>b</code> ni kamaytiradi,
			PagedAttention esa ajratilgan joyning behuda ketishini to'xtatadi. Shuning uchun bu modul
			birinchi bo'lib keladi: u butun qismning ramkasini o'rnatadi.
		</p>
		<p>
			Bosh sahifadagi <a href="{base}/">GPT-2 modelida</a> attention qadamini ochib, har bir token
			uchun K va V vektorlari qanday hosil bo'lishini ko'rish mumkin. Aynan o'sha vektorlar
			generatsiya paytida cache'da saqlanib qoladi &mdash; yuqoridagi jadvaldagi 36 KB shu
			vektorlarning 12 qavat bo'ylab yig'indisi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="manba">
		<p>
			Reiner Pope va boshqalar. <em>Efficiently Scaling Transformer Inference.</em> 2022.
			<a href="https://arxiv.org/abs/2211.05102" target="_blank" rel="noreferrer"
				>arXiv:2211.05102</a
			>
			&mdash; prefill/decode ajratmasi va cache xotirasi tahlilining eng aniq bayoni.
		</p>
		<p>
			Noam Shazeer. <em>Fast Transformer Decoding: One Write-Head is All You Need.</em> 2019.
			<a href="https://arxiv.org/abs/1911.02150" target="_blank" rel="noreferrer"
				>arXiv:1911.02150</a
			>
			&mdash; KV cache o'lchami muammo sifatida birinchi marta shu yerda qo'yilgan.
		</p>
		<p>
			Eslatma: KV cache alohida maqolada e'lon qilinmagan. U dekoderni amalga oshirish jarayonida,
			tabiiy optimizatsiya sifatida paydo bo'lgan &mdash; shuning uchun uni "kim ixtiro qilgan"
			degan savolning aniq javobi yo'q. Yuqoridagi ikki maqola uni ixtiro qilmagan, balki uning
			narxini birinchi bo'lib jiddiy o'lchagan.
		</p>
	</svelte:fragment>
</Lab>
