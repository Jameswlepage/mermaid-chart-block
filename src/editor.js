import {
	useBlockProps,
	InspectorControls
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import {
	Card,
	CardHeader,
	CardBody,
	PanelBody,
	SelectControl,
	RangeControl,
	ToggleControl,
	TextareaControl,
	TabPanel,
	Button,
	Tooltip,
	CheckboxControl
} from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import mermaid from 'mermaid';

// Initialize mermaid for the editor preview
mermaid.initialize({
	startOnLoad: false,
	theme: 'default',
	securityLevel: 'loose',
	htmlLabels: true
});

const Edit = ({ attributes, setAttributes }) => {
	const blockProps = useBlockProps();

	const {
		content,
		theme,
		fontSize,
		diagramDirection,
		isDraggable
	} = attributes;

	const [code, setCode] = useState(content || '');
	const [error, setError] = useState(null);
	const [isRendering, setIsRendering] = useState(false);
	const [aiMode, setAiMode] = useState(content ? 'edit' : 'generate');
	const [aiPrompt, setAiPrompt] = useState('');

	// For controlling the preview
	const previewRef = useRef(null);
	const [activeTab, setActiveTab] = useState('markup');

	// Update aiMode when code changes
	useEffect(() => {
		if (code && aiMode === 'generate') {
			setAiMode('edit');
		} else if (!code && aiMode === 'edit') {
			setAiMode('generate');
		}
	}, [code]);

	// Helper function to display messages in the preview area
	const displayMessage = (message, type = 'info') => {
		if (previewRef.current) {
			previewRef.current.innerHTML = `
				<div class="preview-message ${type}" style="
					padding: 16px;
					color: ${type === 'error' ? '#cc1818' : '#1e1e1e'};
					background: ${type === 'error' ? '#f8dcdc' : '#f0f0f0'};
					border-radius: 2px;
					margin: 8px 0;
					font-size: 13px;
				">
					${message}
				</div>
			`;
		}
	};

	// Rerender mermaid whenever code, theme, etc. changes AND user is on preview
	useEffect(() => {
		if (activeTab !== 'preview' || !previewRef.current) {
			return;
		}

		if (!code || !code.trim()) {
			displayMessage('Enter some Mermaid diagram code to see a preview.');
			return;
		}

		setIsRendering(true);
		setError(null);

		try {
			// Reset mermaid configuration
			mermaid.initialize({
				startOnLoad: false,
				theme,
				fontSize,
				flowchart: {
					direction: diagramDirection
				},
				securityLevel: 'loose',
				htmlLabels: true
			});

			const previewEl = previewRef.current;
			previewEl.innerHTML = '';

			const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
			const container = document.createElement('div');
			container.id = id;
			container.className = 'mermaid';
			container.style.display = 'flex';
			container.style.justifyContent = 'center';
			container.style.width = '100%';
			container.textContent = code;
			previewEl.appendChild(container);

			// First validate the syntax
			mermaid.parse(code)
				.then(() => {
					// If syntax is valid, render the diagram
					return mermaid.render(id, code);
				})
				.then(({ svg }) => {
					container.innerHTML = svg;
					// Ensure SVG is visible and properly sized
					const svgElement = container.querySelector('svg');
					if (svgElement) {
						svgElement.style.maxWidth = '100%';
						svgElement.style.height = 'auto';
						svgElement.style.display = 'block';
						svgElement.style.margin = '0 auto';
					}
					setError(null);
					setIsRendering(false);
				})
				.catch((err) => {
					console.error('Mermaid rendering error:', err);
					setError(err.message);
					setIsRendering(false);
					displayMessage(
						`Unable to render diagram: ${err.str || err.message}. Please check your syntax.`,
						'error'
					);

					// Add error details to help debug specific issues
					if (err.hash) {
						const details = [];
						if (err.hash.expected) {
							details.push(`Expected: ${err.hash.expected.join(', ')}`);
						}
						if (err.hash.token) {
							details.push(`Found: ${err.hash.token}`);
						}
						if (err.hash.line) {
							details.push(`Line: ${err.hash.line}`);
						}
						if (details.length > 0) {
							displayMessage(details.join('\n'), 'error');
						}
					}
				});
		} catch (err) {
			console.error('Mermaid initialization error:', err);
			setError(err.message);
			setIsRendering(false);
			displayMessage(
				`Failed to initialize diagram renderer: ${err.message}`,
				'error'
			);
		}
	}, [code, theme, fontSize, diagramDirection, activeTab]);

	const tabs = [
		{
			name: 'markup',
			title: __('Markup', 'mermaid-chart-block'),
			className: 'mcb-markup-tab'
		},
		{
			name: 'preview',
			title: __('Preview', 'mermaid-chart-block'),
			className: 'mcb-preview-tab'
		}
	];

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Diagram Settings', 'mermaid-chart-block')}>
					<SelectControl
						label={__('Theme', 'mermaid-chart-block')}
						value={theme}
						options={[
							{ label: 'Default', value: 'default' },
							{ label: 'Forest', value: 'forest' },
							{ label: 'Dark', value: 'dark' },
							{ label: 'Neutral', value: 'neutral' }
						]}
						onChange={(value) => setAttributes({ theme: value })}
					/>
					<RangeControl
						label={__('Font Size', 'mermaid-chart-block')}
						value={fontSize}
						onChange={(value) => setAttributes({ fontSize: value })}
						min={12}
						max={24}
					/>
					<SelectControl
						label={__('Diagram Direction', 'mermaid-chart-block')}
						value={diagramDirection}
						options={[
							{ label: 'Top to Bottom', value: 'TB' },
							{ label: 'Bottom to Top', value: 'BT' },
							{ label: 'Left to Right', value: 'LR' },
							{ label: 'Right to Left', value: 'RL' }
						]}
						onChange={(value) => setAttributes({ diagramDirection: value })}
					/>
					<ToggleControl
						label={__('Enable Dragging', 'mermaid-chart-block')}
						help={__('Allow diagram to be dragged around', 'mermaid-chart-block')}
						checked={isDraggable}
						onChange={(value) => setAttributes({ isDraggable: value })}
					/>
				</PanelBody>
				<PanelBody title={__('AI Creator', 'mermaid-chart-block')} initialOpen={false}>
					<TextareaControl
						label={aiMode === 'generate' ?
							__('Describe your diagram', 'mermaid-chart-block') :
							__('How would you like to modify the diagram?', 'mermaid-chart-block')
						}
						value={aiPrompt}
						onChange={(value) => setAiPrompt(value)}
						rows={4}
					/>
					<div style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '8px',
						marginTop: '8px'
					}}>
						<Tooltip text={
							!code ?
								__('Edit mode is disabled when no diagram exists', 'mermaid-chart-block') :
								__('Switch between generating new diagrams or editing existing ones', 'mermaid-chart-block')
						}>
							<div style={{ flex: '1' }}>
								<CheckboxControl
									label={__('Edit', 'mermaid-chart-block')}
									checked={aiMode === 'edit'}
									onChange={(value) => setAiMode(value ? 'edit' : 'generate')}
									disabled={!code}
								/>
							</div>
						</Tooltip>
						<Button
							variant="primary"
							style={{ flex: '1', textAlign: 'center' }}
							onClick={() => {
								// TODO: Implement AI generation/editing logic
								console.log('AI Prompt:', aiPrompt, 'Mode:', aiMode);
							}}
						>
							{aiMode === 'generate' ?
								code ? __('Generate (Overwrites)', 'mermaid-chart-block') : __('Generate', 'mermaid-chart-block') :
								__('Edit', 'mermaid-chart-block')
							}
						</Button>
					</div>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				<Card>
					<CardHeader>
						<div style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							width: '100%'
						}}>
							<h2 style={{
								margin: 0,
								fontSize: '13px',
								fontWeight: 'bold',
								fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif'
							}}>
								{__('Mermaid Chart', 'mermaid-chart-block')}
							</h2>
							<TabPanel
								className="mcb-tab-panel"
								activeClass="is-active"
								onSelect={(tabName) => setActiveTab(tabName)}
								tabs={tabs}
							>
								{() => null}
							</TabPanel>
						</div>
					</CardHeader>
					<CardBody>
						{activeTab === 'markup' && (
							<div className="mermaid-code-editor">
								<TextareaControl
									value={code}
									onChange={(newCode) => {
										setCode(newCode);
										setAttributes({ content: newCode, diagramCode: newCode });
									}}
									rows={10}
									__nextHasNoMarginBottom={true}
								/>
							</div>
						)}
						{activeTab === 'preview' && (
							<div
								className="mermaid-preview"
								ref={previewRef}
								style={{
									minHeight: '200px',
									position: 'relative',
									padding: '16px',
									background: '#fff',
									border: '1px solid #e0e0e0',
									borderRadius: '2px'
								}}
							>
								{isRendering && (
									<div style={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										padding: '16px',
										background: '#f0f0f0',
										borderRadius: '2px',
										fontSize: '13px',
										zIndex: 1
									}}>
										Rendering diagram...
									</div>
								)}
							</div>
						)}
					</CardBody>
				</Card>
			</div>
		</>
	);
};

export default Edit;
