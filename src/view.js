import mermaid from 'mermaid';

document.addEventListener('DOMContentLoaded', () => {
	// Initialize mermaid with default config
	mermaid.initialize({
		startOnLoad: false,
		theme: 'default',
		securityLevel: 'loose',
		htmlLabels: true
	});

	// Find all mermaid chart containers
	const mermaidDivs = document.querySelectorAll('.mermaid-chart-block .mermaid');

	mermaidDivs.forEach(async (div) => {
		try {
			// Get attributes from data properties
			const theme = div.dataset.theme || 'default';
			const fontSize = parseInt(div.dataset.fontsize, 10) || 16;
			const direction = div.dataset.direction || 'TB';

			// Reset mermaid configuration for this chart
			mermaid.initialize({
				startOnLoad: false,
				theme: theme,
				fontSize: fontSize,
				flowchart: {
					defaultRenderer: 'dagre-d3',
					orientation: direction
				},
				securityLevel: 'loose',
				htmlLabels: true
			});

			// Get the diagram code
			const graphDefinition = div.textContent.trim();

			// Create container like in editor
			const container = document.createElement('div');
			container.style.display = 'flex';
			container.style.justifyContent = 'center';
			container.style.width = '100%';
			container.className = 'mermaid-target';

			// Generate and insert SVG
			const { svg } = await mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, graphDefinition);
			container.innerHTML = svg;

			div.innerHTML = '';
			div.appendChild(container);
			div.style.display = 'block';
		} catch (error) {
			console.error('Mermaid rendering error:', error);
			div.innerHTML = `<p class="mermaid-error">Error rendering diagram: ${error.message}</p>`;
		}
	});
});
