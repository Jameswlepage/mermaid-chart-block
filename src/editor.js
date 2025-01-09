import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { 
	TextareaControl, 
	PanelBody, 
	SelectControl,
	RangeControl,
	Button,
	ButtonGroup,
	ToggleControl,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
	startOnLoad: false,
	theme: 'default',
	securityLevel: 'loose'
});

const Edit = ({ attributes, setAttributes }) => {
	const blockProps = useBlockProps();
	const { 
		content,
		theme,
		fontSize,
		padding,
		borderStyle,
		diagramDirection,
		isDraggable,
	} = attributes;
	
	const [code, setCode] = useState(content || '');
	const [previewElement, setPreviewElement] = useState(null);
	const [isPreview, setIsPreview] = useState(false); // Start in markup view

	useEffect(() => {
		if (previewElement && code && isPreview) {
			try {
				previewElement.innerHTML = '';
				const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
				const container = document.createElement('div');
				container.id = id;
				container.className = 'mermaid';
				container.textContent = code;
				previewElement.appendChild(container);
				
				mermaid.initialize({
					startOnLoad: false,
					theme: theme,
					fontSize: fontSize,
					flowchart: {
						direction: diagramDirection
					},
					securityLevel: 'loose',
					htmlLabels: true,
				});

				mermaid.render(id, code).then(({ svg }) => {
					container.innerHTML = svg;
				});
			} catch (err) {
				console.error('Failed to render preview:', err);
				previewElement.innerHTML = `<div class="error-message">${err.message}</div>`;
			}
		}
	}, [code, previewElement, isPreview, theme, fontSize, diagramDirection]);

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
							{ label: 'Neutral', value: 'neutral' },
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
							{ label: 'Right to Left', value: 'RL' },
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
			</InspectorControls>
			<div {...blockProps}>
				<div className="mermaid-block-header">
					<h2>{__('Mermaid Chart', 'mermaid-chart-block')}</h2>
					<ButtonGroup className="mermaid-view-toggle">
						<Button 
							variant={!isPreview ? 'primary' : 'secondary'}
							onClick={() => setIsPreview(false)}
						>
							{__('Markup', 'mermaid-chart-block')}
						</Button>
						<Button
							variant={isPreview ? 'primary' : 'secondary'}
							onClick={() => setIsPreview(true)}
						>
							{__('Preview', 'mermaid-chart-block')}
						</Button>
					</ButtonGroup>
				</div>

				{!isPreview && (
					<div className="mermaid-code-editor">
						<TextareaControl
							value={code}
							onChange={(newCode) => {
								setCode(newCode);
								setAttributes({ content: newCode });
							}}
							rows={10}
							__nextHasNoMarginBottom={true}
						/>
					</div>
				)}
				
				<div 
					className="mermaid-preview"
					ref={setPreviewElement}
					style={{ display: isPreview ? 'block' : 'none' }}
				/>
			</div>
		</>
	);
};

export default Edit;
