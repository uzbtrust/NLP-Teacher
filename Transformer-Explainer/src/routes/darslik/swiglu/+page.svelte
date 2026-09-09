<script lang="ts">
	import { base } from '$app/paths';
	import Lab from '~/components/darslik/Lab.svelte';
	import SwiGluDemo from '~/components/darslik/demos/SwiGluDemo.svelte';
</script>

<svelte:head>
	<title>2.3 SwiGLU — Darslik | Transformer Explainer</title>
	<meta
		name="description"
		content="FFN'ga eshik qo'shish: SwiGLU nima uchun GELU MLP o'rnini egalladi va uchinchi matritsa parametrlar sonini qanday saqlab qoladi."
	/>
</svelte:head>

<Lab slug="swiglu">
	<svelte:fragment slot="muammo">
		<p>
			FFN transformer parametrlarining taxminan <strong>uchdan ikkisini</strong> egallaydi. Shuncha
			og'irlikka qaramay, u blokdagi eng sodda qism: ikkita matritsa va ular orasida bitta
			aktivatsiya funksiyasi. Attention murakkab, dinamik, kontekstga bog'liq — FFN esa har bir
			token uchun bir xil, qat'iy amal.
		</p>
		<p>
			Yaqinroq qarasak, FFN aslida nima qilishini ko'ramiz. Yashirin qatlamdagi har bir neyron
			<code>W_up</code> ning bitta qatoriga mos keladi. Aktivatsiya esa shu neyron uchun
			"yoqilganmi yoki yo'q" degan qarorni beradi: GELU manfiy kirishni deyarli nolga siqadi,
			musbatni deyarli o'zgarishsiz o'tkazadi.
		</p>
		<p>
			Muammo shunda: <em>qaror ham, qiymat ham bitta chiziqli funksiyadan</em> chiqadi. Neyron
			qanchalik kuchli yonishi va umuman yonish-yonmasligi — ikkalasi ham <code>W_up · x</code>
			ning o'sha yagona soniga bog'liq. Bu ikki vazifani ajratib bo'lmaydi. 2016-yilda Dauphin va
			hamkasblari savol berishdi: agar qarorni alohida, o'zi o'rganadigan yo'lga topshirsak-chi?
		</p>
	</svelte:fragment>

	<svelte:fragment slot="demo">
		<SwiGluDemo />
	</svelte:fragment>

	<svelte:fragment slot="ozgarish">
		<p>
			GLU (Gated Linear Unit) g'oyasi sodda: kirishdan <strong>ikkita</strong> chiziqli proyeksiya
			olinadi. Biri qiymat (value), ikkinchisi eshik (gate). Eshikka aktivatsiya qo'llanadi va
			ikkalasi elementma-element ko'paytiriladi. SwiGLU — eshik aktivatsiyasi sifatida Swish/SiLU
			ishlatilgan variant.
		</p>

		<table>
			<thead>
				<tr>
					<th></th>
					<th><span class="eski">GELU MLP (GPT-2)</span></th>
					<th><span class="yangi">SwiGLU (Llama)</span></th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>Chiziqli matritsalar</th>
					<td><span class="eski">2 ta: W_up, W_down</span></td>
					<td><span class="yangi">3 ta: W_gate, W_up, W_down</span></td>
				</tr>
				<tr>
					<th>Aktivatsiya</th>
					<td><span class="eski">GELU — signalning o'ziga</span></td>
					<td><span class="yangi">SiLU — faqat eshikka</span></td>
				</tr>
				<tr>
					<th>Yashirin o'lcham</th>
					<td><span class="eski">4d</span></td>
					<td><span class="yangi">~(8/3)d &asymp; 2.67d</span></td>
				</tr>
				<tr>
					<th>Parametrlar soni</th>
					<td>2 &times; 4d&sup2; = 8d&sup2;</td>
					<td>3 &times; 2.67d&sup2; &asymp; 8d&sup2;</td>
				</tr>
				<tr>
					<th>Qaror va qiymat</th>
					<td><span class="eski">bitta yo'ldan</span></td>
					<td><span class="yangi">ikkita alohida yo'ldan</span></td>
				</tr>
			</tbody>
		</table>

		<p>
			Jadvaldagi eng muhim qator — <strong>yashirin o'lcham</strong>. Uchinchi matritsa qo'shilgani
			uchun parametrlar soni oshib ketmasin deb, yashirin o'lcham <code>4d</code> dan taxminan
			<code>(8/3)d</code> ga tushiriladi. Llama'da <code>d_ff</code> aynan shu nisbatda tanlangan.
			Natijada umumiy parametr soni deyarli o'zgarmaydi, ya'ni yaxshilanish "ko'proq parametr
			qo'shdik" degani emas.
		</p>
		<p>
			Halol bo'lgan yaxshi: <strong>nega ishlashiga to'liq nazariy javob yo'q.</strong> Shazeer o'z
			maqolasida buni ochiq yozgan — tajribalar barqaror yaxshilanish ko'rsatadi, lekin sababni
			izohlab bera olmasligini tan olgan. SwiGLU standartga aylanishining sababi nazariya emas,
			ko'p marta mustaqil takrorlangan natija.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="amalda">
		<p>
			<strong>SwiGLU</strong> — Llama 1/2/3, Mistral, Qwen, DeepSeek, PaLM, OLMo.
			<strong>GeGLU</strong> (o'sha g'oya, lekin eshik aktivatsiyasi GELU) — Gemma va T5 v1.1.
			<strong>GELU MLP</strong> — GPT-2, GPT-3, BERT: eshiksiz, ikki matritsali klassik variant.
		</p>
		<p>
			Bosh sahifadagi <a href="{base}/">jonli GPT-2 modelida</a> MLP qadamini ochsangiz, aynan
			eshiksiz variantni ko'rasiz: bitta yuqoriga proyeksiya, GELU, bitta pastga proyeksiya.
		</p>
		<p>
			Bu almashtirish keyingi qismlar uchun ham muhim: <strong>MoE</strong> arxitekturasida har bir
			expert aslida shunday bitta FFN. Ya'ni MoE modelda SwiGLU o'nlab, ba'zan yuzlab marta
			nusxalanadi — shuning uchun uning parametr hisobi va tezligi o'sha yerda yana qaytib chiqadi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="manba">
		<p>
			Noam Shazeer, <a href="https://arxiv.org/abs/2002.05202" target="_blank" rel="noreferrer"
				>GLU Variants Improve Transformer</a
			>, 2020, arXiv:2002.05202.
		</p>
		<p>
			Yann N. Dauphin va b., <a href="https://arxiv.org/abs/1612.08083" target="_blank" rel="noreferrer"
				>Language Modeling with Gated Convolutional Networks</a
			>, 2016, arXiv:1612.08083.
		</p>
		<p>
			Dan Hendrycks, Kevin Gimpel, <a href="https://arxiv.org/abs/1606.08415" target="_blank" rel="noreferrer"
				>Gaussian Error Linear Units (GELUs)</a
			>, 2016, arXiv:1606.08415.
		</p>
	</svelte:fragment>
</Lab>
