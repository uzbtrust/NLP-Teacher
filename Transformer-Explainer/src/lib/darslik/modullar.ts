export type Modul = {
	slug: string;
	raqam: string;
	title: string;
	yil: string;
	tagline: string;
};

export const QISM = {
	raqam: '02',
	title: 'Blokni qayta qurish',
	tagline: `2019-2021 orasida transformer bloki ichidagi to'rtta qism almashtirildi. Arxitektura o'sha, detallar boshqa.`
};

export const modullar: Modul[] = [
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
		yil: '2019 → 2024',
		tagline: `To'rtta almashtirishni birga yig'ing va GPT-2'dan Llama 3'ga o'ting.`
	}
];

export const modulTop = (slug: string) => modullar.find((m) => m.slug === slug);

export const qoshni = (slug: string) => {
	const i = modullar.findIndex((m) => m.slug === slug);
	return {
		oldingi: i > 0 ? modullar[i - 1] : null,
		keyingi: i >= 0 && i < modullar.length - 1 ? modullar[i + 1] : null
	};
};
