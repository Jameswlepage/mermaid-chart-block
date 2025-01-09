import mermaid from 'mermaid';

// Initialize mermaid with default config
mermaid.initialize({
	startOnLoad: false,
	theme: 'default',
	securityLevel: 'loose',
	htmlLabels: true,
});

function makeDraggable(svgElement) {
	let selectedElement = null;
	let offset = { x: 0, y: 0 };
	let transform = { x: 0, y: 0 };

	function startDrag(evt) {
		if (evt.target.closest('.node, .cluster')) {
			selectedElement = evt.target.closest('.node, .cluster');
			offset.x = evt.clientX - transform.x;
			offset.y = evt.clientY - transform.y;
		}
	}

	function drag(evt) {
		if (selectedElement) {
			evt.preventDefault();
			transform.x = evt.clientX - offset.x;
			transform.y = evt.clientY - offset.y;
			selectedElement.setAttribute('transform', `translate(${transform.x},${transform.y})`);
		}
	}

	function endDrag() {
		selectedElement = null;
	}

	svgElement.addEventListener('mousedown', startDrag);
	svgElement.addEventListener('mousemove', drag);
	svgElement.addEventListener('mouseup', endDrag);
	svgElement.addEventListener('mouseleave', endDrag);

	const nodes = svgElement.querySelectorAll('.node, .cluster');
	nodes.forEach(node => {
		node.style.cursor = 'move';
	});
}

function normalizeCode(code) {
	// A simple helper to decode HTML entities
	const decodeHTML = (html) => {
		const txt = document.createElement('textarea');
		txt.innerHTML = html;
		return txt.value;
	};

	// Decode once
	let decoded = decodeHTML(code);

	// Replace arrow variants with standard Mermaid arrow "-->"
	// Also fix possible leftover &gt; characters.
	decoded = decoded
		.replace(/–>/g, '-->')
		.replace(/—>/g, '-->')
		.replace(/->/g, '-->')
		.replace(/&gt;/g, '>')
		.replace(/\s*-->\s*/g, ' --> ');

	// Trim any leftover spaces or newlines
	return decoded.trim();
}

window.addEventListener('DOMContentLoaded', () => {
	const blocks = document.querySelectorAll('.wp-block-mermaid-chart-block');

	blocks.forEach((blockEl) => {
		const sourceDiv = blockEl.querySelector('.mermaid');
		const targetDiv = blockEl.querySelector('.mermaid-target');
		
		if (!sourceDiv || !targetDiv) {
			return;
		}

		try {
			let code = normalizeCode(sourceDiv.textContent);

			// For debugging: see exactly what is passed to mermaid.
			console.log('Final Mermaid code:', code);

			if (!code) return;

			const id = `mermaid-${Math.random().toString(36).slice(2)}`;
			targetDiv.id = id;

			const errorDiv = document.createElement('div');
			errorDiv.className = 'mermaid-error';
			targetDiv.appendChild(errorDiv);

			mermaid.render(id, code)
				.then(({ svg }) => {
					targetDiv.innerHTML = svg;

					// Draggable if needed
					if (blockEl.getAttribute('data-draggable') === 'true') {
						const svgElement = targetDiv.querySelector('svg');
						if (svgElement) {
								makeDraggable(svgElement);
						}
					}

					// Make SVG responsive
					const svgElement = targetDiv.querySelector('svg');
					if (svgElement) {
						svgElement.style.maxWidth = '100%';
						svgElement.style.height = 'auto';
						svgElement.style.display = 'block';
						svgElement.style.margin = '0 auto';
					}
				})
				.catch(err => {
					console.error('Failed to render diagram:', err);
					errorDiv.textContent = `Failed to render diagram: ${err.message}`;
					errorDiv.style.display = 'block';
				});
		} catch (err) {
			console.error('Error setting up diagram:', err);
			targetDiv.innerHTML = `<div class="mermaid-error">Error setting up diagram: ${err.message}</div>`;
		}
	});
});
