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
	CheckboxControl,
	Snackbar
} from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import mermaid from 'mermaid';
import AIIcon from './icons/aiIcon';

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
	const [isAiLoading, setIsAiLoading] = useState(false);
	const [showSuccessNotice, setShowSuccessNotice] = useState(false);
	const [aiError, setAiError] = useState(null);

	// Get AI Services capabilities
	const { hasAvailableServices, getAvailableService, aiCapabilities } = useSelect((select) => {
		// Safety check for AI Services initialization
		if (!window.aiServices?.ai) {
			return {
				hasAvailableServices: false,
				getAvailableService: null,
				aiCapabilities: null
			};
		}

		const { enums, store: aiStore } = window.aiServices.ai;
		const AI_CAPABILITIES = [enums.AiCapability.TEXT_GENERATION];

		return {
			hasAvailableServices: select(aiStore).hasAvailableServices(),
			getAvailableService: select(aiStore).getAvailableService(AI_CAPABILITIES),
			aiCapabilities: AI_CAPABILITIES
		};
	}, []);

	// For controlling the preview
	const previewRef = useRef(null);
	const [activeTab, setActiveTab] = useState('markup');

	// Handle AI generation/editing
	const handleAiRequest = async () => {
		if (!window.aiServices?.ai) {
			setAiError(__('AI Services plugin is not properly initialized. Please check if it\'s activated.', 'mermaid-chart-block'));
			return;
		}

		const { helpers } = window.aiServices.ai;

		if (!hasAvailableServices || !getAvailableService) {
			setAiError(__('No AI service available. Please configure an AI service in the WordPress settings.', 'mermaid-chart-block'));
			return;
		}

		if (!aiPrompt.trim()) {
			setAiError(__('Please enter a prompt', 'mermaid-chart-block'));
			return;
		}

		setIsAiLoading(true);
		setAiError(null);

		try {
			// Build a comprehensive system prompt
			const systemPrompt = `You are a Mermaid diagram expert. Create a valid Mermaid diagram based on the request.
Always wrap your response in a markdown code block like this:

\`\`\`mermaid
flowchart TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    B -->|No| D[Not OK]
\`\`\`

NEVER add any explanations or text before or after the code block.
STOP immediately after the closing \`\`\`.

Here are two more examples of valid responses:

\`\`\`mermaid
sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
    Alice-)John: See you later!
\`\`\`

\`\`\`mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal: +int age
    Animal: +String gender
    Duck: +String beakColor
    Fish: -int sizeInFeet
\`\`\``;

			// Build the user prompt based on mode
			const userPrompt = aiMode === 'edit'
				? `Current Diagram:\n\`\`\`mermaid\n${code}\n\`\`\`\n\nModify the diagram to: ${aiPrompt}`
				: `Create a Mermaid diagram that: ${aiPrompt}`;

			// Combine prompts for the AI
			const fullPrompt = `${systemPrompt}\n\nUser Request: ${userPrompt}`;

			const candidates = await getAvailableService.generateText(
				fullPrompt,
				{
					feature: 'mermaid-chart-block',
					temperature: 0.7,
					maxTokens: 1000,
				}
			);

			// Extract and clean the Mermaid code
			let mermaidCode = helpers
				.getTextFromContents(
					helpers.getCandidateContents(candidates)
				)
				.trim()
				// Extract content between ```mermaid and ```
				.replace(/^[\s\S]*?```mermaid\n([\s\S]*?)\n```[\s\S]*$/, '$1')
				.trim();

			// Validate the Mermaid code
			try {
				await mermaid.parse(mermaidCode);

				// Update the code state and attributes
				setCode(mermaidCode);
				setAttributes({ content: mermaidCode, diagramCode: mermaidCode });

				// Show success message
				setShowSuccessNotice(true);

				// Clear the prompt
				setAiPrompt('');
			} catch (parseError) {
				throw new Error(__('The AI generated invalid Mermaid syntax. Please try again.', 'mermaid-chart-block'));
			}
		} catch (err) {
			console.error('AI generation error:', err);
			setAiError(err.message || __('Failed to generate diagram', 'mermaid-chart-block'));
		} finally {
			setIsAiLoading(false);
		}
	};

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
				< div class="preview-message ${type}" style = "
			padding: 16px;
			color: ${type === 'error' ? '#cc1818' : '#1e1e1e'};
			background: ${type === 'error' ? '#f8dcdc' : '#f0f0f0'};
			border - radius: 2px;
			margin: 8px 0;
			font - size: 13px;
			">
					${message}
				</div >
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

			const id = `mermaid - ${Math.random().toString(36).substr(2, 9)} `;
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
							details.push(`Expected: ${err.hash.expected.join(', ')} `);
						}
						if (err.hash.token) {
							details.push(`Found: ${err.hash.token} `);
						}
						if (err.hash.line) {
							details.push(`Line: ${err.hash.line} `);
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
				`Failed to initialize diagram renderer: ${err.message} `,
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
				{hasAvailableServices && getAvailableService && (
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
								style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
								onClick={handleAiRequest}
								disabled={isAiLoading || !aiPrompt.trim()}
								isBusy={isAiLoading}
							>
								<AIIcon height="16" />
								{isAiLoading ? __('Generating...', 'mermaid-chart-block') :
									aiMode === 'generate' ?
										code ? __('Generate (Overwrites)', 'mermaid-chart-block') : __('Generate', 'mermaid-chart-block') :
										__('Edit', 'mermaid-chart-block')
								}
							</Button>
							{aiError && (
								<div style={{
									color: '#cc1818',
									fontSize: '12px',
									marginTop: '8px'
								}}>
									{aiError}
								</div>
							)}
						</div>
					</PanelBody>
				)}
			</InspectorControls>

			{showSuccessNotice && (
				<Snackbar
					onDismiss={() => setShowSuccessNotice(false)}
				>
					{aiMode === 'generate'
						? __('Diagram generated successfully!', 'mermaid-chart-block')
						: __('Diagram updated successfully!', 'mermaid-chart-block')
					}
				</Snackbar>
			)}

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
