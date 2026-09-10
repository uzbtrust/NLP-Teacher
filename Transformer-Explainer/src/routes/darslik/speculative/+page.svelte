<script lang="ts">
	import { base } from '$app/paths';
	import Lab from '~/components/darslik/Lab.svelte';
	import Katex from '~/utils/Katex.svelte';
	import SpeculativeDemo from '~/components/darslik/demos/SpeculativeDemo.svelte';

	const QABUL_F = String.raw`\min\!\left(1,\; \frac{p(x)}{q(x)}\right)`;
	const TUZAT_F = String.raw`p'(x) \;=\; \mathrm{norm}\big(\max(0,\; p(x) - q(x))\big)`;
	const KUT_F = String.raw`\mathbb{E}[\text{token/qadam}] \;=\; \frac{1 - \alpha^{\gamma+1}}{1 - \alpha}`;
	const CHEGARA_F = String.raw`1 \;\le\; \text{token/qadam} \;\le\; \gamma + 1`;
</script>

<svelte:head>
	<title>3.6 Speculative decoding — Darslik | Transformer Explainer</title>
	<meta
		name="description"
		content="Kichik draft model bir nechta tokenni taxmin qiladi, katta target model ularni bitta forward pass da tekshiradi. Chiqish taqsimoti o'zgarmaydi, qadamlar soni kamayadi."
	/>
</svelte:head>

<Lab slug="speculative">
	<svelte:fragment slot="muammo">
		<p>
			3.1 da ko'rgan edik: decode fazasi <strong>memory-bound</strong>. Bitta token generatsiya qilish
			uchun modelning barcha vaznlari GPU xotirasidan o'qib chiqiladi, lekin ular ustida juda kam amal
			bajariladi. Ya'ni bitta token ishlab chiqarish narxi — asosan vaznlarni o'qish narxi.
		</p>
		<p>
			Bundan g'alati xulosa chiqadi. Vaznlar bitta token uchun ham, o'nta token uchun ham
			<strong>bir marta</strong> o'qiladi: forward pass ga bir nechta pozitsiyani birdan berish narxni
			deyarli oshirmaydi. Demak agar biz bir yo'la bir nechta tokenni <em>tekshira</em> olsak, ular
			deyarli tekinga tushadi.
		</p>
		<p>
			Muammo shundaki, tekshirish uchun tokenlar oldindan ma'lum bo'lishi kerak. Generatsiya esa
			ketma-ket: keyingi token nima bo'lishini bilmasak, uni tekshirib ham bo'lmaydi. Bo'sh hisob
			quvvati bor, lekin unga beradigan ish yo'q — chunki ish o'z navbatini kutib turibdi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="demo">
		<SpeculativeDemo />
	</svelte:fragment>

	<svelte:fragment slot="ozgarish">
		<p>
			Yechim to'siqni aylanib o'tadi: agar keyingi tokenlarni bilmasak, ularni
			<strong>taxmin qilamiz</strong>. Ikki model ishlaydi:
		</p>
		<ul>
			<li>
				<strong>draft (qoralama) model</strong> — kichik va tez. U ketma-ket
				<code>gamma</code> ta token taxmin qiladi (masalan 4 ta). Kichik bo'lgani uchun bu ketma-ket
				qadamlar arzon.
			</li>
			<li>
				<strong>target (asosiy) model</strong> — katta. U taxmin qilingan
				<code>gamma</code> ta tokenni va asl kontekstni <span class="yangi">bitta forward pass</span>
				da tekshiradi: tokenlar endi ma'lum, demak ularni parallel hisoblash mumkin — xuddi prefill
				kabi.
			</li>
		</ul>
		<p>
			Keyin chapdan o'ngga solishtiriladi. Mos kelgan tokenlar qabul qilinadi. Birinchi mos kelmagan
			joyda taxmin uziladi va o'sha o'ringa target modelning o'z taqsimotidan olingan bitta to'g'ri
			token qo'yiladi, undan keyingi taxminlar tashlab yuboriladi. Shuning uchun har qadamda
			<strong>kamida 1 ta</strong>, ko'pi bilan <code>gamma + 1</code> ta token chiqadi:
		</p>
		<p><Katex math={CHEGARA_F} displayMode={true} /></p>
		<p>
			Bir marta ham foyda bo'lmasa ham, zarar yo'q: eng yomon holatda oddiy decoding bilan bir xil
			tezlikda ishlaymiz, ustiga draft modelning arzon qadamlari qo'shiladi.
		</p>

		<h3>Chiqish taqsimoti aynan o'zgarmaydi</h3>
		<p>
			Bu yerda eng muhim nuqta. Qabul qilish oddiy "teng bo'lsa oladi" qoidasi emas —
			<strong>rejection sampling</strong> ishlatiladi. Token draft taqsimoti <code>q(x)</code> dan
			olingan bo'lsa, u quyidagi ehtimol bilan qabul qilinadi:
		</p>
		<p><Katex math={QABUL_F} displayMode={true} /></p>
		<p>
			Agar rad etilsa, yangi token oddiygina target ning <code>p(x)</code> idan emas, balki
			<em>tuzatilgan</em> taqsimotdan tanlanadi:
		</p>
		<p><Katex math={TUZAT_F} displayMode={true} /></p>
		<p>
			Bu ikki qoidaning birgalikdagi natijasi: chiqish taqsimoti target modelning
			<strong>o'z taqsimoti bilan aynan bir xil</strong> bo'ladi. Ya'ni speculative decoding
			approksimatsiya emas — sifat bir zarra ham pasaymaydi, javob "deyarli o'sha" emas, balki
			statistik ma'noda o'sha. Bu FlashAttention (3.4) bilan bir xil xususiyat: tezlik tekin keladi,
			evaziga hech nima berilmaydi.
		</p>

		<h3>Qancha yutamiz</h3>
		<p>
			Hammasi bitta songa bog'liq: <code>alpha</code> — qabul qilish darajasi, ya'ni draft va target
			qanchalik kelishishi. Bir qadamda kutilayotgan tokenlar soni:
		</p>
		<p><Katex math={KUT_F} displayMode={true} /></p>
		<p>
			Formuladan ikki narsa ko'rinadi. Birinchisi: <code>gamma</code> katta bo'lsa foyda ko'proq.
			Ikkinchisi: <code>alpha</code> past bo'lsa egri chiziq tez tekislanadi va
			<code>gamma</code> ni oshirishdan foyda qolmaydi, draft modelning qo'shimcha qadamlari esa
			baribir to'lanadi. Shuning uchun optimal <code>gamma</code> bor — uni yuqoridagi ikkinchi
			stendda o'zingiz topib ko'rishingiz mumkin.
		</p>
		<p>
			Maqolalarda <strong>2-3 barobar tezlashuv</strong> qayd etilgan — masalan T5-XXL da taxminan 2
			barobar, chiqish o'zgarmagan holda.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="amalda">
		<p>
			Asosiy g'oya bir xil qoladi — "taxmin qil, bir yo'la tekshir" — lekin taxminni kim qilishi
			bo'yicha bir nechta variant paydo bo'ldi:
		</p>

		<table>
			<thead>
				<tr>
					<th></th>
					<th>G'oyasi</th>
					<th>Qachon qulay</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>Medusa</th>
					<td>
						Alohida draft model o'rniga asosiy modelga bir nechta qo'shimcha
						<code>head</code> (bosh) ulanadi, har biri keyingi pozitsiyalardan birini taxmin qiladi.
					</td>
					<td>Ikkinchi modelni boqish, saqlash va yuklash shart emas.</td>
				</tr>
				<tr>
					<th>EAGLE</th>
					<td>
						Taxminni token darajasida emas, <code>feature</code> (xususiyat) darajasida qiladi.
					</td>
					<td>Qabul qilish darajasi yuqoriroq chiqadi, demak <code>alpha</code> yaxshilanadi.</td>
				</tr>
				<tr>
					<th>prompt lookup / n-gram</th>
					<td>
						Draft model umuman yo'q. Taxmin kontekstning o'zidan qidirib olinadi: shu matnda
						allaqachon uchragan davomlar takliflar sifatida beriladi.
					</td>
					<td>
						Kod va hujjat bilan ishlashda — matn ko'p takrorlanadigan joyda kutilmaganda yaxshi
						ishlaydi.
					</td>
				</tr>
			</tbody>
		</table>

		<p>
			Amalda uni alohida yozib o'tirish shart emas. HuggingFace <code>transformers</code> da
			<code>generate</code> ga <code>assistant_model</code> berilsa yetadi;
			<strong>vLLM</strong> va <strong>TensorRT-LLM</strong> da ham speculative decoding tayyor holda
			bor, n-gram variantini esa umuman qo'shimcha modelsiz yoqish mumkin.
		</p>

		<h3>Halol cheklov</h3>
		<p>
			Butun foyda bitta shartga tayanadi: GPU da <strong>bo'sh hisob quvvati bor</strong>. Taxmin
			qilingan tokenlarni tekshirish tekinga tushishining sababi shu — decode fazasida hisoblash
			birliklari baribir bo'sh turgan edi.
		</p>
		<p>
			Server yuqori yuk ostida katta <code>batch</code> bilan ishlayotgan bo'lsa, bu shart buziladi:
			GPU allaqachon band, bo'sh quvvat yo'q va tekshirishning har bir qo'shimcha pozitsiyasi endi
			haqiqiy narxga ega bo'ladi. Bunday holatda speculative decoding ning foydasi keskin kamayadi,
			ba'zan umuman qolmaydi. Shuning uchun u ko'proq <span class="yangi">kichik batch va past
			kechikish</span> talab qilinadigan holatlarda qo'llanadi: bitta foydalanuvchi, interaktiv chat,
			lokal ishlaydigan model. Katta batch bilan xizmat qiladigan serverda esa 3.5 dagi
			<a href="{base}/darslik/paged-attention">PagedAttention</a> kabi o'tkazuvchanlikka ishlaydigan
			usullar ko'proq foyda beradi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="manba">
		<p>
			Yaniv Leviathan, Matan Kalman, Yossi Matias.
			<em>Fast Inference from Transformers via Speculative Decoding.</em> ICML 2023.
			<a href="https://arxiv.org/abs/2211.17192" target="_blank" rel="noreferrer">arXiv:2211.17192</a>
		</p>
		<p>
			Charlie Chen va b. <em>Accelerating Large Language Model Decoding with Speculative Sampling.</em>
			2023.
			<a href="https://arxiv.org/abs/2302.01318" target="_blank" rel="noreferrer">arXiv:2302.01318</a>
		</p>
		<p>
			Tianle Cai va b.
			<em>Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads.</em> 2024.
			<a href="https://arxiv.org/abs/2401.10774" target="_blank" rel="noreferrer">arXiv:2401.10774</a>
		</p>
		<p>
			Yuhui Li va b.
			<em>EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty.</em> ICML 2024.
			<a href="https://arxiv.org/abs/2401.15077" target="_blank" rel="noreferrer">arXiv:2401.15077</a>
		</p>
	</svelte:fragment>
</Lab>
