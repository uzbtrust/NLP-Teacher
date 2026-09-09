<script lang="ts">
	import { base } from '$app/paths';
	import Lab from '~/components/darslik/Lab.svelte';
	import BlokQuruvchi from '~/components/darslik/demos/BlokQuruvchi.svelte';
</script>

<svelte:head>
	<title>2.5 Blok konstruktori — Darslik | Transformer Explainer</title>
	<meta
		name="description"
		content="To'rtta almashtirishni birga yig'ing: GPT-2 blokidan Llama 3 blokiga qanday o'tilgani bitta ekranda."
	/>
</svelte:head>

<Lab slug="blok">
	<svelte:fragment slot="muammo">
		<p>
			Oldingi to'rtta modulda to'rtta alohida almashtirishni ko'rdik: normalizatsiya turi, uning
			o'rni, pozitsiya usuli va FFN ichidagi aktivatsiya. Lekin hech bir model ularni birma-bir
			qo'llamaydi. Yangi model chiqqanda u bu tanlovlarning <strong>hammasini birdan</strong>
			oladi — chunki ular allaqachon amalda sinovdan o'tgan.
		</p>
		<p>
			Shuning uchun bu sahifada alohida modul yo'q. Bu yerda to'rtta kalitni o'zingiz burab,
			GPT-2 blokidan Llama 3 blokiga qadam-baqadam o'tasiz va har bir qadamda diagramma nima uchun
			o'zgarayotganini ko'rasiz.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="demo">
		<BlokQuruvchi />
	</svelte:fragment>

	<svelte:fragment slot="ozgarish">
		<p>
			Quyidagi jadval — 02-qismning yakuniy xulosasi. Chap ustun bosh sahifadagi jonli model, o'ng
			ustun bugungi standart.
		</p>

		<table>
			<thead>
				<tr>
					<th>Qism</th>
					<th><span class="eski">GPT-2 (2019)</span></th>
					<th><span class="yangi">Llama 3 (2024)</span></th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>Normalizatsiya</th>
					<td><span class="eski">LayerNorm</span></td>
					<td><span class="yangi">RMSNorm</span></td>
				</tr>
				<tr>
					<th>Norm o'rni</th>
					<td>Pre-LN</td>
					<td>Pre-LN <em>(o'zgarmadi)</em></td>
				</tr>
				<tr>
					<th>Pozitsiya</th>
					<td><span class="eski">Learned absolute</span></td>
					<td><span class="yangi">RoPE</span></td>
				</tr>
				<tr>
					<th>FFN aktivatsiyasi</th>
					<td><span class="eski">GELU</span></td>
					<td><span class="yangi">SwiGLU</span></td>
				</tr>
				<tr>
					<th>FFN matritsalari</th>
					<td><span class="eski">2 ta (4d)</span></td>
					<td><span class="yangi">3 ta (~2.67d)</span></td>
				</tr>
				<tr>
					<th>Bias</th>
					<td><span class="eski">bor</span></td>
					<td><span class="yangi">yo'q</span></td>
				</tr>
				<tr>
					<th>Attention</th>
					<td><span class="eski">MHA</span></td>
					<td><span class="yangi">GQA</span> <em>(03-qism)</em></td>
				</tr>
				<tr>
					<th>Dropout</th>
					<td><span class="eski">bor</span></td>
					<td><span class="yangi">yo'q</span></td>
				</tr>
				<tr>
					<th>Yakuniy norm</th>
					<td><span class="eski">LayerNorm</span></td>
					<td><span class="yangi">RMSNorm</span></td>
				</tr>
			</tbody>
		</table>

		<h3>Bias nega olib tashlandi</h3>
		<p>
			Har bir chiziqli qatlamdan keyin (yoki oldin) baribir normalizatsiya turadi, u esa o'rtacha
			va masshtabni o'zi boshqaradi. Shu sababli chiziqli qatlamdagi <code>+b</code> hadi deyarli
			ortiqcha bo'lib qoladi — uning ta'sirini keyingi norm baribir yuvib yuboradi. Olib tashlansa
			parametr, xotira va bitta qo'shish amali tejaladi; sifat esa o'zgarmaydi, ba'zi tajribalarda
			hatto barqarorroq bo'ladi.
		</p>

		<h3>Weight tying va QK-Norm</h3>
		<p>
			<strong>Weight tying</strong> — kirish embedding matritsasi bilan chiqish (unembedding)
			matritsasini bo'lishish. GPT-2'da bu bor va parametrni sezilarli tejaydi. Katta modellarda
			esa ko'pincha voz kechilgan: lug'at 128 mingga yetganda ikkita alohida matritsa yaxshiroq
			ishlaydi, chunki "so'zni tanish" va "so'zni chiqarish" bir xil vazifa emas.
		</p>
		<p>
			<strong>QK-Norm</strong> — Q va K vektorlariga attention hisobidan oldin qo'shimcha norm
			qo'llash. Bu attention ballari juda katta bo'lib ketishining oldini oladi va katta modellarni
			o'qitishda barqarorlik beradi. Gemma 2, OLMo 2 kabi yangi modellarda uchraydi; 2019-yilgi
			GPT-2'da yo'q.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="amalda">
		<p>
			Bu besh sozlama bugun amalda standart: yangi ochiq model chiqsa, katta ehtimol bilan u
			RMSNorm + Pre-LN + RoPE + SwiGLU + bias'siz kombinatsiyasi bilan keladi. Ular endi
			"tanlov" emas, boshlang'ich nuqta.
		</p>
		<p>
			Va bu yerda 02-qismning asosiy xulosasi bor: <strong>2019-dan 2024-gacha transformer bloki
			umumiy shaklini o'zgartirmadi.</strong> Attention, FFN, residual — hammasi o'sha joyda, o'sha
			tartibda. O'zgargani har bir qismning ichki tanlovi bo'ldi.
		</p>
		<p>
			Keyingi qismlarda esa o'zgarish shaklga tegadi. 03-qismda attention'ning o'zi qayta yoziladi:
			KV cache paydo bo'ladi, keyin uni siqish uchun MQA va GQA keladi. So'ngra FFN bitta blok
			bo'lishdan to'xtaydi va o'nlab expert'ga bo'linadi — MoE. Shu yerdan boshlab arxitektura
			chizmasi haqiqatan boshqacha ko'rinadi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="manba">
		<p>
			Biao Zhang, Rico Sennrich, <a href="https://arxiv.org/abs/1910.07467" target="_blank" rel="noreferrer"
				>Root Mean Square Layer Normalization</a
			>, 2019, arXiv:1910.07467.
		</p>
		<p>
			Ruibin Xiong va b., <a href="https://arxiv.org/abs/2002.04745" target="_blank" rel="noreferrer"
				>On Layer Normalization in the Transformer Architecture</a
			>, 2020, arXiv:2002.04745.
		</p>
		<p>
			Noam Shazeer, <a href="https://arxiv.org/abs/2002.05202" target="_blank" rel="noreferrer"
				>GLU Variants Improve Transformer</a
			>, 2020, arXiv:2002.05202.
		</p>
		<p>
			Jianlin Su va b., <a href="https://arxiv.org/abs/2104.09864" target="_blank" rel="noreferrer"
				>RoFormer: Enhanced Transformer with Rotary Position Embedding</a
			>, 2021, arXiv:2104.09864.
		</p>
		<p>
			Hugo Touvron va b., <a href="https://arxiv.org/abs/2302.13971" target="_blank" rel="noreferrer"
				>LLaMA: Open and Efficient Foundation Language Models</a
			>, 2023, arXiv:2302.13971.
		</p>
		<p><a href="{base}/darslik">&larr; Modullar ro'yxatiga qaytish</a></p>
	</svelte:fragment>
</Lab>
