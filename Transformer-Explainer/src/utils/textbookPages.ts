import { get } from 'svelte/store';
import {
	expandedBlock,
	weightPopover,
	isBoundingBoxActive,
	textbookCurrentPageId,
	isExpandOrCollapseRunning,
	isFetchingModel,
	userId
} from '~/store';
import {
	highlightElements,
	removeHighlightFromElements,
	applyTransformerBoundingHeight,
	resetElementsHeight,
	highlightAttentionPath,
	removeAttentionPathHighlight,
	removeFingerFromElements
} from '~/utils/textbook';
import { drawResidualLine } from './animation';

export interface TextbookPage {
	id: string;
	title: string;
	content?: string;
	component?: any;
	timeoutId?: number;
	on: () => void;
	out: () => void;
	complete?: () => void;
}

const { drawLine, removeLine } = drawResidualLine();

export const textPages: TextbookPage[] = [
	{
		id: 'what-is-transformer',
		title: `Transformer nima?`,
		content: `<p><strong>Transformer</strong> — zamonaviy sun'iy intellektning asosiy arxitekturasi; ChatGPT va Gemini kabi modellar shunga quriladi. 2017-yilda taqdim etilgan bu arxitektura sun'iy intellekt ma'lumotni qayta ishlash usulini tubdan o'zgartirdi. Xuddi shu arxitektura ulkan ma'lumotlar to'plamida o'qitish (training) uchun ham, natija generatsiya qilish (inference) uchun ham ishlatiladi. Bu yerda biz GPT-2 (small) modelidan foydalanamiz — u yangilaridan soddaroq, lekin asoslarni o'rganish uchun ayni muddao.</p>`,
		on: () => {},
		out: () => {}
	},
	{
		id: 'how-transformers-work',
		title: `Transformer qanday ishlaydi?`,
		content: `<p>Transformer sehr emas — u matnni qadamma-qadam quradi va har safar bitta savol beradi:</p><blockquote class="question">"Ushbu kirishdan keyin keladigan eng ehtimolli so'z qaysi?"</blockquote><p>Bu yerda biz o'qitilgan model matnni qanday generatsiya qilishini ko'ramiz. O'z matningizni yozing yoki tayyor misolni tanlang, so'ng <strong>Generate</strong> tugmasini bosing. Agar model hali tayyor bo'lmasa, boshqa <strong>Examples</strong> dan birini sinab ko'ring.</p>`,
		on: () => {
			highlightElements(['.input-form']);
			if (get(isFetchingModel)) {
				highlightElements(['.input-form .select-button']);
			} else {
				highlightElements(['.input-form .generate-button']);
			}
		},
		out: () => {
			removeHighlightFromElements([
				'.input-form',
				'.input-form .select-button',
				'.input-form .generate-button'
			]);
		},
		complete: () => {
			removeFingerFromElements(['.input-form .select-button', '.input-form .generate-button']);
			if (get(textbookCurrentPageId) === 'how-transformers-work') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'how-transformers-work'
				});
			}
		}
	},
	{
		id: 'transformer-architecture',
		title: `Transformer arxitekturasi`,
		content:
			`<p>Transformer uchta asosiy qismdan iborat:</p><div class="numbered-list"><div class="numbered-item"><span class="number-circle">1</span><div class="item-content"><strong>Embedding</strong> matnni raqamlarga aylantiradi.</div></div><div class="numbered-item"><span class="number-circle">2</span><div class="item-content"><strong>Transformer bloklari</strong> Self-Attention orqali ma'lumotni aralashtiradi va MLP orqali aniqlashtiradi.</div></div><div class="numbered-item"><span class="number-circle">3</span><div class="item-content"><strong>Ehtimolliklar</strong> har bir keyingi tokenning imkoniyatini belgilaydi.</div></div></div>`,
		on: () => {
			const selectors = [
				'.step.embedding',
				'.step.softmax',
				'.transformer-bounding',
				'.transformer-bounding-title'
			];
			highlightElements(selectors);
			applyTransformerBoundingHeight(['.softmax-bounding', '.embedding-bounding']);
		},
		out: () => {
			const selectors = [
				'.step.embedding',
				'.step.softmax',
				'.transformer-bounding',
				'.transformer-bounding-title'
			];
			removeHighlightFromElements(selectors);
			resetElementsHeight(['.softmax-bounding', '.embedding-bounding']);
		}
	},
	{
		id: 'embedding',
		title: `Embedding`,
		content: `<p>Transformer matndan foydalanishidan oldin uni kichik bo'laklarga ajratadi va har birini raqamlar ro'yxati (vektor) sifatida ifodalaydi. Bu jarayon <strong>embedding</strong> deb ataladi; atama ham jarayonni, ham natijadagi vektorni anglatishi mumkin.</p><p>Ushbu vositada har bir vektor to'rtburchak ko'rinishida chiziladi; ustiga sichqonchani olib borsangiz, uning o'lchamini ko'rasiz.</p>`,
		on: () => {
			highlightElements(['.step.embedding .title']);
		},
		out: () => {
			removeHighlightFromElements(['.step.embedding .title']);
		},
		complete: () => {
			removeFingerFromElements(['.step.embedding .title']);
			if (get(textbookCurrentPageId) === 'embedding') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'embedding'
				});
			}
		}
	},
	{
		id: 'token-embedding',
		title: `Token Embedding`,
		content: `<p><strong>Tokenizatsiya</strong> kirish matnini tokenlarga — so'z yoki so'z bo'laklari kabi kichik birliklarga ajratadi. GPT-2 (small) lug'atida 50,257 ta token bor, har birining o'z ID si mavjud.</p><p><strong>Token embedding</strong> bosqichida har bir token katta jadvaldan 768 ta raqamdan iborat vektorga moslanadi. Bu vektorlar o'qitish davomida har bir tokenning ma'nosini eng yaxshi ifodalash uchun o'rganiladi.</p>`,
		on: function () {
			const selectors = [
				'.token-column .column.token-string',
				'.token-column .column.token-embedding'
			];
			if (get(expandedBlock).id !== 'embedding') {
				expandedBlock.set({ id: 'embedding' });
				this.timeoutId = setTimeout(() => {
					highlightElements(selectors);
				}, 500);
			} else {
				highlightElements(selectors);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			const selectors = [
				'.token-column .column.token-string',
				'.token-column .column.token-embedding'
			];
			removeHighlightFromElements(selectors);
			if (get(textbookCurrentPageId) !== 'positional-encoding') expandedBlock.set({ id: null });
		}
	},
	{
		id: 'positional-encoding',
		title: `Positional Encoding`,
		content: `<p>Tilda so'z tartibi muhim. <strong>Positional encoding</strong> har bir tokenga uning ketma-ketlikdagi o'rni haqida ma'lumot beradi.</p><p>GPT-2 buni tokenning embedding'iga o'rganilgan pozitsion embedding'ni qo'shish orqali bajaradi. Yangiroq modellar boshqa usullardan foydalanishi mumkin — masalan, RoPE pozitsiyani ayrim vektorlarni aylantirish orqali kodlaydi. Barchasining maqsadi bir xil: modelga matndagi tartibni tushunishga yordam berish.</p>`,
		on: function () {
			const selectors = [
				'.token-column .column.position-embedding',
				'.token-column .column.symbol'
			];
			if (get(expandedBlock).id !== 'embedding') {
				expandedBlock.set({ id: 'embedding' });
				this.timeoutId = setTimeout(() => {
					highlightElements(selectors);
				}, 500);
			} else {
				highlightElements(selectors);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			const selectors = [
				'.token-column .column.position-embedding',
				'.token-column .column.symbol'
			];
			removeHighlightFromElements(selectors);
			if (get(textbookCurrentPageId) !== 'token-embedding') expandedBlock.set({ id: null });
		}
	},
	{
		id: 'blocks',
		title: `Takrorlanuvchi Transformer bloklari`,
		content: `<p><strong>Transformer bloki</strong> — modeldagi asosiy qayta ishlash birligi. U ikki qismdan iborat:</p><ul><li><strong>Multi-head self-attention</strong> — tokenlarga ma'lumot almashish imkonini beradi</li><li><strong>MLP</strong> — har bir tokenning tafsilotlarini aniqlashtiradi</li></ul><p>Modellar ko'plab bloklarni bir-birining ustiga taxlaydi, shunda token ko'rinishlari ular orqali o'tar ekan boyib boradi. GPT-2 (small) da 12 ta shunday blok bor.</p>`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements([
						'.transformer-bounding',
						'.step.transformer-blocks .guide',
						'.attention > .title',
						'.mlp > .title'
					]);
					highlightElements(['.transformer-bounding-title'], 'textbook-button-highlight');
					isBoundingBoxActive.set(true);
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements([
				'.transformer-bounding',
				'.step.transformer-blocks .guide',
				'.attention > .title',
				'.mlp > .title'
			]);
			removeHighlightFromElements(['.transformer-bounding-title'], 'textbook-button-highlight');
			isBoundingBoxActive.set(false);
		},
		complete: () => {
			removeFingerFromElements(['.transformer-bounding-title']);
			if (get(textbookCurrentPageId) === 'blocks') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'blocks'
				});
			}
		}
	},
	{
		id: 'self-attention',
		title: `Multi-Head Self-Attention`,
		content:
			`<p><strong>Self-attention</strong> modelga kirishning qaysi qismlari har bir token uchun eng muhimligini aniqlash imkonini beradi. Bu ma'no va munosabatlarni, hatto bir-biridan uzoqda turgan so'zlar orasida ham, ushlab olishga yordam beradi.</p><p><strong>Multi-head</strong> shaklida model bir nechta attention jarayonini parallel ishlatadi va har biri matndagi turli naqshlarga e'tibor qaratadi.</p>`,
		on: () => {
			highlightElements(['.step.attention']);
		},
		out: () => {
			removeHighlightFromElements(['.step.attention']);
		}
	},
	{
		id: 'qkv',
		title: `Query, Key, Value`,
		content: `<p>Self-attention bajarish uchun har bir tokenning embedding'i <span class="highlight">uchta yangi embedding</span>ga aylantiriladi — <span class="blue">Query</span>, <span class="red">Key</span> va <span class="green">Value</span>. Bu o'zgartirish har bir token embedding'iga turli og'irliklar (weights) va bias qo'llash orqali amalga oshiriladi. Bu parametrlar o'qitish davomida optimallashtiriladi.</p><p>Yaratilgach, <span class="blue">Query</span> lar <span class="red">Key</span> lar bilan solishtirilib muhimlik darajasi o'lchanadi, so'ng shu daraja <span class="green">Value</span> larni tortish (weight) uchun ishlatiladi.</p>`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements(['g.path-group.qkv', '.step.qkv .qkv-column']);
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements(['g.path-group.qkv', '.step.qkv .qkv-column']);
			weightPopover.set(null);
		},
		complete: () => {
			removeFingerFromElements(['.step.qkv .qkv-column']);
			if (get(textbookCurrentPageId) === 'qkv') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'qkv'
				});
			}
		}
	},

	{
		id: 'multi-head',
		title: `Multi-head`,
		content:
			`<p><span class="blue">Q</span>, <span class="red">K</span> va <span class="green">V</span> embedding'lari yaratilgach, model ularni bir nechta <strong>head</strong> ga bo'ladi (GPT-2 small da 12 ta). Har bir head o'zining kichikroq <span class="blue">Q</span>/<span class="red">K</span>/<span class="green">V</span> to'plami bilan ishlaydi va matndagi turli naqshlarga — grammatika, ma'no yoki uzoq masofali bog'lanishlarga — e'tibor qaratadi.</p><p>Bir nechta head modelga ko'p turdagi munosabatlarni parallel o'rganish imkonini beradi va uning tushunchasini boyitadi.</p>`,
		on: () => {
			highlightAttentionPath();
			highlightElements(['.multi-head .head-title']);
		},
		out: () => {
			removeAttentionPathHighlight();
			removeHighlightFromElements(['.multi-head .head-title']);
		},
		complete: () => {
			removeFingerFromElements(['.multi-head .head-title']);
			if (get(textbookCurrentPageId) === 'multi-head') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'multi-head'
				});
			}
		}
	},
	{
		id: 'masked-self-attention',
		title: `Masked Self-Attention`,
		content: `<p>Har bir head ichida model har bir token boshqalarga qanchalik e'tibor berishini hal qiladi:</p><ul><li><strong>Skalyar ko'paytma</strong> — <span class="blue">Query</span>/<span class="red">Key</span> vektorlaridagi mos raqamlar ko'paytiriladi va yig'iladi, natijada <span class="purple">attention ballari</span> hosil bo'ladi.</li><li><strong>Mask</strong> — kelajakdagi tokenlar yashiriladi, shunda model oldinga qaray olmaydi.</li><li><strong>Softmax</strong> — ballar ehtimolliklarga aylantiriladi, har bir qator yig'indisi 1 ga teng bo'ladi va oldingi tokenlarga qaratilgan e'tiborni ko'rsatadi.</li></ul>`,
		on: () => {
			highlightAttentionPath();
			highlightElements(['.attention-matrix.attention-result']);
		},
		out: () => {
			removeAttentionPathHighlight();
			removeHighlightFromElements(['.attention-matrix.attention-result']);
			expandedBlock.set({ id: null });
		},
		complete: () => {
			removeFingerFromElements(['.attention-matrix.attention-result']);
			if (get(textbookCurrentPageId) === 'masked-self-attention') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'masked-self-attention'
				});
			}
		}
	},
	{
		id: 'output-concatenation',
		title: `Attention chiqishi va birlashtirish`,
		content:
			`<p>Har bir head <span class="highlight">o'zining <span class="purple">attention ballarini</span> <span class="green">Value</span> embedding'lariga ko'paytirib, o'z attention chiqishini hosil qiladi</span> — bu kontekst hisobga olingandan keyingi har bir tokenning aniqlashtirilgan ko'rinishi.</p><p>GPT-2 (small) da 12 ta shunday chiqish bor; ular birlashtirilib (concatenate) dastlabki o'lchamdagi yagona vektorga (768 ta raqam) aylanadi.</p>`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements(['path.to-attention-out.value-to-out', '.attention .column.out']);
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements(['path.to-attention-out.value-to-out', '.attention .column.out']);
			weightPopover.set(null);
		},
		complete: () => {
			removeFingerFromElements(['.attention .column.out']);
			if (get(textbookCurrentPageId) === 'output-concatenation') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'output-concatenation'
				});
			}
		}
	},
	{
		id: 'mlp',
		title: `MLP (Multi-Layer Perceptron)`,
		content:
			`<p>Attention chiqishi token ko'rinishlarini aniqlashtirish uchun <strong>MLP</strong> dan o'tadi. Linear qatlam o'rganilgan og'irliklar va bias yordamida embedding qiymatlari hamda o'lchamini o'zgartiradi, so'ng nochiziqli aktivatsiya har bir qiymat qanchalik o'tishini hal qiladi.</p><p>Aktivatsiyaning turlari ko'p; GPT-2 <strong>GELU</strong> dan foydalanadi — u kichik qiymatlarni qisman, katta qiymatlarni to'liq o'tkazadi va shu orqali ham nozik, ham kuchli naqshlarni ushlashga yordam beradi.</p>`,
		on: () => {
			highlightElements(['.step.mlp', '.operation-col.activation']);
		},
		out: () => {
			removeHighlightFromElements(['.step.mlp', '.operation-col.activation']);
		}
	},

	{
		id: 'output-logit',
		title: `Output Logit`,
		content: `<p>Barcha Transformer bloklaridan so'ng oxirgi tokenning chiqish embedding'i — u oldingi barcha tokenlardan kelgan kontekst bilan boyitilgan — yakuniy qatlamda o'rganilgan og'irliklarga ko'paytiriladi.</p><p>Natijada <strong>logit</strong> lar hosil bo'ladi: 50,257 ta raqam, GPT-2 lug'atidagi har bir token uchun bittadan. Ular har bir tokenning keyingi bo'lish ehtimolini ko'rsatadi.</p>`,
		on: () => {
			highlightElements(['g.path-group.softmax', '.column.final']);
		},
		out: () => {
			removeHighlightFromElements(['g.path-group.softmax', '.column.final']);
			weightPopover.set(null);
		},
		complete: () => {
			removeFingerFromElements(['.column.final']);
			if (get(textbookCurrentPageId) === 'output-logit') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'output-logit'
				});
			}
		}
	},
	{
		id: 'output-probabilities',
		title: `Ehtimolliklar`,
		content:
			`<p>Logit lar shunchaki xom ballar. Ularni tushunish osonroq bo'lishi uchun biz ularni 0 va 1 orasidagi <strong>ehtimolliklarga</strong> aylantiramiz, shunda yig'indisi 1 ga teng bo'ladi. Bu bizga har bir tokenning keyingi so'z bo'lish imkoniyatini aytadi.</p><p>Har doim eng yuqori ehtimollikdagi tokenni tanlash o'rniga, generatsiya qilingan matnda ishonchlilik va ijodkorlik orasida muvozanat topish uchun turli tanlash strategiyalaridan foydalanishimiz mumkin.</p>`,
		on: () => {
			highlightElements(['.step.softmax .title']);
		},
		out: () => {
			removeHighlightFromElements(['.step.softmax .title']);
		},
		complete: () => {
			removeFingerFromElements(['.step.softmax .title']);
			if (get(textbookCurrentPageId) === 'output-probabilities') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'output-probabilities'
				});
			}
		}
	},
	{
		id: 'temperature',
		title: `Temperature`,
		content:
			`<p><strong>Temperature</strong> logit larni ehtimolliklarga aylantirishdan oldin ularni masshtablash orqali ishlaydi. <strong>Past temperature</strong> (masalan, 0.2) katta logit larni yanada kattaroq, kichiklarini esa kichikroq qiladi; natijada eng yuqori balli tokenlar ustunlik qiladi va tanlovlar <strong>oldindan aytish osonroq</strong> bo'ladi. <strong>Yuqori temperature</strong> (masalan, 1.0 yoki undan yuqori) farqlarni tekislaydi, ehtimoli past tokenlarga ham imkon beradi va natija <strong>ijodkorroq</strong> bo'ladi.</p>`,
		on: function () {
			if (get(expandedBlock).id !== 'softmax') {
				expandedBlock.set({ id: 'softmax' });
				this.timeoutId = setTimeout(() => {
					highlightElements([
						'.formula-step.scaled',
						'.title-box.scaled',
						'.content-box.scaled',
						'.temperature-input'
					]);
				}, 500);
			} else {
				highlightElements([
					'.formula-step.scaled',
					'.title-box.scaled',
					'.content-box.scaled',
					'.temperature-input'
				]);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements([
				'.formula-step.scaled',
				'.title-box.scaled',
				'.temperature-input',
				'.content-box.scaled'
			]);
			if (!['temperature', 'sampling'].includes(get(textbookCurrentPageId)))
				expandedBlock.set({ id: null });
		},
		complete: () => {
			removeFingerFromElements(['.temperature-input']);
			if (get(textbookCurrentPageId) === 'temperature') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'temperature'
				});
			}
		}
	},
	{
		id: 'sampling',
		title: `Sampling strategiyasi`,
		content:
			`<p>Nihoyat, keyingi tokenni tanlash uchun strategiya kerak. Ular ko'p, lekin eng keng tarqalganlari quyidagilar: Greedy search eng yuqorisini tanlaydi. <strong>Top-k</strong> faqat eng ehtimolli k ta tokenni qoldiradi, <strong>top-p</strong> esa umumiy ehtimoli kamida p bo'lgan eng kichik to'plamni qoldiradi — ehtimoli pastlari erta chetlatiladi.</p><p>So'ng softmax qolgan logit larni ehtimolliklarga aylantiradi va ruxsat etilgan to'plamdan bitta token tasodifiy tanlanadi.</p>`,
		on: function () {
			if (get(expandedBlock).id !== 'softmax') {
				expandedBlock.set({ id: 'softmax' });
				this.timeoutId = setTimeout(() => {
					highlightElements([
						'.formula-step.sampling',
						'.title-box.sampling',
						'.sampling-input',
						'.content-box.sampling'
					]);
				}, 500);
			} else {
				highlightElements([
					'.formula-step.sampling',
					'.title-box.sampling',
					'.sampling-input',
					'.content-box.sampling'
				]);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements([
				'.formula-step.sampling',
				'.title-box.sampling',
				'.sampling-input',
				'.content-box.sampling'
			]);
			if (!['temperature', 'sampling'].includes(get(textbookCurrentPageId)))
				expandedBlock.set({ id: null });
		},
		complete: () => {
			removeFingerFromElements(['.sampling-input']);
			if (get(textbookCurrentPageId) === 'sampling') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'sampling'
				});
			}
		}
	},
	{
		id: 'residual',
		title: `Residual Connection`,
		content: `<p>Transformer da modelning ishlashini yaxshilaydigan yordamchi elementlar bor. Masalan, <strong>residual connection</strong> qatlamning kirishini uning chiqishiga qo'shadi va ma'lumotning ko'plab bloklar orqali o'tayotib so'nib ketishiga yo'l qo'ymaydi. GPT-2 da u har bir blokda ikki marta ishlatiladi — bu chuqurroq taxlamlarni samarali o'qitish imkonini beradi.</p>`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements(['.operation-col.residual', '.residual-start']);
					drawLine();
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements(['.operation-col.residual', '.residual-start']);
			removeLine();
		}
	},
	{
		id: 'layer-normalization',
		title: `Layer Normalization`,
		content: `<p><strong>Layer Normalization</strong> kirish raqamlarini shunday sozlaydiki, ularning o'rtacha qiymati va dispersiyasi bir tekisda qoladi; bu esa ham o'qitishni, ham inference ni barqarorlashtiradi. Natijada model boshlang'ich og'irliklarga kamroq bog'liq bo'ladi va samaraliroq o'rganadi. GPT-2 da u self-attention dan oldin, MLP dan oldin va yakuniy chiqishdan oldin yana bir marta qo'llanadi.</p>`,
		on: () => {
			highlightElements(['.operation-col.ln']);
		},
		out: () => {
			removeHighlightFromElements(['.operation-col.ln']);
		}
	},
	{
		id: 'dropout',
		title: `Dropout`,
		content: `<p>O'qitish davomida <strong>dropout</strong> raqamlar orasidagi ayrim bog'lanishlarni tasodifiy o'chiradi, shunda model muayyan naqshlarga haddan ortiq moslashib (overfitting) qolmaydi. Bu unga yaxshiroq umumlashadigan xususiyatlarni o'rganishga yordam beradi. GPT-2 undan foydalanadi, lekin yangiroq LLM lar ko'pincha uni tashlab ketadi — chunki ular juda katta ma'lumotlar to'plamida o'qitiladi va overfitting muammosi kamroq. Inference paytida dropout o'chiriladi.</p>`,
		on: () => {
			highlightElements(['.operation-col.dropout']);
		},
		out: () => {
			removeHighlightFromElements(['.operation-col.dropout']);
		}
	}
	// {
	// 	id: 'final',
	// 	title: `Let's explore!`,
	// 	content: '',
	// 	on: () => {},
	// 	out: () => {}
	// }
];
