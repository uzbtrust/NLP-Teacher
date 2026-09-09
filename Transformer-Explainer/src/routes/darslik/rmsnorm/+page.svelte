<script lang="ts">
	import { base } from '$app/paths';
	import Lab from '~/components/darslik/Lab.svelte';
	import Katex from '~/utils/Katex.svelte';
	import RmsNormDemo from '~/components/darslik/demos/RmsNormDemo.svelte';

	const LN_F = String.raw`\frac{x_i - \mu}{\sigma}\,\gamma_i + \beta_i`;
	const RMS_F = String.raw`\frac{x_i}{\mathrm{RMS}(x)}\,\gamma_i`;
</script>

<svelte:head>
	<title>2.1 RMSNorm — Darslik | Transformer Explainer</title>
	<meta
		name="description"
		content="LayerNorm'dan o'rtachani olib tashlash: RMSNorm nima uchun deyarli bir xil natija beradi va nega bugungi modellarda standart bo'lib qoldi."
	/>
</svelte:head>

<Lab slug="rmsnorm">
	<svelte:fragment slot="muammo">
		<p>
			LayerNorm blokdagi eng arzon amallardan biriga o'xshaydi: vektorni o'rtachasiga qarab
			markazlashtir, standart og'ishiga bo'l, tamom. Lekin u <strong>har bir token uchun, har bir
			blokda, ikki marta</strong> chaqiriladi — attention atrofida bir marta, FFN atrofida yana bir marta.
		</p>
		<p>
			Va har chaqiruvda vektor bo'ylab <em>ikki marta</em> o'tish kerak. Avval o'rtachani (mean)
			topasan, keyin o'sha o'rtachadan foydalanib dispersiyani hisoblaysan. Ikkinchi o'tish
			birinchisi tugamaguncha boshlana olmaydi — bu ketma-ketlik GPU uchun eng yoqimsiz naqsh.
		</p>
		<p>
			2019-yilda Biao Zhang va Rico Sennrich sodda savol berishdi: o'rtachani ayirish
			(<code>re-centering</code>) haqiqatan kerakmi, yoki butun foyda faqat masshtabni tenglashtirishdan
			(<code>re-scaling</code>) kelayaptimi? Ular o'rtachani umuman hisoblamay ko'rishdi. Javob:
			foyda ikkinchisidan kelayotgan ekan.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="demo">
		<RmsNormDemo />
	</svelte:fragment>

	<svelte:fragment slot="ozgarish">
		<p>
			RMSNorm o'rtachani hisoblamaydi va uni ayirmaydi. Vektorni faqat o'zining o'rtacha kattaligiga
			— root mean square qiymatiga — bo'ladi. Shift parametri <code>beta</code> ham keraksiz bo'lib
			qoladi: markazlashtirish yo'q ekan, markazni qaytadan surish uchun parametr ham kerak emas.
		</p>

		<table>
			<thead>
				<tr>
					<th></th>
					<th><span class="eski">LayerNorm (2016)</span></th>
					<th><span class="yangi">RMSNorm (2019)</span></th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>Formula</th>
					<td><Katex math={LN_F} /></td>
					<td><Katex math={RMS_F} /></td>
				</tr>
				<tr>
					<th>Parametrlar</th>
					<td><code>gamma</code> va <code>beta</code> — 2n ta</td>
					<td><code>gamma</code> — n ta</td>
				</tr>
				<tr>
					<th>Vektor bo'ylab o'tish</th>
					<td>2 ta: avval o'rtacha, keyin dispersiya</td>
					<td>1 ta: kvadratlar yig'indisi</td>
				</tr>
				<tr>
					<th>re-scaling invariance</th>
					<td>bor</td>
					<td>bor</td>
				</tr>
				<tr>
					<th>re-centering invariance</th>
					<td>bor</td>
					<td><span class="eski">yo'q</span></td>
				</tr>
			</tbody>
		</table>

		<p>
			Ikkinchi qatordagi farq — asosiysi. Yuqoridagi demoda <code>+c</code> slayderini surganingizda
			RMSNorm chiqishi haqiqatan o'zgaradi: u re-centering invariance'ni yo'qotgan. Muallif
			tajribalarida bu yo'qotish sifatga sezilarli zarar qilmadi — mashina tarjimasi, tilni
			modellashtirish va boshqa vazifalarda natijalar LayerNorm bilan taqqoslanadigan darajada
			qoldi.
		</p>

		<p>
			Zhang va Sennrich o'z tajribalarida <strong>ishlash vaqtining 7–64% qisqarishini</strong> qayd
			etgan — aniq raqam modelga va vazifaga qarab keskin farq qiladi, shuning uchun uni bitta
			ko'rsatkich sifatida olish noto'g'ri bo'ladi. Bitta normalizatsiya chaqiruvida tejamkorlik
			kichik. Lekin u <code>32 blok × 2 norm × har bir token × har bir qadam</code> bo'ylab
			takrorlanadi, va o'qitishning har bir qadamida qaytadan hisoblanadi. Shu ko'paytmadan keyin
			kichik farq ko'rinadigan bo'lib qoladi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="amalda">
		<p>
			Bugungi ochiq modellarda RMSNorm amalda standart: <strong>Llama 1, 2, 3</strong>, Mistral,
			Qwen, Gemma, DeepSeek, OLMo — hammasi RMSNorm ishlatadi. Yangi arxitektura e'lon qilinganda
			normalizatsiya tanlovi endi deyarli muhokama qilinmaydi.
		</p>
		<p>
			LayerNorm esa eski avlodda qoldi: 2017-yilgi asl Transformer, BERT va
			<strong>GPT-2</strong> — ya'ni bu saytning bosh sahifasidagi model. Uning
			<a href="{base}/">jonli modelda</a> LayerNorm qadamini ochib, vektor qanday markazlashtirilib,
			keyin bo'linishini o'z ko'zingiz bilan ko'rishingiz mumkin. Bu darslikda ko'rayotgan
			almashtirishlar aynan o'sha blokdan boshlangan.
		</p>
		<p>
			Amaliy jihat: RMSNorm'ga o'tish arxitekturaning boshqa hech nimasini o'zgartirmaydi. Bu
			darslikdagi to'rtta almashtirishning eng kichigi va eng xavfsizi — shuning uchun u birinchi
			bo'lib keladi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="manba">
		<p>
			Biao Zhang, Rico Sennrich. <em>Root Mean Square Layer Normalization.</em> NeurIPS 2019.
			<a href="https://arxiv.org/abs/1910.07467" target="_blank" rel="noreferrer"
				>arXiv:1910.07467</a
			>
		</p>
		<p>
			Jimmy Lei Ba, Jamie Ryan Kiros, Geoffrey E. Hinton. <em>Layer Normalization.</em> 2016.
			<a href="https://arxiv.org/abs/1607.06450" target="_blank" rel="noreferrer"
				>arXiv:1607.06450</a
			>
		</p>
	</svelte:fragment>
</Lab>
