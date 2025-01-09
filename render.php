<?php
/**
 * Server-side render for "mermaid-chart/block".
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Get the diagram code
$diagram_code = '';
if ( ! empty( $attributes['content'] ) ) {
	$diagram_code = $attributes['content'];
} elseif ( ! empty( $attributes['diagramCode'] ) ) {
	$diagram_code = $attributes['diagramCode'];
}

// Clean up the code
$diagram_code = trim( $diagram_code );

// Get wrapper attributes
$wrapper_attributes = get_block_wrapper_attributes( array(
	'data-draggable' => ! empty( $attributes['isDraggable'] ) ? 'true' : 'false',
) );

?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>>
	<?php if ( ! empty( $diagram_code ) ) : ?>
		<div class="mermaid" style="display: none;">
			<?php echo wp_kses_post( $diagram_code ); ?>
		</div>
		<div class="mermaid-target"></div>
	<?php endif; ?>
</div>
