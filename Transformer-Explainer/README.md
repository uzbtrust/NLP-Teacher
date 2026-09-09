# Transformer Explainer (o'zbekcha)

Transformer Explainer — GPT kabi Transformer asosidagi modellar qanday ishlashini
o'rgatuvchi interaktiv vizualizatsiya. U brauzeringizda **haqiqiy GPT-2 (small)
modelini** ishga tushiradi: o'z matningizni kiritib, modelning ichki
komponentlari keyingi tokenni bashorat qilish uchun qanday birgalikda
ishlashini jonli kuzatishingiz mumkin.

Bu — [poloclub/transformer-explainer](https://github.com/poloclub/transformer-explainer)
loyihasining o'zbek tiliga tarjimasi va kengaytmasi.
[NLP Teacher](https://github.com/uzbtrust/NLP-Teacher) loyihasi doirasida tayyorlanmoqda.

[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

## Nima o'zgartirildi

- Barcha interfeys, maqola va bosqichma-bosqich darslik matnlari o'zbek tiliga
  tarjima qilindi. Texnik atamalar (attention, embedding, softmax, logit va h.k.)
  ataylab inglizcha qoldirildi — o'quvchi keyinchalik ingliz tilidagi manbalar
  bilan ishlashi kerak bo'ladi.
- Asl loyihadagi tadqiqot uchun ma'lumot yig'ish haqidagi banner olib tashlandi:
  bu versiyada hech qanday analytics ishlamaydi va rozilik formasi (PDF) mavjud emas.
- YouTube video bo'limi olib tashlandi.
- Upstream'dagi dependency ziddiyati tuzatildi (`vite` 5 → 7; `@sveltejs/vite-plugin-svelte@6`
  vite `^6.3 || ^7` talab qiladi, lekin `package.json` da vite 5 qotirilgan edi).
- Sass `additionalData` yo'li absolyut qilindi — yangi sass API nisbiy yo'llarni
  boshqacha yechadi.

## Lokal ishga tushirish

#### Talablar

- Node.js v20 yoki undan yuqori
- NPM v10 yoki undan yuqori

#### Qadamlar

```bash
git clone https://github.com/uzbtrust/NLP-Teacher.git
cd NLP-Teacher/Transformer-Explainer
npm install
npm run dev
```

So'ng brauzerda http://localhost:5173 manzilini oching.

## Asl loyiha va ilmiy maqola

[**Transformer Explainer: Learning LLM Transformers with Interactive Visual Explanation and Experimentations**](https://dl.acm.org/doi/pdf/10.1145/3772318.3791725).
Aeree Cho, Grace C. Kim, Alexander Karpekov, Seongmin Lee, Alec Helbling,
Benjamin Hoover, Zijie J. Wang, Minsuk Kahng, Duen Horng Chau.
_Proceedings of the 2026 CHI Conference on Human Factors in Computing Systems._

Asl loyiha Georgia Institute of Technology dagi
[Polo Club of Data Science](https://poloclub.github.io/) jamoasi tomonidan yaratilgan.

## Litsenziya

MIT. Asl mualliflik huquqi bildirishnomasi va litsenziya matni [LICENSE](./LICENSE)
faylida o'zgarishsiz saqlangan.
