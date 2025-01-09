import { registerBlockType } from '@wordpress/blocks';
import EditMermaid from './editor';
import './style.scss'; // We'll build into style.css

registerBlockType( 'mermaid-chart/block', {
	attributes: {
		content: {
			type: 'string',
			default: '',
		}
	},
	edit: EditMermaid
	// We omit 'save' because block.json has "render", so it's dynamic.
});
