import type PluginManager from '@jbrowse/core/PluginManager'

/**
 * Diamond Glyph - Renders features as diamond shapes
 * Ported from JBrowse1 VEuPath Plugins
 */
export function createDiamondGlyph(pluginManager: PluginManager) {
  // @ts-expect-error - GlyphType exists but may not be in type definitions
  const { GlyphType } = pluginManager.jbrequire(
    '@jbrowse/core/pluggableElementTypes',
  )

  return new GlyphType({
    name: 'DiamondGlyph',
    displayName: 'Diamond',
    draw: (context: any) => {
      const { ctx, featureLayout, config } = context
      const { x, y, width, height } = featureLayout

      // Get colors from config (with defaults)
      const color = config.color1 || '#800080' // purple default
      const borderColor = config.borderColor || '#4B0082' // indigo default

      // Calculate dimensions
      let left = x
      let adjustedWidth = width

      // Add padding for small features (SNPs, etc.)
      if (width <= 5) {
        adjustedWidth = width + 5
        left = left - 2.5
      }

      // Draw the diamond fill
      if (color) {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(left, y + height / 2) // left point
        ctx.lineTo(left + Math.max(1, adjustedWidth) / 2, y) // top point
        ctx.lineTo(left + Math.max(1, adjustedWidth), y + height / 2) // right point
        ctx.lineTo(left + Math.max(1, adjustedWidth) / 2, y + height) // bottom point
        ctx.closePath()
        ctx.fill()
      }

      // Draw the diamond border
      if (borderColor) {
        const lineWidth = 1

        if (adjustedWidth > 3) {
          ctx.lineWidth = lineWidth
          ctx.strokeStyle = borderColor
          ctx.beginPath()
          ctx.moveTo(left, y + height / 2)
          ctx.lineTo(left + Math.max(1, adjustedWidth) / 2, y)
          ctx.lineTo(left + Math.max(1, adjustedWidth), y + height / 2)
          ctx.lineTo(left + Math.max(1, adjustedWidth) / 2, y + height)
          ctx.closePath()
          ctx.stroke()
        } else {
          // For very small features, use filled border with alpha
          ctx.globalAlpha = (lineWidth * 2) / adjustedWidth
          ctx.fillStyle = borderColor
          ctx.beginPath()
          ctx.moveTo(left, y + height / 2)
          ctx.lineTo(left + Math.max(1, adjustedWidth) / 2, y)
          ctx.lineTo(left + Math.max(1, adjustedWidth), y + height / 2)
          ctx.lineTo(left + Math.max(1, adjustedWidth) / 2, y + height)
          ctx.closePath()
          ctx.fill()
          ctx.globalAlpha = 1
        }
      }
    },
    // Match function: Match variant features from VCF files
    // See: plugins/variants/src/VcfFeature/util.ts for VCF feature types
    match: (feature: any) => {
      const type = feature.get('type')
      // Match all VCF variant types
      return (
        type === 'SNV' ||
        type === 'SNP' ||
        type === 'snp' ||
        type === 'variant' ||
        type === 'substitution' ||
        type === 'insertion' ||
        type === 'deletion' ||
        type === 'inversion' ||
        type === 'duplication' ||
        type === 'translocation' ||
        type === 'breakend' ||
        type === 'sequence_variant' ||
        type === 'copy_number_variation'
      )
    },
    // Higher priority ensures this glyph is checked before built-in glyphs
    priority: 10,
  })
}
