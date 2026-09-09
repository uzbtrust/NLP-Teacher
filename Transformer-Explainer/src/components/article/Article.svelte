<script>
	import tailwindConfig from '../../../tailwind.config';
	import resolveConfig from 'tailwindcss/resolveConfig';
	import Katex from '~/utils/Katex.svelte';
</script>

<div id="description">
	<div class="article-section" data-click="article-intro">
		<h1>Transformer nima?</h1>

		<p>
			Transformer — sun'iy intellektga bo'lgan yondashuvni tubdan o'zgartirgan neyron tarmoq
			(neural network) arxitekturasi. U birinchi marta 2017-yilda
			<a
				href="https://dl.acm.org/doi/10.5555/3295222.3295349"
				title="ACM Digital Library"
				target="_blank">"Attention is All You Need"</a
			>
			nomli mashhur maqolada taqdim etilgan va o'shandan beri chuqur o'rganish (deep learning) modellari
			uchun asosiy arxitekturaga aylandi. OpenAI ning <strong>GPT</strong>, Meta ning
			<strong>Llama</strong>
			va Google ning <strong>Gemini</strong> kabi matn generatsiya qiluvchi modellari aynan shu arxitekturaga
			asoslanadi. Matndan tashqari Transformer
			<a
				href="https://huggingface.co/learn/audio-course/en/chapter3/introduction"
				title="Hugging Face"
				target="_blank">audio generatsiya</a
			>,
			<a
				href="https://huggingface.co/learn/computer-vision-course/unit3/vision-transformers/vision-transformers-for-image-classification"
				title="Hugging Face"
				target="_blank">tasvirni tanish</a
			>,
			<a href="https://elifesciences.org/articles/82819" title="eLife"
				>oqsil strukturasini bashorat qilish</a
			>, hatto
			<a
				href="https://www.deeplearning.ai/the-batch/reinforcement-learning-plus-transformers-equals-efficiency/"
				title="Deep Learning AI"
				target="_blank">o'yin o'ynash</a
			> sohalarida ham qo'llaniladi — bu uning naqadar universal ekanini ko'rsatadi.
		</p>
		<p>
			Mohiyatan, matn generatsiya qiluvchi Transformer modellari <strong>keyingi tokenni bashorat
			qilish</strong> (next-token prediction) tamoyili asosida ishlaydi: foydalanuvchi bergan matn
			(prompt) asosida
			<em>eng ehtimolli keyingi token (so'z yoki so'z bo'lagi)</em> qaysi bo'ladi? Transformer'ning
			asosiy kashfiyoti va kuchi — self-attention mexanizmida. Aynan shu mexanizm modelga butun
			ketma-ketlikni birdaniga qayta ishlash va uzoq masofadagi bog'liqliklarni oldingi
			arxitekturalarga qaraganda ancha samarali ushlab olish imkonini beradi.
		</p>
		<p>
			GPT-2 oilasidagi modellar — matn generatsiya qiluvchi Transformer'ning yorqin namunasi.
			Transformer Explainer
			<a href="https://huggingface.co/openai-community/gpt2" title="Hugging Face" target="_blank"
				>GPT-2</a
			>
			(small) modelida ishlaydi, unda 124 million parametr bor. Bu eng so'nggi yoki eng kuchli Transformer
			modeli emas, lekin uning arxitektura komponentlari va tamoyillari bugungi eng ilg'or modellar bilan
			ko'p jihatdan bir xil — shuning uchun asoslarni tushunish uchun ideal boshlang'ich nuqta.
		</p>
	</div>

	<div class="article-section" data-click="article-overview">
		<h1>Transformer arxitekturasi</h1>

		<p>
			Har qanday matn generatsiya qiluvchi Transformer <strong>uchta asosiy qismdan</strong> iborat:
		</p>
		<ol>
			<li>
				<strong class="bold-purple">Embedding</strong>: kirish matni token deb ataluvchi kichik
				bo'laklarga ajratiladi — bular so'z yoki so'z bo'lagi (subword) bo'lishi mumkin. Keyin bu
				tokenlar embedding deb ataluvchi raqamli vektorlarga aylantiriladi; bu vektorlar so'zlarning
				semantik ma'nosini ifodalaydi.
			</li>
			<li>
				<strong class="bold-purple">Transformer bloki</strong> — modelning kirish ma'lumotini qayta
				ishlaydigan va o'zgartiradigan asosiy qurilish g'ishti. Har bir blok quyidagilarni o'z
				ichiga oladi:
				<ul class="">
					<li>
						<strong>Attention mexanizmi</strong> — Transformer blokining markaziy qismi. U tokenlarga
						bir-biri bilan "muloqot qilish" imkonini beradi, shu orqali kontekst ma'lumoti va so'zlar
						orasidagi munosabatlar ushlab olinadi.
					</li>
					<li>
						<strong>MLP (Multilayer Perceptron) qatlami</strong> — har bir token ustida mustaqil
						ishlaydigan feed-forward tarmoq. Attention qatlamining vazifasi tokenlar orasida
						ma'lumot uzatish bo'lsa, MLP ning vazifasi — har bir tokenning o'z tasvirini
						(representation) yanada aniqlashtirish.
					</li>
				</ul>
			</li>
			<li>
				<strong class="bold-purple">Chiqish ehtimolliklari</strong>: oxirgi linear va softmax
				qatlamlari qayta ishlangan embedding'larni ehtimolliklarga aylantiradi va model
				ketma-ketlikdagi keyingi tokenni bashorat qila oladi.
			</li>
		</ol>
	</div>

	<div class="article-section" id="embedding" data-click="article-embedding">
		<h2>Embedding</h2>
		<p>
			Aytaylik, siz Transformer modeli yordamida matn generatsiya qilmoqchisiz. Quyidagicha prompt
			yozasiz: <code>"Data visualization empowers users to"</code>. Bu kirish matni model tushunadigan
			va qayta ishlay oladigan formatga o'tkazilishi kerak. Aynan shu yerda embedding ishga tushadi:
			u matnni model ishlay oladigan raqamli ko'rinishga aylantiradi. Promptni embedding'ga
			aylantirish uchun bizga to'rt qadam kerak: 1) kirishni tokenlarga ajratish, 2) token
			embedding'larini olish, 3) pozitsiya haqidagi ma'lumotni qo'shish va nihoyat 4) token va
			pozitsiya kodlashlarini qo'shib yakuniy embedding'ni hosil qilish. Keling, har bir qadamni
			ko'rib chiqamiz.
		</p>
		<div class="figure">
			<img src="./article_assets/embedding.png" width="65%" />
		</div>
		<div class="figure-caption">
			<span class="attention">1</span>-rasm. Embedding qatlamining kengaytirilgan ko'rinishi: kirish
			prompti qanday qilib vektor ko'rinishiga o'tkaziladi. Jarayon
			<span class="fig-numbering">(1)</span> Tokenizatsiya, (2) Token Embedding, (3) Positional
			Encoding va (4) Yakuniy Embedding bosqichlaridan iborat.
		</div>
		<div class="article-subsection">
			<h3>1-qadam: Tokenizatsiya</h3>
			<p>
				Tokenizatsiya — kirish matnini token deb ataluvchi kichikroq, boshqarish osonroq bo'laklarga
				ajratish jarayoni. Token so'z yoki so'z bo'lagi (subword) bo'lishi mumkin.
				<code>"Data"</code> va <code>"visualization"</code> so'zlari alohida tokenlarga to'g'ri
				keladi, <code>"empowers"</code> so'zi esa ikkita tokenga bo'linadi. Tokenlarning to'liq
				lug'ati (vocabulary) model o'qitilishidan oldin belgilanadi: GPT-2 lug'atida
				<code>50,257</code> ta noyob token bor. Endi kirish matnini alohida ID ga ega tokenlarga
				ajratdik, demak ularning vektor ko'rinishini embedding'lardan olishimiz mumkin.
			</p>
		</div>
		<div class="article-subsection" id="article-token-embedding">
			<h3>2-qadam. Token Embedding</h3>
			<p>
				GPT-2 (small) lug'atdagi har bir tokenni 768 o'lchamli vektor sifatida ifodalaydi; vektor
				o'lchami modelga bog'liq. Bu embedding vektorlari <code>(50,257, 768)</code> shaklidagi
				matritsada saqlanadi — taxminan 39 million parametr! Shu ulkan matritsa tufayli model har
				bir tokenga semantik ma'no bera oladi: tilda o'xshash ma'no yoki qo'llanishga ega tokenlar
				bu ko'p o'lchamli fazoda bir-biriga yaqin joylashadi, o'xshashi bo'lmaganlari esa uzoqroq
				turadi.
			</p>
		</div>
		<div class="article-subsection" id="article-positional-embedding">
			<h3>3-qadam. Positional Encoding</h3>
			<p>
				Embedding qatlami har bir tokenning kirish promptidagi o'rni haqidagi ma'lumotni ham
				kodlaydi. Turli modellar positional encoding uchun turli usullardan foydalanadi. GPT-2 o'z
				positional encoding matritsasini noldan o'rganadi va uni bevosita o'qitish jarayoniga
				qo'shib yuboradi.
			</p>

			<!-- <div class="article-subsection-l2">
	<h4>Alternative Positional Encoding Approach <strong class='attention'>[POTENTIALLY COLLAPSIBLE]</strong></h4>
	<p>
	  Other models, like the original Transformer and BERT,
	  use sinusoidal functions for positional encoding.

	  This sinusoidal encoding is deterministic and designed to reflect
	  the absolute as well as the relative position of each token.
	</p>
	<p>
	  Each position in a sequence is assigned a unique mathematical
	  representation using a combination of sine and cosine functions.

	  For a given position, the sine function represents even dimensions,
	  and the cosine function represents odd dimensions within the positional encoding vector.

	  This periodic nature ensures that each position has a consistent encoding,
	  independent of the surrounding context.
	</p>

	<p>
	  Here's how it works:
	</p>

	<span class='attention'>
	  SINUSOIDAL POSITIONAL ENCODING EQUATION
	</span>

	<ul>
	  <li>
		<strong>Sine Function</strong>: Used for even indices of the embedding vector.
	  </li>
	  <li>
		<strong>Cosine Function</strong>: Used for odd indices of the embedding vector.
	</ul>

	<p>
	  Hover over individual encoding values in the matrix above to
	  see how it's calculated using the sins and cosine functions.
	</p>
  </div> -->
		</div>
		<div class="article-subsection">
			<h3>4-qadam. Yakuniy Embedding</h3>
			<p>
				Nihoyat, token va pozitsiya kodlashlarini qo'shib yakuniy embedding ko'rinishini olamiz. Bu
				birlashtirilgan ko'rinish ham tokenlarning semantik ma'nosini, ham ularning kirish
				ketma-ketligidagi o'rnini o'zida saqlaydi.
			</p>
		</div>
	</div>

	<div class="article-section" data-click="article-transformer-block">
		<h2>Transformer bloki</h2>

		<p>
			Transformer'ning asosiy hisoblash ishi Transformer blokida bajariladi; blok multi-head
			self-attention va Multi-Layer Perceptron qatlamidan iborat. Ko'pchilik modellar bunday
			bloklarning ketma-ket joylashgan bir nechtasidan tashkil topadi. Token ko'rinishlari birinchi
			blokdan oxirgisiga o'tib borar ekan, bosqichma-bosqich boyib boradi va model har bir token
			haqida murakkab tushunchani shakllantiradi. Bu qatlamli yondashuv kirish ma'lumotining yuqori
			darajali ko'rinishlarini hosil qiladi. Biz ko'rib chiqayotgan GPT-2 (small) modeli
			<code>12</code> ta shunday blokdan iborat.
		</p>
	</div>

	<div class="article-section" id="self-attention" data-click="article-attention">
		<h3>Multi-Head Self-Attention</h3>
		<p>
			Self-attention mexanizmi modelga ketma-ketlikdagi tokenlar orasidagi munosabatlarni ushlab
			olish imkonini beradi — natijada har bir tokenning ko'rinishiga qolganlari ta'sir qiladi. Bir
			nechta attention head bo'lishi esa modelga bu munosabatlarni turli nuqtai nazardan ko'rish
			imkonini beradi: masalan, bitta head qisqa masofadagi sintaktik bog'lanishlarni ushlasa,
			boshqasi kengroq semantik kontekstni kuzatishi mumkin. Quyidagi bo'limda multi-head
			self-attention qanday hisoblanishini qadamma-qadam ko'rib chiqamiz.
		</p>
		<div class="article-subsection-l2">
			<h4>1-qadam: Query, Key va Value matritsalari</h4>

			<div class="figure pt-10">
				<img src="./article_assets/QKV.png" width="80%" />
				<div class="text-xs">
					<Katex
						displayMode
						math={`
		QKV_{ij} = ( \\sum_{d=1}^{768} \\text{Embedding}_{i,d} \\cdot \\text{Weights}_{d,j}) + \\text{Bias}_j
		`}
					/>
				</div>
			</div>
			<div class="figure-caption">
				<span class="attention">2</span>-rasm. Dastlabki embedding'dan Query, Key va Value
				matritsalarini hisoblash.
			</div>

			<p>
				Har bir tokenning embedding vektori uchta vektorga aylantiriladi:
				<span class="q-color">Query (Q)</span>,
				<span class="k-color">Key (K)</span> va
				<span class="v-color">Value (V)</span>. Bu vektorlar kirish embedding matritsasini
				<span class="q-color">Q</span>,
				<span class="k-color">K</span> va
				<span class="v-color">V</span> uchun o'rganilgan og'irlik (weight) matritsalariga ko'paytirish
				orqali olinadi. Ushbu matritsalar mohiyatini tushunish uchun internet qidiruviga o'xshatib ko'ramiz:
			</p>
			<ul>
				<li>
					<strong class="q-color font-medium">Query (Q)</strong> — bu siz qidiruv tizimiga
					yozadigan matn. Ya'ni siz
					<em>"bu haqda ko'proq ma'lumot topmoqchi bo'lgan"</em> token.
				</li>
				<li>
					<strong class="k-color font-medium">Key (K)</strong> — qidiruv natijalari oynasidagi har bir
					sahifaning sarlavhasi. U query e'tibor qaratishi mumkin bo'lgan tokenlarni ifodalaydi.
				</li>
				<li>
					<strong class="v-color font-medium">Value (V)</strong> — ko'rsatilgan sahifalarning haqiqiy
					mazmuni. Qidiruv so'rovini (Query) mos natijalar (Key) bilan solishtirganimizdan keyin, eng
					mos sahifalarning mazmunini (Value) olishni xohlaymiz.
				</li>
			</ul>
			<p>
				Shu QKV qiymatlaridan foydalanib model attention ballarini (attention scores) hisoblaydi —
				ular bashorat qilishda har bir tokenga qanchalik e'tibor berish kerakligini belgilaydi.
			</p>
		</div>
		<div class="article-subsection-l2">
			<h4>2-qadam: Head'larga bo'lish</h4>
			<p>
				<span class="q-color">Query</span>, <span class="k-color">Key</span> va
				<span class="v-color">Value</span>
				vektorlari bir nechta head'ga bo'linadi — GPT-2 (small) da
				<code>12</code> ta head. Har bir head embedding'ning o'z bo'lagini mustaqil qayta ishlaydi va
				turli sintaktik hamda semantik munosabatlarni ushlaydi. Bu tuzilma turli lingvistik
				xususiyatlarni parallel o'rganishga imkon berib, modelning ifodalash quvvatini oshiradi.
			</p>
		</div>
		<div class="article-subsection-l2">
			<h4>3-qadam: Masked Self-Attention</h4>
			<p>
				Har bir head ichida masked self-attention hisoblanadi. Bu mexanizm modelga kirishning
				kerakli qismlariga e'tibor qaratgan holda ketma-ketlik generatsiya qilish imkonini beradi va
				ayni paytda kelajakdagi tokenlarga kirishni to'sib qo'yadi.
			</p>

			<div class="figure">
				<img src="./article_assets/attention.png" width="80%" align="middle" />
			</div>
			<div class="figure-caption">
				<span class="attention">3</span>-rasm. Query, Key va Value matritsalari yordamida masked
				self-attention'ni hisoblash.
			</div>

			<ul>
				<li>
					<strong>Skalyar ko'paytma (dot product)</strong>:
					<span class="q-color">Query</span>
					va <span class="k-color">Key</span> matritsalarining skalyar ko'paytmasi
					<strong>attention ballini</strong> beradi va barcha kirish tokenlari orasidagi munosabatni
					aks ettiruvchi kvadrat matritsa hosil qiladi.
				</li>
				<li>
					<strong>Masshtablash · Mask</strong>: attention ballari masshtablanadi va attention
					matritsasining yuqori uchburchagiga mask qo'llanadi — bu qiymatlar manfiy cheksizlikka
					tenglashtiriladi, shunda model kelajakdagi tokenlarni ko'ra olmaydi. Model keyingi tokenni
					"kelajakka qaramasdan" bashorat qilishni o'rganishi kerak.
				</li>
				<li>
					<strong>Softmax · Dropout</strong>: mask va masshtablashdan so'ng attention ballari softmax
					operatsiyasi yordamida ehtimolliklarga aylantiriladi, so'ng ixtiyoriy ravishda dropout
					bilan regularizatsiya qilinadi. Matritsaning har bir qatori yig'indisi birga teng bo'ladi va
					undan chapdagi har bir tokenning qanchalik muhimligini ko'rsatadi.
				</li>
			</ul>
		</div>
		<div class="article-subsection-l2">
			<h4>4-qadam: Chiqish va birlashtirish</h4>
			<p>
				Model masked self-attention ballarini
				<span class="v-color">Value</span> matritsasiga ko'paytiradi va self-attention mexanizmining
				<span class="purple-color">yakuniy chiqishini</span>
				oladi. GPT-2 da <code>12</code> ta self-attention head bor va har biri tokenlar orasidagi turli
				munosabatlarni ushlaydi. Bu head'larning chiqishlari birlashtiriladi (concatenate) va chiziqli
				proyeksiyadan o'tkaziladi.
			</p>
		</div>
	</div>

	<div class="article-section" id="article-activation" data-click="article-mlp">
		<h3>MLP: Multi-Layer Perceptron</h3>

		<div class="figure">
			<img src="./article_assets/mlp.png" width="70%" align="middle" />
		</div>
		<div class="figure-caption">
			<span class="attention">4</span>-rasm. MLP qatlami self-attention ko'rinishlarini yuqoriroq
			o'lchamga proyeksiya qilib, modelning ifodalash quvvatini oshiradi.
		</div>

		<p>
			Self-attention head'lari kirish tokenlari orasidagi turli munosabatlarni ushlab olgach,
			birlashtirilgan chiqishlar Multilayer Perceptron (MLP) qatlamiga uzatiladi — bu modelning
			ifodalash quvvatini oshiradi. MLP bloki ikkita chiziqli o'zgartirish va ular orasidagi
			<a
				href="https://en.wikipedia.org/wiki/Rectified_linear_unit#Gaussian-error_linear_unit_(GELU)"
				>GELU</a
			> aktivatsiya funksiyasidan iborat.
		</p>
		<p>
			Birinchi chiziqli o'zgartirish kirish o'lchamini to'rt barobar kengaytiradi: <code>768</code>
			dan
			<code>3072</code> gacha. Bu kengaytirish qadami modelga token ko'rinishlarini yuqoriroq o'lchamli
			fazoga proyeksiya qilish imkonini beradi; o'sha fazoda dastlabki o'lchamda ko'rinmaydigan boyroq
			va murakkabroq naqshlarni ushlash mumkin.
		</p>
		<p>
			Ikkinchi chiziqli o'zgartirish esa o'lchamni yana dastlabki <code>768</code> ga qaytaradi. Bu
			siqish qadami ko'rinishlarni boshqarish qulay bo'lgan hajmga qaytaradi, ammo kengaytirish
			bosqichida kiritilgan foydali nochiziqli o'zgarishlarni saqlab qoladi.
		</p>
		<p>
			Tokenlar orasida ma'lumot almashadigan self-attention'dan farqli o'laroq, MLP har bir tokenni
			mustaqil qayta ishlaydi va shunchaki har bir token ko'rinishini bir fazodan boshqasiga
			o'tkazadi — bu esa modelning umumiy quvvatini boyitadi.
		</p>
	</div>

	<div class="article-section" id="article-prob" data-click="article-prob">
		<h2>Chiqish ehtimolliklari</h2>
		<p>
			Kirish barcha Transformer bloklaridan o'tgach, natija token bashoratiga tayyorlash uchun
			oxirgi linear qatlamga uzatiladi. Bu qatlam yakuniy ko'rinishlarni <code>50,257</code>
			o'lchamli fazoga proyeksiya qiladi; unda lug'atdagi har bir tokenga
			<code>logit</code> deb ataluvchi qiymat to'g'ri keladi. Keyingi so'z har qanday token bo'lishi
			mumkin, shuning uchun bu jarayon tokenlarni keyingi so'z bo'lish ehtimoli bo'yicha saralash
			imkonini beradi. So'ngra logit'larni yig'indisi birga teng bo'lgan ehtimollik taqsimotiga
			aylantirish uchun softmax funksiyasini qo'llaymiz. Shundan keyin keyingi tokenni uning ehtimoli
			asosida tanlab olishimiz (sampling) mumkin.
		</p>

		<div class="figure py-5">
			<img src="./article_assets/softmax.png" width="70%" />
		</div>
		<div class="figure-caption">
			<span class="attention">5</span>-rasm. Lug'atdagi har bir tokenga modelning chiqish logit'lari
			asosida ehtimollik beriladi. Bu ehtimolliklar har bir tokenning ketma-ketlikdagi keyingi so'z
			bo'lish imkoniyatini belgilaydi.
		</div>

		<p id="article-temperature" data-click="article-temperature">
			Oxirgi qadam — shu taqsimotdan tanlab olish (sampling) orqali keyingi tokenni generatsiya
			qilish. Bu jarayonda <code>temperature</code> giperparametri hal qiluvchi rol o'ynaydi.
			Matematik jihatdan bu juda oddiy amal: modelning chiqish logit'lari shunchaki
			<code>temperature</code> ga bo'linadi:
		</p>

		<ul>
			<li>
				<code>temperature = 1</code>: logit'larni birga bo'lish softmax natijasiga hech qanday ta'sir
				qilmaydi.
			</li>
			<li>
				<code>temperature &lt; 1</code>: past temperature ehtimollik taqsimotini o'tkirlashtiradi,
				natijada model o'ziga ishonchliroq va deterministikroq bo'ladi — chiqish matni oldindan
				aytish osonroq bo'ladi.
			</li>
			<li>
				<code>temperature &gt; 1</code>: yuqori temperature taqsimotni yumshatadi va generatsiya
				qilingan matnda tasodifiylikni oshiradi — ba'zilar buni modelning
				<em>"ijodkorligi"</em> deb ataydi.
			</li>
		</ul>

		<p id="article-sampling" data-click="article-sampling">
			Bundan tashqari, sampling jarayonini <code>top-k</code>
			va
			<code>top-p</code> parametrlari bilan yanada nozik sozlash mumkin:
		</p>
		<ul>
			<li>
				<code>top-k sampling</code>: nomzod tokenlarni eng yuqori ehtimollikka ega k ta token bilan
				cheklaydi va ehtimoli past variantlarni chetlab o'tadi.
			</li>
			<li>
				<code>top-p sampling</code>: yig'indi ehtimoli p chegarasidan oshadigan eng kichik token
				to'plamini oladi — shunda faqat eng ehtimolli tokenlar ishtirok etadi, ammo xilma-xillik ham
				saqlanadi.
			</li>
		</ul>
		<p>
			<code>temperature</code>, <code>top-k</code> va <code>top-p</code> ni sozlash orqali
			deterministik va xilma-xil natijalar o'rtasida muvozanat topishingiz va model xatti-harakatini
			o'z ehtiyojingizga moslashtirishingiz mumkin.
		</p>
	</div>

	<div class="article-section" data-click="article-advanced-features">
		<h2>Yordamchi arxitektura elementlari</h2>

		<p>
			Transformer modellari samaradorligini oshiruvchi bir nechta yordamchi arxitektura elementlari
			bor. Ular modelning umumiy ishlashi uchun muhim bo'lsa-da, arxitekturaning asosiy g'oyalarini
			tushunish uchun unchalik hal qiluvchi emas. Layer Normalization, Dropout va Residual
			Connection — Transformer modellarida, ayniqsa o'qitish bosqichida, muhim komponentlar. Layer
			Normalization o'qitishni barqarorlashtiradi va modelning tezroq yaqinlashishiga (convergence)
			yordam beradi. Dropout neyronlarni tasodifiy o'chirib turish orqali overfitting'ning oldini
			oladi. Residual Connection esa gradientlarning tarmoq bo'ylab to'g'ridan-to'g'ri oqishiga imkon
			berib, yo'qolayotgan gradient (vanishing gradient) muammosini yumshatadi.
		</p>
		<div class="article-subsection" id="article-ln">
			<h3>Layer Normalization</h3>

			<p>
				Layer Normalization o'qitish jarayonini barqarorlashtiradi va yaqinlashishni yaxshilaydi. U
				kirishlarni xususiyatlar bo'ylab normallashtirib, aktivatsiyalarning o'rtacha qiymati va
				dispersiyasini bir tekisda ushlab turadi. Bu normallashtirish ichki kovariativ siljish
				(internal covariate shift) bilan bog'liq muammolarni yumshatadi, model samaraliroq
				o'rganadi va boshlang'ich og'irliklarga bog'liqlik kamayadi. Layer Normalization har bir
				Transformer blokida ikki marta qo'llanadi: bir marta self-attention mexanizmidan oldin va
				bir marta MLP qatlamidan oldin.
			</p>
		</div>
		<div class="article-subsection" id="article-dropout">
			<h3>Dropout</h3>

			<p>
				Dropout — neyron tarmoqlarda overfitting'ning oldini olish uchun ishlatiladigan
				regularizatsiya usuli: o'qitish davomida model og'irliklarining bir qismi tasodifiy nolga
				tenglashtiriladi. Bu modelni yanada barqaror xususiyatlarni o'rganishga undaydi, ayrim
				neyronlarga bog'lanib qolishini kamaytiradi va tarmoqning yangi, ko'rilmagan ma'lumotlarga
				umumlashtirish qobiliyatini oshiradi. Model inference paytida dropout o'chiriladi. Mohiyatan
				bu o'qitilgan kichik tarmoqlar ansamblidan (ensemble) foydalanish demak — natijada model
				yaxshiroq ishlaydi.
			</p>
		</div>
		<div class="article-subsection" id="article-residual">
			<h3>Residual Connection</h3>

			<p>
				Residual connection birinchi marta 2015-yilda ResNet modelida taqdim etilgan. Bu arxitektura
				yangiligi juda chuqur neyron tarmoqlarni o'qitish imkonini berib, chuqur o'rganish sohasini
				tubdan o'zgartirdi. Mohiyatan residual connection — bir yoki bir nechta qatlamni chetlab
				o'tuvchi "qisqa yo'l": qatlamning kirishi uning chiqishiga qo'shib yuboriladi. Bu
				yo'qolayotgan gradient muammosini yumshatadi va bir-birining ustiga taxlangan ko'plab
				Transformer bloklaridan iborat chuqur tarmoqlarni o'qitishni osonlashtiradi. GPT-2 da
				residual connection har bir Transformer bloki ichida ikki marta ishlatiladi: bir marta MLP
				dan oldin va bir marta undan keyin — shunda gradientlar erkinroq oqadi va dastlabki
				qatlamlar backpropagation davomida yetarli yangilanish oladi.
			</p>
		</div>
	</div>

	<div class="article-section" data-click="article-interactive-features">
		<h1>Interaktiv imkoniyatlar</h1>
		<p>
			Transformer Explainer interaktiv bo'lib qurilgan va Transformer'ning ichki ishlashini
			o'rganishga imkon beradi. Mana siz sinab ko'rishingiz mumkin bo'lgan imkoniyatlar:
		</p>

		<ul>
			<li>
				<strong>O'z matningizni kiriting</strong> va model uni qanday qayta ishlashini hamda keyingi
				so'zni qanday bashorat qilishini kuzating. Attention og'irliklarini, oraliq hisoblarni va
				yakuniy chiqish ehtimolliklari qanday hisoblanishini ko'ring.
			</li>
			<li>
				<strong>Temperature slayderidan foydalaning</strong> va model bashoratlarining tasodifiylik
				darajasini boshqaring. Temperature qiymatini o'zgartirib, model chiqishini qanday qilib
				deterministikroq yoki ijodkorroq qilish mumkinligini ko'ring.
			</li>
			<li>
				<strong>top-k va top-p sampling usullarini tanlang</strong> va inference davomida sampling
				xatti-harakatini sozlang. Turli qiymatlarni sinab ko'ring va ehtimollik taqsimoti qanday
				o'zgarishini hamda bu model bashoratlariga qanday ta'sir qilishini kuzating.
			</li>
			<li>
				<strong>Attention xaritalari bilan ishlang</strong> va modelning kirish ketma-ketligidagi
				turli tokenlarga qanday e'tibor qaratishini ko'ring. Tokenlar ustiga sichqonchani olib
				borib, ularning attention og'irliklarini yoriting va model kontekst hamda so'zlar orasidagi
				munosabatlarni qanday ushlab olishini o'rganing.
			</li>
		</ul>
	</div>

	<div class="article-section" data-click="article-implementation">
		<h2>Transformer Explainer qanday qurilgan?</h2>
		<p>
			Transformer Explainer'da GPT-2 (small) modeli to'g'ridan-to'g'ri brauzerda, jonli ishlaydi. Bu
			model Andrej Karpathy ning
			<a href="https://github.com/karpathy/nanoGPT" title="Github" target="_blank"
				>nanoGPT loyihasidagi</a
			>
			GPT ning PyTorch implementatsiyasidan olingan va brauzerda muammosiz ishlashi uchun
			<a href="https://onnxruntime.ai/" title="ONNX" target="_blank">ONNX Runtime</a>
			formatiga o'tkazilgan. Interfeys JavaScript da yozilgan: front-end freymvork sifatida
			<a href="https://kit.svelte.dev/" title="Svelte" target="_blank">Svelte</a>, dinamik
			vizualizatsiyalar uchun esa
			<a href="https://d3js.org/" title="D3" target="_blank">D3.js</a>
			ishlatilgan. Raqamli qiymatlar foydalanuvchi kiritgan matnga qarab jonli yangilanib turadi.
		</p>
	</div>

	<div class="article-section" data-click="article-credit">
		<h2>Transformer Explainer'ni kim yaratgan?</h2>
		<p>
			Transformer Explainer'ni Georgia Institute of Technology da

			<a href="https://aereeeee.github.io/" target="_blank">Aeree Cho</a>,
			<a href="https://www.linkedin.com/in/chaeyeonggracekim/" target="_blank">Grace C. Kim</a>,
			<a href="https://alexkarpekov.com/" target="_blank">Alexander Karpekov</a>,
			<a href="https://alechelbling.com/" target="_blank">Alec Helbling</a>,
			<a href="https://zijie.wang/" target="_blank">Jay Wang</a>,
			<a href="https://seongmin.xyz/" target="_blank">Seongmin Lee</a>,
			<a href="https://bhoov.com/" target="_blank">Benjamin Hoover</a> va
			<a href="https://poloclub.github.io/polochau/" target="_blank">Polo Chau</a>

			yaratgan.
		</p>
		<p>
			Ushbu o'zbekcha versiya — asl loyihaning tarjimasi va kengaytmasi.
			<a href="https://github.com/uzbtrust/NLP-Teacher" target="_blank">NLP Teacher</a> loyihasi doirasida
			tayyorlangan.
		</p>
	</div>
</div>

<style lang="scss">
	a {
		color: theme('colors.blue.500');

		&:hover {
			color: theme('colors.blue.700');
		}
	}

	.bold-purple {
		color: theme('colors.purple.700');
		font-weight: bold;
	}

	code {
		color: theme('colors.gray.500');
		background-color: theme('colors.gray.50');
		font-family: theme('fontFamily.mono');
	}

	.q-color {
		color: theme('colors.blue.400');
	}

	.k-color {
		color: theme('colors.red.400');
	}

	.v-color {
		color: theme('colors.green.400');
	}

	.purple-color {
		color: theme('colors.purple.500');
	}

	.article-section {
		padding-bottom: 2rem;
	}
	.architecture-section {
		padding-top: 1rem;
	}
	.video-container {
		position: relative;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		height: 0;
		overflow: hidden;
		max-width: 100%;
		background: #000;
	}

	.video-container iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	#description {
		padding-bottom: 3rem;
		margin-left: auto;
		margin-right: auto;
		max-width: 78ch;
	}

	#description h1 {
		color: theme('colors.purple.700');
		font-size: 2.2rem;
		font-weight: 300;
		padding-top: 1rem;
	}

	#description h2 {
		// color: #444;
		color: theme('colors.purple.700');
		font-size: 2rem;
		font-weight: 300;
		padding-top: 1rem;
	}

	#description h3 {
		color: theme('colors.gray.700');
		font-size: 1.6rem;
		font-weight: 200;
		padding-top: 1rem;
	}

	#description h4 {
		color: theme('colors.gray.700');
		font-size: 1.6rem;
		font-weight: 200;
		padding-top: 1rem;
	}

	#description p {
		margin: 1rem 0;
	}

	#description p img {
		vertical-align: middle;
	}

	#description .figure-caption {
		font-size: 0.8rem;
		margin-top: 0.5rem;
		text-align: center;
		margin-bottom: 2rem;
	}

	#description ol {
		margin-left: 3rem;
		list-style-type: decimal;
	}

	#description li {
		margin: 0.6rem 0;
	}

	#description p,
	#description div,
	#description li {
		color: theme('colors.gray.600');
		line-height: 1.6;
	}

	#description small {
		font-size: 0.8rem;
	}

	#description ol li img {
		vertical-align: middle;
	}

	#description .video-link {
		color: theme('colors.blue.600');
		cursor: pointer;
		font-weight: normal;
		text-decoration: none;
	}

	#description ul {
		list-style-type: disc;
		margin-left: 2.5rem;
		margin-bottom: 1rem;
	}

	#description a:hover,
	#description .video-link:hover {
		text-decoration: underline;
	}

	.figure,
	.video {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
