<?php
/**
 * Plugin Name: Mermaid Chart Block
 * Plugin URI:  https://example.com/
 * Description: A production-ready Gutenberg block using PNPM, Webpack, and a local package "mmc" for diagram rendering.
 * Version:     1.0.0
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * Author:      Your Name
 * Text Domain: mermaid-chart-block
 */

namespace MCB;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Import WordPress functions
use function add_action;
use function register_block_type;
use function plugin_dir_path;
use function plugins_url;
use function wp_enqueue_script;
use function wp_register_script;

/**
 * Register our block using the block.json file.
 */
function register_mermaid_chart_block() {
	$metadata_file = __DIR__ . '/block.json';
	register_block_type( $metadata_file );
}
add_action( 'init', __NAMESPACE__ . '\\register_mermaid_chart_block' );

function enqueue_mermaid_chart_block_assets() {
	$asset_file = include(plugin_dir_path(__FILE__) . 'build/index.asset.php');
	
	// Only enqueue editor script in admin
	if (is_admin()) {
		wp_enqueue_script(
			'mermaid-chart-block-editor',
			plugins_url('build/index.js', __FILE__),
			$asset_file['dependencies'],
			$asset_file['version']
		);
	}
}
add_action('enqueue_block_editor_assets', __NAMESPACE__ . '\\enqueue_mermaid_chart_block_assets');

// Separate function for frontend scripts
function enqueue_frontend_scripts() {
	if (has_block('mermaid-chart/block')) {
		wp_enqueue_script(
			'mermaid-chart-block-view',
			plugins_url('build/view.js', __FILE__),
			[],
			'1.0.0',
			true  // Load in footer
		);

		// Add inline script to ensure mermaid is initialized
		wp_add_inline_script('mermaid-chart-block-view', 'window.mermaid && window.mermaid.initialize({ startOnLoad: true });', 'after');
	}
}
add_action('wp_enqueue_scripts', __NAMESPACE__ . '\\enqueue_frontend_scripts');
