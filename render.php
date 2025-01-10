<?php

/**
 * Server-side render for "mermaid-chart/block".
 */

if (! defined('ABSPATH')) {
	exit;
}

// Get the diagram code
$diagram_code = '';
if (! empty($attributes['content'])) {
	$diagram_code = $attributes['content'];
} elseif (! empty($attributes['diagramCode'])) {
	$diagram_code = $attributes['diagramCode'];
}

// Clean up the code
$diagram_code = trim($diagram_code);

// Get wrapper attributes
$wrapper_attributes = get_block_wrapper_attributes(array(
	'data-draggable' => ! empty($attributes['isDraggable']) ? 'true' : 'false',
	'class' => 'mermaid-chart-block'
));

// Get theme and other attributes
$theme = ! empty($attributes['theme']) ? $attributes['theme'] : 'default';
$font_size = ! empty($attributes['fontSize']) ? $attributes['fontSize'] : 16;
$direction = ! empty($attributes['diagramDirection']) ? $attributes['diagramDirection'] : 'TB';
?>
<div <?php echo wp_kses_post($wrapper_attributes); ?>>
	<?php if (! empty($diagram_code)) : ?>
		<div class="mermaid"
			data-theme="<?php echo esc_attr($theme); ?>"
			data-fontsize="<?php echo esc_attr($font_size); ?>"
			data-direction="<?php echo esc_attr($direction); ?>">
			<?php echo wp_kses_post($diagram_code); ?>
		</div>
	<?php endif; ?>
</div>