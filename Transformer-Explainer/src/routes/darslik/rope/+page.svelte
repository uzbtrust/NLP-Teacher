<script lang="ts">
	import { base } from '$app/paths';
	import Lab from '~/components/darslik/Lab.svelte';
	import RopeDemo from '~/components/darslik/demos/RopeDemo.svelte';
</script>

<svelte:head>
	<title>2.4 RoPE — Darslik | Transformer Explainer</title>
	<meta
		name="description"
		content="Pozitsiyani qo'shish emas, burish: RoPE nima uchun nisbiy masofani to'g'ridan-to'g'ri kodlaydi va kontekstni cho'zish uchun poydevor bo'lib qoldi."
	/>
</svelte:head>

<Lab slug="rope">
	<svelte:fragment slot="muammo">
		<p>
			Attention o'z-o'zidan pozitsiyani ko'rmaydi. Tokenlarni joyini almashtirsangiz, natija ham
			shunchaki o'sha tartibda almashadi — model uchun "olma itni yedi" va "itni olma yedi"
			ayirmasi yo'q. Demak, o'rin haqidagi ma'lumot qo'lda qo'shilishi kerak.
		</p>
		<p>
			GPT-2 buni eng sodda yo'l bilan qiladi: 1024 ta pozitsiya uchun 1024 ta vektordan iborat
			jadval o'rgatiladi va token embedding'iga <strong>qo'shiladi</strong>. Ishlaydi, lekin uchta
			muammosi bor.
		</p>
		<ul>
			<li>
				<strong>Uzunlik devori.</strong> Jadval 1024 ta qatordan iborat. 1025-token uchun qo'shadigan
				vektor umuman mavjud emas — model uzunroq matnni ko'ra olmaydi, sekinlashmaydi yoki
				yomonlashmaydi, shunchaki ishlamaydi.
			</li>
			<li>
				<strong>Masofa yashirin.</strong> "5-pozitsiya" va "6-pozitsiya" vektorlari qo'shni ekanini
				hech kim modelga aytmaydi. U buni ma'lumotdan o'zi taxmin qilib olishi kerak.
			</li>
			<li>
				<strong>Noto'g'ri savolga javob.</strong> Attention'ga aslida kerak bo'lgani mutlaq o'rin
				emas — ikki token orasidagi <em>masofa</em>. "Bu so'z 512-o'rinda" degan ma'lumotdan ko'ra
				"bu so'z ikkinchisidan uch qadam oldin" degani foydaliroq.
			</li>
		</ul>
	</svelte:fragment>

	<svelte:fragment slot="demo">
		<RopeDemo />
	</svelte:fragment>

	<svelte:fragment slot="ozgarish">
		<p>
			RoPE pozitsiyani embedding'ga qo'shmaydi. U <strong>Q va K vektorlarini buradi</strong>:
			vektor juft-juft o'lchamlarga bo'linadi va har bir juft o'zining tekisligida
			<code>pozitsiya &times; theta</code> burchagiga buriladi. Skalyar ko'paytma esa burchaklar
			ayirmasiga bog'liq bo'lgani uchun, natijada attention faqat <code>m &minus; n</code> ni
			ko'radi.
		</p>

		<table>
			<thead>
				<tr>
					<th></th>
					<th><span class="eski">Learned absolute (GPT-2)</span></th>
					<th><span class="yangi">RoPE (2021)</span></th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>Qayerda qo'llanadi</th>
					<td><span class="eski">embedding'ga, faqat kirishda</span></td>
					<td><span class="yangi">Q va K ga, har bir blokda</span></td>
				</tr>
				<tr>
					<th>Amal</th>
					<td><span class="eski">qo'shish</span></td>
					<td><span class="yangi">burish (rotatsiya)</span></td>
				</tr>
				<tr>
					<th>Parametrlar</th>
					<td><span class="eski">1024 &times; 768 ta o'rgatiladigan son</span></td>
					<td><span class="yangi">nol — burchaklar formuladan</span></td>
				</tr>
				<tr>
					<th>Nisbiy masofa</th>
					<td><span class="eski">bilvosita, o'rganib olinadi</span></td>
					<td><span class="yangi">to'g'ridan-to'g'ri, kafolatlangan</span></td>
				</tr>
				<tr>
					<th>Vektor normasi</th>
					<td><span class="eski">o'zgaradi</span></td>
					<td><span class="yangi">o'zgarmaydi</span></td>
				</tr>
				<tr>
					<th>Uzunlikni cho'zish</th>
					<td><span class="eski">imkonsiz</span></td>
					<td><span class="yangi">mumkin (PI, NTK, YaRN)</span></td>
				</tr>
			</tbody>
		</table>

		<p>
			Ikkita detal e'tibordan chetda qolmasin. Birinchisi: RoPE <strong>V ga qo'llanmaydi</strong> —
			faqat Q va K ga. Chunki pozitsiya kerak bo'lgan joy — "kim kimga qaraydi" degan hisob, ya'ni
			ballar; tashiladigan mazmunga (V) pozitsiya aralashmasligi kerak. Ikkinchisi: burish
			<strong>har bir blokda qaytadan</strong> qo'llanadi, faqat kirishda bir marta emas.
		</p>
		<p>
			Uchinchi, amaliy detal: burilgan K keshga o'sha holida yoziladi va keyingi qadamlarda qayta
			hisoblanmaydi. Ya'ni RoPE <strong>KV cache bilan tabiiy mos tushadi</strong> — bu 03-qismda
			ko'riladi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="amalda">
		<p>
			<strong>RoPE</strong> — Llama 1/2/3, Mistral, Qwen, DeepSeek, Gemma, GPT-NeoX, Phi. Bugungi
			deyarli hamma ochiq model. <strong>Learned absolute</strong> — GPT-2 (bosh sahifadagi model),
			GPT-3, BERT. <strong>Sinusoidal</strong> — 2017-yilgi asl Transformer: formuladan hisoblanadi,
			lekin baribir qo'shiladi. <strong>ALiBi</strong> — muqobil yondashuv: pozitsiya o'rniga
			attention ballaridan masofaga mutanosib jarima ayiriladi.
		</p>
		<p>
			Bosh sahifadagi <a href="{base}/">jonli GPT-2 modelida</a> embedding qadamini ochsangiz,
			token vektoriga pozitsiya vektori qo'shilishini o'z ko'zingiz bilan ko'rasiz — bu darslikda
			almashtirilayotgan aynan o'sha qadam.
		</p>
		<p>
			RoPE bu qismdagi eng ta'sirli almashtirish, chunki u <strong>keyingi bosqichning
			poydevori</strong>. Kontekstni cho'zish usullari — Position Interpolation, NTK-aware scaling,
			YaRN — hammasi RoPE burchagini o'zgartirish orqali ishlaydi. Ular 05-qismda ko'riladi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="manba">
		<p>
			Jianlin Su va b., <a href="https://arxiv.org/abs/2104.09864" target="_blank" rel="noreferrer"
				>RoFormer: Enhanced Transformer with Rotary Position Embedding</a
			>, 2021, arXiv:2104.09864.
		</p>
		<p>
			Ashish Vaswani va b., <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noreferrer"
				>Attention Is All You Need</a
			>, 2017, arXiv:1706.03762 — sinusoidal pozitsiya.
		</p>
		<p>
			Ofir Press va b., <a href="https://arxiv.org/abs/2108.12409" target="_blank" rel="noreferrer"
				>Train Short, Test Long: Attention with Linear Biases (ALiBi)</a
			>, 2021, arXiv:2108.12409.
		</p>
	</svelte:fragment>
</Lab>
