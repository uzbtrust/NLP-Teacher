<script lang="ts">
	import { base } from '$app/paths';
	import Lab from '~/components/darslik/Lab.svelte';
	import Katex from '~/utils/Katex.svelte';
	import GqaDemo from '~/components/darslik/demos/GqaDemo.svelte';

	const CACHE_F = String.raw`\text{bayt/token} = 2 \cdot L \cdot n_{kv} \cdot d_h \cdot b`;
</script>

<svelte:head>
	<title>3.2 MQA va GQA — Darslik | Transformer Explainer</title>
	<meta
		name="description"
		content="Har Q head'ga alohida K va V shartmi? MQA va GQA KV cache'ni sifatni yo'qotmasdan qanday kichraytiradi."
	/>
</svelte:head>

<Lab slug="gqa">
	<svelte:fragment slot="muammo">
		<p>
			Oldingi modulda KV cache o'lchamining formulasini chiqargan edik:
		</p>
		<p><Katex math={CACHE_F} displayMode /></p>
		<p>
			Bu formulada to'rtta ko'paytuvchi bor, lekin ularning uchtasi qo'l tegmaydigan:
			qavatlar soni <code>L</code> va head o'lchami <code>d_h</code> arxitekturaning o'zi,
			<code>b</code> esa sonlar formati (u 3.7-modulning mavzusi). Qoladi bittasi —
			<strong>KV head soni</strong>. Savol shu yerdan tug'iladi: har bir Q head'ga rostdan ham
			o'zining alohida K va V juftlari kerakmi?
		</p>
		<p>
			Ikkinchi, kamroq aytiladigan sabab ham bor. Decode fazasi memory-bound edi: har qadamda
			cache'dagi barcha K va V baytlari xotiradan o'qib chiqiladi, lekin ular ustida juda kam
			amal bajariladi. KV head kamaysa, o'qiladigan bayt kamayadi va bir baytga to'g'ri
			keladigan amallar soni — <code>arithmetic intensity</code> (hisob zichligi) — oshadi.
			Ya'ni bu almashtirish faqat joy tejamaydi, decode'ning o'zini ham tezlashtiradi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="demo">
		<GqaDemo />
	</svelte:fragment>

	<svelte:fragment slot="ozgarish">
		<p>
			Javob uchta variant orasida joylashadi. Ularning farqi bitta sonda —
			nechta K/V juftini nechta Q head bo'lishadi.
		</p>

		<table>
			<thead>
				<tr>
					<th></th>
					<th><span class="eski">MHA (2017)</span></th>
					<th><span class="eski">MQA (2019)</span></th>
					<th><span class="yangi">GQA (2023)</span></th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>Q head</th>
					<td>h ta</td>
					<td>h ta</td>
					<td>h ta</td>
				</tr>
				<tr>
					<th>K/V juft</th>
					<td>h ta</td>
					<td>1 ta</td>
					<td>G ta guruh</td>
				</tr>
				<tr>
					<th>Cache nisbati</th>
					<td>1x</td>
					<td>h barobar kichik</td>
					<td>h/G barobar kichik</td>
				</tr>
				<tr>
					<th>Sifat</th>
					<td>eng yuqori</td>
					<td><span class="eski">sezilarli pastroq</span></td>
					<td>MHA ga juda yaqin</td>
				</tr>
			</tbody>
		</table>

		<p>
			MQA — chekka holat. Noam Shazeer 2019-yilda barcha Q head'lar uchun bitta K va bitta V
			qoldirishni taklif qildi. Cache <code>h</code> barobar kichrayadi, lekin sifat pasayadi
			va o'qitish beqarorlashadi. GQA esa oraliqni ochadi: <code>G = h</code> bo'lsa MHA,
			<code>G = 1</code> bo'lsa MQA, orada esa tanlov erkinligi.
		</p>

		<h3>Uptraining — maqolaning ikkinchi hissasi</h3>
		<p>
			GQA maqolasining amaliy jihatdan eng qimmatli qismi ko'pincha e'tibordan chetda qoladi.
			Tayyor MHA checkpoint'ini GQA'ga o'tkazish uchun modelni noldan qayta o'qitish shart
			emas: har guruhning K va V proyeksiyalari o'rtacha qiymatga keltiriladi
			(<code>mean pooling</code>), so'ng model qisqa <code>uptraining</code> bosqichidan
			o'tadi va sifat tiklanadi. Maqolada bu bosqich asl o'qitish hisobining atigi
			<strong>5%</strong> ini talab qilgani ko'rsatilgan. Ya'ni allaqachon o'qitilgan model
			arzon narxda tezroq modelga aylantiriladi.
		</p>

		<h3>Nega aynan 8</h3>
		<p>
			Amalda <code>G = 8</code> deyarli standart bo'lib qoldi. Buning ikki sababi bor. Birinchisi
			sifat: demoda ko'rinib turganidek, 32 dan 8 gacha tushish cache'ni to'rt barobar
			kichraytiradi, lekin sifatga sezilarli zarar qilmaydi — pasayish 8 dan pastda boshlanadi.
			Ikkinchisi apparat: yirik model bir nechta GPU orasida taqsimlanadi
			(<code>tensor parallelism</code>), va 8 ta guruh 8 ta GPU'ga qoldiqsiz bo'linadi —
			har bir GPU o'z guruhini oladi, qo'shimcha almashinuv kerak emas.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="amalda">
		<p>
			GQA bugun deyarli universal: <strong>Llama 2 70B</strong> (64 Q head, 8 guruh),
			<strong>Llama 3</strong> ning barcha o'lchamlari (32 Q head, 8 guruh), Mistral 7B,
			Qwen2, Gemma 2 — hammasi shu sxemada. MQA esa amalda tark etildi: u tejagan qo'shimcha
			joy uchun to'langan sifat narxi juda qimmat bo'lib chiqdi.
		</p>
		<p>
			Bosh sahifadagi <a href="{base}/">GPT-2 modeli</a> esa MHA ishlatadi — u 2019-yilda,
			bu muammo hali dolzarb bo'lmagan paytda chiqqan. O'sha yerda har bir head o'zining
			alohida K va V vektorlariga ega ekanini ko'rishingiz mumkin; GQA aynan o'sha rasmda
			pastki qatorni siqadi.
		</p>
		<p>
			GQA cache'ni head sonini kamaytirib kichraytiradi, lekin bu yo'lning oxiri bor —
			<code>G = 1</code> dan pastga tushib bo'lmaydi. Keyingi modul (3.3 MLA) shu muammoga
			butunlay boshqa tomondan yondashadi: u head sonini umuman o'zgartirmaydi, saqlanadigan
			vektorning o'zini siqadi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="manba">
		<p>
			Noam Shazeer. <em>Fast Transformer Decoding: One Write-Head is All You Need.</em> 2019.
			<a href="https://arxiv.org/abs/1911.02150" target="_blank" rel="noreferrer"
				>arXiv:1911.02150</a
			>
		</p>
		<p>
			Joshua Ainslie va b. <em
				>GQA: Training Generalized Multi-Query Transformer Models from Multi-Head
				Checkpoints.</em
			> EMNLP 2023.
			<a href="https://arxiv.org/abs/2305.13245" target="_blank" rel="noreferrer"
				>arXiv:2305.13245</a
			>
		</p>
	</svelte:fragment>
</Lab>
