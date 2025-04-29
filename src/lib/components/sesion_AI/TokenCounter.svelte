<script>
	export let text = '';

	$: wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
	$: charCount = text.length;
	$: tokenCount = Math.ceil(wordCount * 1.3); // Estimación de tokens

	function formatNumber(num) {
		if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'k';
		}
		return num;
	}
</script>

<div class="token-stats">
	<div class="stat-item" class:warning={tokenCount > 500}>
		<span class="stat-value">{formatNumber(tokenCount)}</span>
		<span class="stat-label">tokens</span>
	</div>
	<div class="stat-item">
		<span class="stat-value">{formatNumber(wordCount)}</span>
		<span class="stat-label">palabras</span>
	</div>
	<div class="stat-item">
		<span class="stat-value">{formatNumber(charCount)}</span>
		<span class="stat-label">caracteres</span>
	</div>
</div>

<style>
	.token-stats {
		display: flex;
		gap: 0.8rem;
		padding: 0.5rem 0.8rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		font-size: 0.85rem;
		justify-content: center;
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		transition: all 0.2s;
		background: rgba(255, 255, 255, 0.05);
	}

	.stat-value {
		font-weight: 600;
		color: var(--accent-color);
		min-width: 2.5em;
		text-align: right;
	}

	.stat-label {
		color: var(--secondary-text);
		font-size: 0.75rem;
	}

	.warning {
		background: rgba(255, 159, 67, 0.15);
	}

	.warning .stat-value {
		color: #ff9f43;
	}
</style>
