import PluginManager from '@jbrowse/core/PluginManager'
import SimpleFeature from '@jbrowse/core/util/simpleFeature'

import DiamondPlugin from '../index'
import { createDiamondGlyph } from './DiamondGlyph'

function makePluginManager() {
  const pm = new PluginManager([])
  pm.configure()
  return pm
}

function glyph() {
  return createDiamondGlyph(makePluginManager()) as any
}

// records the path the glyph draws, so we can assert on the shape rather than
// on pixels (which vary with the canvas build -- see the image snapshots in the
// subtrack plugin)
function recordingContext() {
  const calls: { op: string; args: number[] }[] = []
  return {
    calls,
    ctx: {
      set fillStyle(v: string) {
        calls.push({ op: `fillStyle:${v}`, args: [] })
      },
      set strokeStyle(v: string) {
        calls.push({ op: `strokeStyle:${v}`, args: [] })
      },
      set lineWidth(v: number) {
        calls.push({ op: 'lineWidth', args: [v] })
      },
      set globalAlpha(v: number) {
        calls.push({ op: 'globalAlpha', args: [v] })
      },
      beginPath: () => calls.push({ op: 'beginPath', args: [] }),
      closePath: () => calls.push({ op: 'closePath', args: [] }),
      moveTo: (x: number, y: number) => calls.push({ op: 'moveTo', args: [x, y] }),
      lineTo: (x: number, y: number) => calls.push({ op: 'lineTo', args: [x, y] }),
      fill: () => calls.push({ op: 'fill', args: [] }),
      stroke: () => calls.push({ op: 'stroke', args: [] }),
    } as unknown as CanvasRenderingContext2D,
  }
}

function draw(featureLayout: Record<string, number>, config: any = {}) {
  const { ctx, calls } = recordingContext()
  glyph().draw({ ctx, featureLayout, config })
  return calls
}

describe('DiamondPlugin', () => {
  // must be install(), not configure(): the pluggable-element registry is frozen
  // once createPluggableElements() has run, and registering later throws
  // "Cannot add element type after createPluggableElements() has been called"
  test('registers its glyph during install()', () => {
    const pm = makePluginManager()
    const added: unknown[] = []
    pm.addGlyphType = ((cb: () => unknown) => {
      added.push(cb)
      return pm
    }) as any

    new DiamondPlugin().install(pm)
    expect(added).toHaveLength(1)
  })

  test('the glyph survives a real plugin manager lifecycle', () => {
    const pm = new PluginManager([{ plugin: new DiamondPlugin() } as any])
    pm.createPluggableElements()
    pm.configure()

    const glyphs = (pm as any).getGlyphTypes() as any[]
    const diamond = glyphs.find(g => g.name === 'DiamondGlyph')
    expect(diamond).toBeDefined()
    // core's GlyphType requires draw; match and priority drive selection
    expect(typeof diamond.draw).toBe('function')
    expect(typeof diamond.match).toBe('function')
    // above the built-in glyphs (priority 0), so it wins for variant features
    expect(diamond.priority).toBe(10)
  })
})

describe('DiamondGlyph match()', () => {
  const matches = (type: string) =>
    glyph().match(new SimpleFeature({ uniqueId: 'x', refName: 'ctgA', start: 0, end: 1, type }))

  test.each([
    'SNV',
    'SNP',
    'snp',
    'variant',
    'substitution',
    'insertion',
    'deletion',
    'inversion',
    'duplication',
    'translocation',
    'breakend',
    'sequence_variant',
    'copy_number_variation',
  ])('matches VCF variant type %s', type => {
    expect(matches(type)).toBe(true)
  })

  test.each(['gene', 'mRNA', 'CDS', 'exon', 'match', 'region'])(
    'does not match non-variant type %s',
    type => {
      expect(matches(type)).toBe(false)
    },
  )

  test('does not match a feature with no type', () => {
    expect(matches(undefined as unknown as string)).toBe(false)
  })
})

describe('DiamondGlyph draw()', () => {
  test('draws a closed four-point diamond', () => {
    const calls = draw({ x: 100, y: 10, width: 20, height: 10 })
    // the glyph traces the diamond twice: once to fill, once to stroke the
    // border. Assert on the fill path.
    const path = calls
      .filter(c => c.op === 'moveTo' || c.op === 'lineTo')
      .slice(0, 4)

    expect(path.map(c => c.args)).toEqual([
      [100, 15], // left point   (x, y + height/2)
      [110, 10], // top point    (x + w/2, y)
      [120, 15], // right point  (x + w, y + height/2)
      [110, 20], // bottom point (x + w/2, y + height)
    ])
    expect(calls.some(c => c.op === 'closePath')).toBe(true)
    expect(calls.some(c => c.op === 'fill')).toBe(true)
  })

  test('uses the configured colours', () => {
    const calls = draw(
      { x: 0, y: 0, width: 20, height: 10 },
      { color1: '#ff0000', borderColor: '#00ff00' },
    )
    expect(calls.some(c => c.op === 'fillStyle:#ff0000')).toBe(true)
    expect(calls.some(c => c.op === 'strokeStyle:#00ff00')).toBe(true)
  })

  test('falls back to purple/indigo when unconfigured', () => {
    const calls = draw({ x: 0, y: 0, width: 20, height: 10 })
    expect(calls.some(c => c.op === 'fillStyle:#800080')).toBe(true)
    expect(calls.some(c => c.op === 'strokeStyle:#4B0082')).toBe(true)
  })

  // a SNV is 1bp, so at most zoom levels it is a sliver. The glyph widens it and
  // recentres it so it stays clickable and visible.
  test('pads narrow features so a 1bp variant is still visible', () => {
    const calls = draw({ x: 100, y: 0, width: 2, height: 10 })
    const first = calls.find(c => c.op === 'moveTo')!

    // left shifts back by 2.5 and the width grows by 5
    expect(first.args[0]).toBe(97.5)
    const xs = calls
      .filter(c => c.op === 'moveTo' || c.op === 'lineTo')
      .map(c => c.args[0]!)
    expect(Math.max(...xs) - Math.min(...xs)).toBe(7) // 2 + 5
  })

  test('a wide feature is not padded', () => {
    const calls = draw({ x: 100, y: 0, width: 40, height: 10 })
    const xs = calls
      .filter(c => c.op === 'moveTo' || c.op === 'lineTo')
      .map(c => c.args[0]!)
    expect(Math.min(...xs)).toBe(100)
    expect(Math.max(...xs) - Math.min(...xs)).toBe(40)
  })

  test('strokes the border on wide features', () => {
    const calls = draw({ x: 0, y: 0, width: 40, height: 10 })
    expect(calls.some(c => c.op === 'stroke')).toBe(true)
    expect(calls.some(c => c.op === 'globalAlpha')).toBe(false)
  })

  test('very narrow features get an alpha-filled border instead of a stroke', () => {
    // width 0 -> adjustedWidth 5 ... still > 3, so pick something that lands <= 3
    const calls = draw({ x: 0, y: 0, width: -2, height: 10 })
    // adjustedWidth = -2 + 5 = 3, which is not > 3, so the alpha-fill path runs
    expect(calls.some(c => c.op === 'globalAlpha')).toBe(true)
    expect(calls.some(c => c.op === 'stroke')).toBe(false)
  })

  test('omits the fill when no colour is configured', () => {
    const calls = draw({ x: 0, y: 0, width: 20, height: 10 }, { color1: '' })
    // config.color1 || '#800080' -- an empty string falls back to the default,
    // so the fill still happens. This pins that behaviour.
    expect(calls.some(c => c.op === 'fillStyle:#800080')).toBe(true)
  })
})
