<script lang="ts">
	export let title: string = '';
	export let izoh: string = '';
</script>

<figure class="stend">
	<div class="stend-bar">
		<span class="stend-title">{title}</span>
		<div class="stend-controls"><slot name="boshqaruv" /></div>
	</div>
	<div class="stend-canvas">
		<slot />
	</div>
	{#if izoh}
		<figcaption>{izoh}</figcaption>
	{/if}
</figure>

<style lang="scss">
	.stend {
		border: 1px solid theme('colors.gray.200');
		border-radius: 8px;
		background: white;
		overflow: hidden;
	}

	.stend-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
		padding: 0.7rem 1.1rem;
		border-bottom: 1px solid theme('colors.gray.100');
		background: theme('colors.gray.50');
	}

	.stend-title {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: theme('colors.gray.500');
	}

	.stend-controls {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex-wrap: wrap;
	}

	.stend-canvas {
		padding: 1.5rem 1.25rem;
		overflow-x: auto;
	}

	figcaption {
		padding: 0.75rem 1.1rem;
		border-top: 1px solid theme('colors.gray.100');
		font-size: 0.85rem;
		line-height: 1.6;
		color: theme('colors.gray.500');
		background: theme('colors.gray.50');
	}
</style>
