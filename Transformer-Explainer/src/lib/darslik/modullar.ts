export type Modul = {
	slug: string;
	raqam: string;
	title: string;
	yil: string;
	tagline: string;
};

export type Qism = {
	raqam: string;
	title: string;
	yillar: string;
	tagline: string;
	modullar: Modul[];
};

export const qismlar: Qism[] = [
	{
		raqam: '02',
		title: 'Blokni qayta qurish',
		yillar: '2019 - 2021',
		tagline: `2019-2021 orasida transformer bloki ichidagi to'rtta qism almashtirildi. Arxitektura o'sha, detallar boshqa.`,
		modullar: [
			{
				slug: 'rmsnorm',
				raqam: '2.1',
				title: 'RMSNorm',
				yil: '2019',
				tagline: `LayerNorm'dan o'rtachani olib tashlash - deyarli bir xil natija, arzonroq hisob.`
			},
			{
				slug: 'pre-ln',
				raqam: '2.2',
				title: 'Pre-LN',
				yil: '2020',
				tagline: `Normalizatsiyani blokdan keyin emas, oldin qo'yish. Chuqur modelni warmup'siz o'qitadi.`
			},
			{
				slug: 'swiglu',
				raqam: '2.3',
				title: 'SwiGLU',
				yil: '2020',
				tagline: `FFN'ga eshik (gate) qo'shish: qaysi signal o'tishini modelning o'zi hal qiladi.`
			},
			{
				slug: 'rope',
				raqam: '2.4',
				title: 'RoPE',
				yil: '2021',
				tagline: `Pozitsiyani qo'shish emas, burish. Attention faqat nisbiy masofani ko'radi.`
			},
			{
				slug: 'blok',
				raqam: '2.5',
				title: 'Blok konstruktori',
				yil: '2019 - 2024',
				tagline: `To'rtta almashtirishni birga yig'ing va GPT-2'dan Llama 3'ga o'ting.`
			}
		]
	},
	{
		raqam: '03',
		title: 'Inference tezligi',
		yillar: '2019 - 2024',
		tagline: `Model o'qitilgan, arxitektura tayyor. Endi savol boshqa: bir xil javobni necha barobar kam xotira va kam vaqt bilan olish mumkin.`,
		modullar: [
			{
				slug: 'kv-cache',
				raqam: '3.1',
				title: 'KV Cache',
				yil: '2019',
				tagline: `Har yangi token uchun butun tarixni qayta hisoblash o'rniga uni saqlab qo'yish. Tezlik oshdi, xotira muammosi tug'ildi.`
			},
			{
				slug: 'gqa',
				raqam: '3.2',
				title: 'MQA va GQA',
				yil: '2019 - 2023',
				tagline: `Har head'ga alohida K va V shart emas. Cache'ni sifatni yo'qotmasdan bir necha barobar kichraytirish.`
			},
			{
				slug: 'mla',
				raqam: '3.3',
				title: 'MLA',
				yil: '2024',
				tagline: `K va V ni past o'lchamli latent vektorga siqish. DeepSeek-V2 ning cache yechimi.`
			},
			{
				slug: 'flash-attention',
				raqam: '3.4',
				title: 'FlashAttention',
				yil: '2022 - 2024',
				tagline: `Attention matritsasini umuman yozmaslik. Tezlik hisobdan emas, xotira yurishidan keladi.`
			},
			{
				slug: 'paged-attention',
				raqam: '3.5',
				title: 'PagedAttention',
				yil: '2023',
				tagline: `KV cache'ni operatsion tizim kabi sahifalarga bo'lish. vLLM shu bilan tezlashgan.`
			},
			{
				slug: 'speculative',
				raqam: '3.6',
				title: 'Speculative decoding',
				yil: '2023',
				tagline: `Kichik model taxmin qiladi, katta model bir yo'la tekshiradi. Javob bir xil, qadam kam.`
			},
			{
				slug: 'quantization',
				raqam: '3.7',
				title: 'Quantization',
				yil: '2022 - 2023',
				tagline: `Vazn 16 bitdan 4 bitga tushadi. Nimani yutamiz, nimani yo'qotamiz.`
			}
		]
	}
];

export const modullar: Modul[] = qismlar.flatMap((q) => q.modullar);

export const modulTop = (slug: string) => modullar.find((m) => m.slug === slug);

export const qismTop = (slug: string) => qismlar.find((q) => q.modullar.some((m) => m.slug === slug));

export const qoshni = (slug: string) => {
	const i = modullar.findIndex((m) => m.slug === slug);
	return {
		oldingi: i > 0 ? modullar[i - 1] : null,
		keyingi: i >= 0 && i < modullar.length - 1 ? modullar[i + 1] : null
	};
};
