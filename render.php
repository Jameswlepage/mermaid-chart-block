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
$background_color = ! empty($attributes['backgroundColor']) ? $attributes['backgroundColor'] : '#ffffff';
$padding = ! empty($attributes['padding']) ? $attributes['padding'] : 16;
$border_style = ! empty($attributes['borderStyle']) ? $attributes['borderStyle'] : 'dashed';

// Create inline styles for the wrapper
$style = sprintf(
	'background-color: %s; padding: %dpx; border: 1px %s #ccc;',
	esc_attr($background_color),
	esc_attr($padding),
	esc_attr($border_style)
);
?>
<div <?php echo wp_kses_post($wrapper_attributes); ?> style="<?php echo esc_attr($style); ?>">
	<?php if (! empty($diagram_code)) : ?>
		<div class="mermaid"
			data-theme="<?php echo esc_attr($theme); ?>"
			data-fontsize="<?php echo esc_attr($font_size); ?>"
			data-direction="<?php echo esc_attr($direction); ?>">
			<?php echo wp_kses_post($diagram_code); ?>
		</div>
	<?php endif; ?>
</div>