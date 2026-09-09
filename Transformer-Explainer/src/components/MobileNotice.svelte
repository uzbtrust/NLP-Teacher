<script>
	// Telefon va planshetlarda ko'rsatiladigan ogohlantirish.
	// Vizualizatsiya ~1300px kenglikni talab qiladi va GPT-2 modeli 600MB —
	// mobil qurilmada foydalanish qulay emas, shuning uchun ilova ochilmaydi.
</script>

<div class="mobile-notice">
	<div class="card">
		<div class="logo">T<span class="small">RANSFORMER</span> E<span class="small">XPLAINER</span></div>

		<div class="icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<rect x="2" y="4" width="20" height="13" rx="2" />
				<path d="M8 21h8M12 17v4" stroke-linecap="round" />
			</svg>
		</div>

		<h1>Iltimos, kompyuterda oching</h1>

		<p>
			Bu interaktiv darslik keng ekran uchun mo'ljallangan. Transformer diagrammasi
			bir vaqtning o'zida o'nlab qatlam va vektorni ko'rsatadi — telefon ekraniga sig'maydi.
		</p>

		<p class="muted">
			Ustiga-ustak, brauzerda jonli ishlaydigan GPT-2 modeli <strong>600 MB</strong>
			hajmda yuklanadi. Mobil internetda bu ancha vaqt va trafik oladi.
		</p>

		<div class="hint">
			Sahifa manzilini saqlab qo'ying va kompyuterdan qayta oching.
		</div>

		<a class="repo" href="https://github.com/uzbtrust/NLP-Teacher" target="_blank" rel="noreferrer">
			Loyiha GitHub'da
		</a>
	</div>
</div>

<style lang="scss">
	.mobile-notice {
		min-height: 100vh;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		box-sizing: border-box;
		background: #ffffff;
	}

	.card {
		max-width: 32rem;
		text-align: center;
	}

	.logo {
		font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
		font-weight: 700;
		font-size: 1.35rem;
		letter-spacing: 0.01em;
		background: linear-gradient(
			to right,
			theme('colors.blue.500') 0%,
			theme('colors.purple.500') 60%
		);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;

		.small {
			font-size: 1rem;
			letter-spacing: 0.06em;
		}
	}

	.icon {
		margin: 2rem auto 1.25rem;
		width: 3.5rem;
		height: 3.5rem;
		color: theme('colors.purple.400');

		svg {
			width: 100%;
			height: 100%;
		}
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 400;
		color: theme('colors.purple.700');
		margin-bottom: 1rem;
	}

	p {
		color: theme('colors.gray.600');
		line-height: 1.6;
		margin-bottom: 0.85rem;
	}

	.muted {
		color: theme('colors.gray.500');
		font-size: 0.92rem;
	}

	.hint {
		margin-top: 1.5rem;
		padding: 0.85rem 1rem;
		border-radius: 0.6rem;
		background: theme('colors.gray.50');
		border: 1px solid theme('colors.gray.200');
		color: theme('colors.gray.600');
		font-size: 0.92rem;
	}

	.repo {
		display: inline-block;
		margin-top: 1.5rem;
		color: theme('colors.blue.500');
		font-size: 0.92rem;

		&:hover {
			color: theme('colors.blue.700');
			text-decoration: underline;
		}
	}
</style>
