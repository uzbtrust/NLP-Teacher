<script lang="ts">
	import { base } from '$app/paths';
	import Lab from '~/components/darslik/Lab.svelte';
	import PagedAttentionDemo from '~/components/darslik/demos/PagedAttentionDemo.svelte';
</script>

<svelte:head>
	<title>3.5 PagedAttention — Darslik | Transformer Explainer</title>
	<meta
		name="description"
		content="KV cache'ni GPU xotirasida qanday joylashtirish kerak: operatsion tizimning sahifalash g'oyasi, blok jadvali, blok ulashish va continuous batching."
	/>
</svelte:head>

<Lab slug="paged-attention">
	<svelte:fragment slot="muammo">
		<p>
			Oldingi uchta modul bitta savolga javob berardi: cache'ni qanday <strong>kichraytirish</strong>
			mumkin. GQA head sonini kamaytirdi, MLA uni latent vektorga siqdi. Bu modul boshqa savol beradi:
			mavjud cache GPU xotirasida <strong>qanday joylashtiriladi</strong>.
		</p>
		<p>
			Sodda yondashuvda har bir so'rov uchun bitta uzluksiz (contiguous) xotira bo'lagi ajratiladi. Va
			bu bo'lak eng yomon holatga mo'ljallanadi &mdash; so'rov e'lon qilgan maksimal mumkin bo'lgan
			uzunlikka. Boshqa iloj yo'q: javob 20 tokenda tugaydimi yoki 2000 tokengacha davom etadimi,
			buni oldindan bilib bo'lmaydi. Bo'lak esa bir marta ajratiladi va o'sib kengaya olmaydi &mdash;
			yonidagi joyni allaqachon boshqa so'rov egallagan.
		</p>
		<p>Natijada uch xil isrof yuzaga keladi:</p>
		<ul>
			<li>
				<strong>Ichki fragmentatsiya</strong> (internal fragmentation): 2048 token uchun joy
				ajratildi, javob 200 tokenda tugadi. Qolgan 1848 tokenlik joy bo'sh turadi, lekin boshqa
				hech kim uni ola olmaydi &mdash; u rasman shu so'rovga tegishli.
			</li>
			<li>
				<strong>Rezervatsiya</strong> (reservation): so'rov oxir-oqibat 2048 tokengacha yetsa ham,
				hozir unga bu joy kerak emas. Kelajakdagi tokenlar uchun band qilingan joy hozirgi
				daqiqada shunchaki ishlatilmaydi.
			</li>
			<li>
				<strong>Tashqi fragmentatsiya</strong> (external fragmentation): so'rovlar turli
				o'lchamdagi bo'laklarni band qilib, tugab, ketadi. Ular orasida kichik teshiklar qoladi.
				Xotirada jami bo'sh joy yetarli bo'lishi mumkin, lekin u bitta uzluksiz bo'lak emas &mdash;
				demak yangi so'rov uchun yaroqsiz.
			</li>
		</ul>
		<p>
			vLLM maqolasi mavjud tizimlarni o'lchab, KV cache uchun ajratilgan xotiraning
			<strong>60&ndash;80% i</strong> aynan shu tarzda isrof bo'lishini ko'rsatdi. Ya'ni siz sotib
			olgan GPU xotirasining katta qismi hech narsa saqlamayapti &mdash; u faqat "ehtimol kerak
			bo'lar" deb turibdi.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="demo">
		<PagedAttentionDemo />
	</svelte:fragment>

	<svelte:fragment slot="ozgarish">
		<p>
			Bu muammo yangi emas. Operatsion tizimlar uni 1960-yillarda hal qilgan: <strong
				>virtual xotira va sahifalash</strong
			> (paging). Jarayon o'zini uzluksiz manzil fazosida deb his qiladi, lekin uning sahifalari
			fizik xotirada istalgan joyda yotishi mumkin. Bog'lovchi bo'g'in &mdash; sahifa jadvali.
		</p>
		<p>PagedAttention aynan shu g'oyani KV cache'ga ko'chiradi:</p>
		<ul>
			<li>
				Xotira qat'iy o'lchamli <strong>bloklarga</strong> bo'linadi. vLLM'da blok odatda
				<strong>16 token</strong> saqlaydi.
			</li>
			<li>
				Har bir so'rovning mantiqiy (logical) bloklari <strong>blok jadvali</strong> (block table)
				orqali fizik bloklarga xaritalanadi.
			</li>
			<li>
				Fizik bloklar xotirada uzluksiz bo'lishi <strong>shart emas</strong> &mdash; ular istalgan
				joyda tura oladi. Attention hisoblanayotganda kernel jadvalga qarab kerakli bloklarni topadi.
			</li>
			<li>
				Yangi token kerak bo'lganda oldindan hech narsa band qilinmaydi: joriy blok to'lgach, faqat
				<strong>bitta</strong> yangi blok ajratiladi.
			</li>
		</ul>

		<table>
			<thead>
				<tr>
					<th><span class="eski">Operatsion tizim (1960-yillar)</span></th>
					<th><span class="yangi">PagedAttention (2023)</span></th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th>jarayon (process)</th>
					<td>so'rov (request)</td>
				</tr>
				<tr>
					<th>sahifa (page)</th>
					<td>blok &mdash; 16 tokenning K va V qiymatlari</td>
				</tr>
				<tr>
					<th>sahifa jadvali (page table)</th>
					<td>blok jadvali (block table)</td>
				</tr>
				<tr>
					<th>virtual xotira</th>
					<td>mantiqiy KV cache &mdash; so'rovga uzluksiz ko'rinadi</td>
				</tr>
				<tr>
					<th>fizik kadr (frame)</th>
					<td>fizik blok &mdash; GPU xotirasida istalgan joyda</td>
				</tr>
			</tbody>
		</table>

		<p>
			Natija: rezervatsiya ham, tashqi fragmentatsiya ham butunlay yo'qoladi. Isrof faqat
			<strong>oxirgi, to'lmagan blok</strong> bilan cheklanadi &mdash; ya'ni eng yomon holatda bitta
			so'rov uchun 15 token. Maqolada o'lchangan qiymat <strong
				>4% dan kam</strong
			>. Yuqoridagi demoda ham xuddi shu naqsh ko'rinadi: uzluksiz rejimda band qilingan joyning
			deyarli uchdan ikkisi bo'sh turadi, paged rejimda esa isrof bir necha foizga tushadi va o'sha
			xotiraga bir necha barobar ko'p so'rov sig'adi.
		</p>

		<h3>Blok ulashish va copy-on-write</h3>
		<p>
			Bloklar jadval orqali ko'rsatilganidan keyin ikkinchi imkoniyat o'z-o'zidan ochiladi: ikki
			so'rovning jadvallari <span class="yangi">bir xil fizik blokka</span> ishora qila oladi. Bloklar
			nusxalanmaydi &mdash; ulashiladi (sharing).
		</p>
		<ul>
			<li>
				<strong>Parallel sampling:</strong> bitta prompt uchun bir nechta turli javob generatsiya
				qilinsa, promptning bloklari bir marta hisoblanadi va hamma javob shoxlari o'shanga ishora
				qiladi.
			</li>
			<li>
				<strong>Beam search:</strong> shoxlar umumiy prefiksni ulashadi. Beam qadam sayin o'zgarib
				tursa ham, jadvalda ko'rsatkichni almashtirish yetarli &mdash; gigabaytlab cache
				ko'chirilmaydi.
			</li>
			<li>
				<strong>Copy-on-write:</strong> ulashilgan blokka yozish kerak bo'lganda o'sha
				<em>bitta</em> blok nusxalanadi, qolganlari ulashilgan holicha qoladi. Bu ham to'g'ridan-to'g'ri
				operatsion tizimdan olingan usul.
			</li>
		</ul>
		<p>
			Xuddi shu mexanizm bugungi <strong>prefix caching</strong> imkoniyatini beradi: bir xil prefiks
			bilan boshlanadigan so'rovlar o'sha prefiksning bloklarini ulashadi.
		</p>

		<h3>Continuous batching</h3>
		<p>
			vLLM tezligining ikkinchi yarmi shu yerda. GPU bir vaqtda bir nechta so'rovni birga hisoblaydi
			&mdash; batch. Savol shundaki, batch qachon yig'iladi va qachon tarqaladi.
		</p>
		<p>
			<span class="eski">Statik batch:</span> 8 ta so'rov birga boshlanadi va hammasi eng uzun javob
			tugagunicha kutadi. Qisqa javoblar allaqachon tayyor bo'lgan, lekin ularning batch'dagi o'rni
			bo'sh turadi &mdash; hech kim u yerga kira olmaydi, chunki batch faqat butunlay tugagach
			tarqaladi.
		</p>
		<p>
			<span class="yangi">Continuous (iteration-level) batching:</span> har bir generatsiya
			<strong>qadamidan</strong> keyin tugagan so'rov batch'dan chiqariladi va navbatdagi so'rov
			darhol uning o'rniga kiritiladi. GPU hech qachon bo'sh o'rin bilan ishlamaydi.
		</p>
		<p>
			PagedAttention buni amalda <strong>mumkin</strong> qiladi. Yangi so'rovni batch'ga qo'shish
			uchun katta uzluksiz bo'lak kerak emas &mdash; xotirada sochilib yotgan bir nechta bo'sh blok
			yetadi. Uzluksiz ajratishda esa yangi so'rov aynan shu yerda to'xtab qolardi: bo'sh joy bor,
			lekin u bitta bo'lak emas. Demoning ikkinchi stendida farq shu: bir xil kenglikdagi vaqt
			oynasida statik batch'ning yarmi bo'sh, continuous batching esa deyarli to'la.
		</p>
		<p>
			vLLM maqolasi bir xil kechikish (latency) darajasida mavjud tizimlarga nisbatan
			<strong>2&ndash;4 barobar yuqori o'tkazuvchanlik</strong> (throughput) ko'rsatgan.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="amalda">
		<p>
			PagedAttention <strong>model emas</strong>. Bu <strong>serving tizimi</strong> &mdash; ya'ni
			modelni ishlatuvchi dasturiy qatlam. Bu jihatdan u
			<a href="{base}/darslik/flash-attention">3.4 dagi FlashAttention</a>
			bilan bir xil oilaga tegishli: model vaznlariga tegmaydi, arxitekturani o'zgartirmaydi, hisob
			natijasini boshqacha qilmaydi. Faqat o'sha hisobni GPU xotirasida boshqacha tashkil qiladi.
		</p>
		<p>
			Amaliy xulosa aniq: uni yoqish <strong>sifatga ta'sir qilmaydi</strong>. Model o'sha-o'sha
			javobni beradi &mdash; siz faqat bir xil kartada ko'proq foydalanuvchini uddalaysiz. Bu
			darslikdagi eng "xavfsiz" almashtirishlardan biri.
		</p>
		<p>
			G'oya <strong>vLLM</strong> loyihasi orqali tarqaldi va bugun amalda standartga aylandi:
			<strong>SGLang</strong>, <strong>TensorRT-LLM</strong> va boshqa serving tizimlari ham
			blokli KV cache boshqaruvini qabul qilgan. Ochiq model ishlatadigan deyarli har qanday
			production servis ostida shu mexanizm turadi.
		</p>
		<p>
			Kundalik ishda uni ko'radigan joy &mdash; <strong>prefix caching</strong>. Agar ilovangiz har
			bir so'rovga bir xil uzun tizim promptini (system prompt) qo'shsa, o'sha prompt bir marta
			hisoblanadi va uning bloklari keyingi barcha so'rovlarga ulashiladi. Ikkinchi so'rovdan
			boshlab uning prefill narxi to'lanmaydi. Shu sababli amaliy maslahat sodda: promptning
			o'zgarmas qismini <strong>boshiga</strong> qo'ying, o'zgaruvchan qismini oxiriga. Cache faqat
			boshdan boshlab mos kelgan qismini qayta ishlatadi.
		</p>
		<p>
			<a href="{base}/darslik/speculative">Keyingi modulda</a> boshqa yo'nalishga o'tamiz: xotirani emas,
			generatsiya qadamlarining sonini kamaytirish.
		</p>
	</svelte:fragment>

	<svelte:fragment slot="manba">
		<p>
			Woosuk Kwon, Zhuohan Li, Siyuan Zhuang va boshqalar.
			<em>Efficient Memory Management for Large Language Model Serving with PagedAttention.</em> SOSP
			2023.
			<a href="https://arxiv.org/abs/2309.06180" target="_blank" rel="noreferrer"
				>arXiv:2309.06180</a
			>
		</p>
		<p>
			Gyeong-In Yu va boshqalar. <em
				>Orca: A Distributed Serving System for Transformer-Based Generative Models.</em
			> OSDI 2022. Iteration-level batching g'oyasi shu ishdan kelgan.
		</p>
	</svelte:fragment>
</Lab>
