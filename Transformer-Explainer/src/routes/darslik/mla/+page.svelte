<script lang="ts">
	import { base } from '$app/paths';
	import Lab from '~/components/darslik/Lab.svelte';
	import Katex from '~/utils/Katex.svelte';
	import MlaDemo from '~/components/darslik/demos/MlaDemo.svelte';

	const SIQ_F = String.raw`c_t = W^{DKV} h_t, \qquad k_t = W^{UK} c_t, \quad v_t = W^{UV} c_t`;
	const ABS_F = String.raw`q^{\top} k = (W^{Q} h)^{\top} W^{UK} c = \big((W^{UK})^{\top} W^{Q} h\big)^{\top} c`;
</script>

<svelte:head>
	<title>3.3 MLA — Darslik | Transformer Explainer</title>
	<meta
		name="description"
		content="Multi-head Latent Attention: K va V ni past o'lchamli latent vektorga siqish, absorption va decoupled RoPE."
	/>
</svelte:head>

<Lab slug="mla">
	<svelte:fragment slot="muammo">
		<p>
			GQA cache'ni bitta yo'l bilan kichraytiradi — K/V juftlari sonini kamaytirib. Lekin bu
			yo'lning aniq oxiri bor: <code>G = 1</code> da (MQA) sifat pasayadi, undan pastga esa
			tushib bo'lmaydi. Ya'ni bu o'q tugagan.
		</p>
		<p>
			DeepSeek-V2 jamoasi 2024-yilda boshqa savol berdi: nima uchun biz umuman K va V ni
			<em>o'z holicha</em> saqlaymiz? K va V bir xil manbadan — token vektori <code>h</code> dan —
			chiqadi. Demak ular bir-biriga bog'liq, ularda ortiqcha ma'lumot bor. Bog'liq bo'lgan
			narsani esa siqish mumkin.
		</p>
		<p>
			Bu — cache'ni kichraytirishning ikkinchi o'qi: head sonini emas, <strong>saqlanadigan
			vektorning o'lchamini</strong> kamaytirish.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="demo">
		<MlaDemo />
	</svelte:fragment>

	<svelte:fragment slot="ozgarish">
		<p>
			Har bir token uchun to'liq K va V vektorlarini saqlash o'rniga, ular birgalikda past
			o'lchamli <code>latent</code> (yashirin) vektorga proyeksiya qilinadi. Cache'da faqat
			o'sha vektor turadi; K va V kerak bo'lganda undan ochiladi.
		</p>
		<p><Katex math={SIQ_F} displayMode /></p>
		<p>
			DeepSeek-V2 da latent o'lchami <code>d_c = 512</code>, ya'ni head o'lchamining to'rt
			barobari. Taqqoslash uchun: to'liq K va V birgalikda 128 head x 128 o'lcham x 2 =
			32 768 ta son. Bu — <code>low-rank</code> (past rangli) siqish: matritsa to'liq
			erkinlikka ega emas degan taxminni ochiq ishlatish.
		</p>

		<h3>Absorption — siqishni tekinga aylantirish</h3>
		<p>
			Bu yerda tabiiy e'tiroz tug'iladi. Agar har qadamda latentdan K va V ni ochish kerak
			bo'lsa, biz xotirani tejab, hisobni qimmatlashtirgan bo'lamiz. Foyda qayerda?
		</p>
		<p>
			Javob attention formulasining tuzilishida. K faqat Q bilan skalyar ko'paytmada
			qatnashadi, V esa faqat chiqish proyeksiyasi <code>W_O</code> bilan. Matritsalar
			ko'paytmasi assotsiativ bo'lgani uchun ochish matritsalarini qo'shni matritsalar ichiga
			singdirib yuborish mumkin:
		</p>
		<p><Katex math={ABS_F} displayMode /></p>
		<p>
			Chap tomonda K ni ochish kerak edi. O'ng tomonda esa <code>W^UK</code> allaqachon
			<code>W^Q</code> ichiga singib ketgan, va attention to'g'ridan-to'g'ri latent
			<code>c</code> ustida hisoblanadi. To'liq K va V xotirada <strong>umuman
			yaratilmaydi</strong>. Xuddi shu narsa V va <code>W_O</code> uchun ham amal qiladi.
			Demoda "absorption bilan" rejimini yoqib, o'sha bloklarning so'nishini ko'rish mumkin.
		</p>

		<h3>RoPE bilan to'qnashuv</h3>
		<p>
			Bu chiroyli qurilishda bitta yorig' bor, va uni ochiq aytish kerak.
			<a href="{base}/darslik/rope">RoPE</a> — pozitsiyaga bog'liq burish, ya'ni har pozitsiya
			uchun boshqa matritsa. Agar K ga RoPE qo'llansa, yuqoridagi singdirish buziladi: har
			pozitsiyada boshqa ko'paytma chiqadi va uni oldindan hisoblab qo'yib bo'lmaydi.
		</p>
		<p>
			DeepSeek yechimi — <code>decoupled RoPE</code>. Har head ikkiga bo'linadi. Katta qismi
			latentdan keladi va singdiriladi; kichik qismi (DeepSeek-V2 da o'lchami
			<strong>64</strong>) alohida hisoblanadi, unga RoPE qo'llanadi va u ham cache'da
			saqlanadi — lekin barcha head'lar uchun bittasi, MQA uslubida. Ikkalasi biriktiriladi.
			Ya'ni pozitsiya ma'lumoti alohida, tor kanal orqali o'tadi. Bu nafis emas, lekin
			ishlaydi va cache'ga qo'shadigan narxi kichik.
		</p>

		<table>
			<thead>
				<tr>
					<th>Bir token, bir qavat</th>
					<th>Saqlanadigan element</th>
					<th>MHA ga nisbatan</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th><span class="eski">MHA</span></th>
					<td>2 x 128 x 128 = 32 768</td>
					<td>1x</td>
				</tr>
				<tr>
					<th><span class="eski">GQA-8</span></th>
					<td>2 x 8 x 128 = 2 048</td>
					<td>16 barobar kichik</td>
				</tr>
				<tr>
					<th><span class="yangi">MLA</span></th>
					<td>512 + 64 = 576</td>
					<td>~57 barobar kichik</td>
				</tr>
			</tbody>
		</table>

		<p>
			Va eng muhim farq jadvalda ko'rinmaydi. GQA va MQA cache'ni <em>sifatdan chegirma
			evaziga</em> kichraytiradi. MLA maqolasi esa MLA MHA'dan ham biroz yaxshiroq natija
			berganini ko'rsatgan — ya'ni bu yerda almashuv umuman yo'q. Siqish modelni buzmaydi,
			chunki siqilgan narsa allaqachon ortiqcha edi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="amalda">
		<p>
			MLA <strong>DeepSeek-V2</strong> (236B umumiy parametr, har token uchun 21B faol),
			so'ng <strong>DeepSeek-V3</strong> va <strong>R1</strong> da ishlatilgan. Maqola
			DeepSeek 67B bilan taqqoslaganda KV cache <strong>93.3%</strong> ga kamayganini va
			generatsiya o'tkazuvchanligi <strong>5.76 barobar</strong> oshganini qayd etgan.
			Halol bo'lish uchun aytish kerak: bu ikki turli model orasidagi taqqoslash, faqat
			attention almashtirilgani emas — yuqoridagi jadval esa aynan attention bo'yicha
			toza taqqoslash.
		</p>
		<p>
			Shunga qaramay boshqa laboratoriyalar hali ham asosan GQA'da qolyapti. Sabab sifat emas,
			murakkablik: MLA ni to'g'ri amalga oshirish uchun absorption va decoupled RoPE ni har
			bir inference kutubxonasi alohida qo'llab-quvvatlashi kerak, aks holda u nazariy
			foydani bermaydi. GQA esa bir necha qator kod. Yaxshiroq g'oya har doim ham tezroq
			tarqalmaydi.
		</p>
		<p>
			Shu bilan cache o'lchamini kichraytirish o'qi tugadi. Keyingi ikki modul boshqa
			savollarga o'tadi: 3.4 attention'ni hisoblashda xotira <em>yurishini</em> kamaytiradi,
			3.5 esa kichraygan cache'ni GPU xotirasida qanday joylashtirishni ko'radi — chunki
			joylashtirishning o'zi alohida katta isrof manbai bo'lib chiqadi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="manba">
		<p>
			DeepSeek-AI. <em
				>DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model.</em
			> 2024.
			<a href="https://arxiv.org/abs/2405.04434" target="_blank" rel="noreferrer"
				>arXiv:2405.04434</a
			>
		</p>
		<p>
			DeepSeek-AI. <em>DeepSeek-V3 Technical Report.</em> 2024.
			<a href="https://arxiv.org/abs/2412.19437" target="_blank" rel="noreferrer"
				>arXiv:2412.19437</a
			>
		</p>
	</svelte:fragment>
</Lab>
