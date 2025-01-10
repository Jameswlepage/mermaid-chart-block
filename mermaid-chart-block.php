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
	$metadata_file = __DIR__ . '/block.json';
	register_block_type($metadata_file);
}
add_action('init', __NAMESPACE__ . '\\register_mermaid_chart_block');
