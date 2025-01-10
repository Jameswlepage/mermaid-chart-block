<?php

/**
 * Plugin Name: Mermaid Chart Block
 * Description: Mermaid Chart Block is a Gutenberg block that allows you to create Mermaid diagrams.
 * Version:     1.0.0
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * Author:      James LePage (AI @ A8C)
 * Author URI:  https://j.cv
 * Text Domain: mermaid-chart-block
 * Requires Plugins: ai-services
 */

namespace MCB;

if (! defined('ABSPATH')) {
	exit;
}

// Import WordPress functions
use function add_action;
use function register_block_type;

/**
 * Register our block using the block.json file.
 */
function register_mermaid_chart_block()
{
	if (!function_exists('ai_services')) {
		return;
	}

	$metadata_file = __DIR__ . '/block.json';
	register_block_type($metadata_file);
}
add_action('init', __NAMESPACE__ . '\\register_mermaid_chart_block');

/**
 * Enqueue editor assets
 */
add_action(
	'enqueue_block_editor_assets',
	static function () {
		if (!function_exists('ai_services')) {
			return;
		}

		wp_enqueue_script(
			'mermaid-chart-block-editor',
			plugin_dir_url(__FILE__) . 'build/index.js',
			array(
				'wp-block-editor',
				'wp-blocks',
				'wp-components',
				'wp-element',
				'wp-i18n',
				'ais-ai',
				'wp-data'
			),
			'1.0.0',
			array('strategy' => 'defer')
		);
	}
);
