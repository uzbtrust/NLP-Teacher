<script lang="ts">
	export let options: { id: string; label: string }[] = [];
	export let value: string;
	export let label: string = '';
</script>

<div class="swap">
	{#if label}<span class="swap-label">{label}</span>{/if}
	<div class="swap-track" role="radiogroup" aria-label={label || 'variant'}>
		{#each options as o (o.id)}
			<button
				type="button"
				role="radio"
				aria-checked={value === o.id}
				class="swap-opt"
				class:active={value === o.id}
				on:click={() => (value = o.id)}
			>
				{o.label}
			</button>
		{/each}
	</div>
</div>

<style lang="scss">
	.swap {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.swap-label {
		font-size: 0.78rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: theme('colors.gray.400');
		white-space: nowrap;
	}

	.swap-track {
		display: inline-flex;
		padding: 2px;
		background: theme('colors.gray.100');
		border-radius: 5px;
	}

	.swap-opt {
		font-family: theme('fontFamily.mono');
		font-size: 0.82rem;
		padding: 0.28rem 0.7rem;
		border-radius: 4px;
		color: theme('colors.gray.500');
		white-space: nowrap;
		transition: background 0.18s ease, color 0.18s ease;

		&:hover {
			color: theme('colors.gray.800');
		}

		&.active {
			background: white;
			color: theme('colors.purple.700');
			font-weight: 600;
			box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
		}
	}
</style>
