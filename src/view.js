import mermaid from 'mermaid';

document.addEventListener('DOMContentLoaded', () => {
	// Initialize mermaid with default config
	mermaid.initialize({
		startOnLoad: false, // We'll manually render
		theme: 'default',
		securityLevel: 'loose', // Required for some diagram types
	});

	// Find all mermaid chart containers
	const mermaidDivs = document.querySelectorAll('.mermaid-chart-block .mermaid');

	mermaidDivs.forEach(async (div) => {
		try {
			// Get attributes from data properties
			const theme = div.dataset.theme || 'default';
			const fontSize = parseInt(div.dataset.fontsize, 10) || 16;
			const direction = div.dataset.direction || 'TB';

			// Update configuration for this specific chart
			const config = {
				theme: theme,
				fontSize: fontSize,
				flowchart: {
					defaultRenderer: 'dagre-d3',
					orientation: direction,
				}
			};

			// Get the diagram code
			const graphDefinition = div.textContent.trim();

			// Generate and insert SVG
			const { svg } = await mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, graphDefinition, div);
			div.innerHTML = svg;
		} catch (error) {
			console.error('Mermaid rendering error:', error);
			div.innerHTML = `<p class="mermaid-error">Error rendering diagram: ${error.message}</p>`;
		}
	});
});
