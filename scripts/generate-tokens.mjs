import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const TOKENS_DIR = path.resolve('src/tokens')
const OUTPUT_FILE = path.resolve('theme.css')

const weightValues = {
  regular: 400,
  medium: 500,
  'semi-bold': 600,
  bold: 700,
}

const compareKeys = (a, b) => a.localeCompare(b, 'en', { numeric: true })

const formatNumber = (value) => {
  if (typeof value !== 'number') return String(value)
  const rounded = Number(value.toFixed(4))
  return rounded % 1 === 0 ? String(Math.trunc(rounded)) : String(rounded)
}

const REM_BASE = 16

const formatLengthPx = (value) => {
  const formatted = formatNumber(value)
  return formatted === '0' ? '0' : `${formatted}px`
}

const formatLengthRem = (value) => {
  if (typeof value !== 'number') return String(value)
  const formatted = formatNumber(value / REM_BASE)
  return formatted === '0' ? '0' : `${formatted}rem`
}

const formatFont = (value) => {
  const text = String(value)
  const escaped = text.replace(/"/g, '\\"')
  return `"${escaped}"`
}

const formatColor = (value) => {
  const components = value?.components
  const alpha = typeof value?.alpha === 'number' ? value.alpha : 1

  if (Array.isArray(components) && components.length === 3) {
    const [r, g, b] = components.map((c) => Math.round(c * 255))
    if (alpha === 1) return `rgb(${r} ${g} ${b})`
    return `rgb(${r} ${g} ${b} / ${formatNumber(alpha)})`
  }

  return value?.hex || '#000000'
}

const readJson = async (fileName) => {
  const filePath = path.join(TOKENS_DIR, fileName)
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

const addVars = (lines, vars) => {
  for (const [name, value] of vars) {
    lines.push(`  ${name}: ${value};`)
  }
}

const extractSchemeColors = (data) => {
  const vars = []
  const schemes = data?.schemes || {}
  for (const key of Object.keys(schemes).sort(compareKeys)) {
    const token = schemes[key]
    if (token?.$type !== 'color') continue
    vars.push([`--color-${key}`, formatColor(token.$value)])
  }
  return vars
}

const extractStateLayerColors = (data) => {
  const vars = []
  const root = data?.['state-layers'] || {}

  const walk = (node, pathParts) => {
    for (const key of Object.keys(node).sort(compareKeys)) {
      if (key.startsWith('$')) continue
      const value = node[key]
      if (value?.$type === 'color') {
        const name = ['--color', ...pathParts, key].join('-')
        vars.push([name, formatColor(value.$value)])
        continue
      }
      if (value && typeof value === 'object') {
        walk(value, [...pathParts, key])
      }
    }
  }

  walk(root, ['state-layers'])
  return vars
}

const extractStateLayerUtilities = (data) => {
  const lines = []
  const entries = []
  const root = data?.['state-layers'] || {}

  const walk = (node, pathParts) => {
    for (const key of Object.keys(node).sort(compareKeys)) {
      if (key.startsWith('$')) continue
      const value = node[key]
      if (value?.$type === 'color') {
        const className = [...pathParts, key].join('-')
        const varName = ['--color', 'state-layers', ...pathParts, key].join('-')
        entries.push({ className, varName })
        continue
      }
      if (value && typeof value === 'object') {
        walk(value, [...pathParts, key])
      }
    }
  }

  walk(root, [])

  if (entries.length === 0) return lines

  lines.push('  .state-layer {')
  lines.push('    position: relative;')
  lines.push('    overflow: hidden;')
  lines.push('  }')
  lines.push('  .state-layer::before {')
  lines.push('    content: "";')
  lines.push('    position: absolute;')
  lines.push('    inset: 0;')
  lines.push('    background-color: var(--state-layer-color, transparent);')
  lines.push('    opacity: 0;')
  lines.push('    transition: opacity 150ms ease;')
  lines.push('    pointer-events: none;')
  lines.push('  }')
  lines.push('  .state-layer:hover::before {')
  lines.push('    opacity: 1;')
  lines.push('  }')

  for (const entry of entries) {
    lines.push(`  .${entry.className} {`)
    lines.push(`    --state-layer-color: var(${entry.varName});`)
    lines.push('  }')
  }

  return lines
}

const extractFonts = (data) => {
  const vars = []
  const fonts = data?.static?.font || {}
  for (const key of Object.keys(fonts).sort(compareKeys)) {
    const token = fonts[key]
    vars.push([`--font-${key}`, formatFont(token?.$value)])
  }

  const weights = data?.static?.weight || {}
  for (const key of Object.keys(weights).sort(compareKeys)) {
    const value = weightValues[key]
    if (value === undefined) continue
    vars.push([`--font-weight-${key}`, String(value)])
  }

  const tracking = data?.tracking || {}
  for (const key of Object.keys(tracking).sort(compareKeys)) {
    const token = tracking[key]
    vars.push([`--tracking-${key}`, formatLengthRem(token?.$value ?? 0)])
  }

  return vars
}

const extractRadius = (data) => {
  const vars = []
  const corner = data?.corner || {}
  for (const key of Object.keys(corner).sort(compareKeys)) {
    const token = corner[key]
    vars.push([`--radius-${key}`, formatLengthPx(token?.$value ?? 0)])
  }
  return vars
}

const extractShadowVars = (data) => {
  const vars = []
  const shadows = data?.shadow || {}
  for (const key of Object.keys(shadows).sort(compareKeys)) {
    const token = shadows[key]
    if (token?.$value === undefined) continue
    vars.push([`--shadow-${key}`, String(token.$value)])
  }
  return vars
}

const extractTypeScaleVars = (data) => {
  const vars = []
  const types = data?.static || {}
  for (const key of Object.keys(types).sort(compareKeys)) {
    const token = types[key]
    const size = token?.size?.$value
    const lineHeight = token?.['line-height']?.$value
    const tracking = token?.tracking?.$value

    if (typeof size === 'number') vars.push([`--text-${key}`, formatLengthRem(size)])
    if (typeof lineHeight === 'number') {
      vars.push([`--text-${key}--line-height`, formatLengthRem(lineHeight)])
    }
    if (typeof tracking === 'number') {
      vars.push([`--text-${key}--letter-spacing`, formatLengthRem(tracking)])
    }
  }
  return vars
}

const extractShadowUtilities = (data) => {
  const lines = []
  const shadows = data?.shadow || {}
  for (const key of Object.keys(shadows).sort(compareKeys)) {
    const token = shadows[key]
    if (token?.$value === undefined) continue
    lines.push(`  .shadow-${key} {`)
    lines.push(`    box-shadow: var(--shadow-${key});`)
    lines.push('  }')
  }
  return lines
}

const buildFontVarMap = (data) => {
  const map = new Map()
  const fonts = data?.static?.font || {}
  for (const key of Object.keys(fonts)) {
    const value = fonts[key]?.$value
    if (!value) continue
    map.set(String(value), `var(--font-${key})`)
  }
  return map
}

const buildWeightVarMap = (data) => {
  const map = new Map()
  const weights = data?.static?.weight || {}
  for (const key of Object.keys(weights)) {
    const value = weights[key]?.$value
    if (!value) continue
    if (weightValues[key] === undefined) continue
    map.set(String(value), `var(--font-weight-${key})`)
  }
  return map
}

const extractTypeScaleUtilities = (data, fontVarMap, weightVarMap) => {
  const lines = []
  const types = data?.static || {}

  for (const key of Object.keys(types).sort(compareKeys)) {
    const token = types[key]
    const size = token?.size?.$value
    const lineHeight = token?.['line-height']?.$value
    const tracking = token?.tracking?.$value

    const fontValue = token?.font?.$value
    const fontFamily =
      fontValue && fontVarMap.get(String(fontValue))
        ? fontVarMap.get(String(fontValue))
        : fontValue
          ? formatFont(fontValue)
          : null

    const weightValue = token?.weight?.$value
    const fontWeight =
      weightValue && weightVarMap.get(String(weightValue)) ? weightVarMap.get(String(weightValue)) : null

    const pushTypeScaleClass = (className, weightVar) => {
      lines.push(`  .${className} {`)
      if (fontFamily) lines.push(`    font-family: ${fontFamily};`)
      if (weightVar) lines.push(`    font-weight: ${weightVar};`)
      if (typeof size === 'number') lines.push(`    font-size: var(--text-${key});`)
      if (typeof lineHeight === 'number') {
        lines.push(`    line-height: var(--text-${key}--line-height);`)
      }
      if (typeof tracking === 'number') {
        lines.push(`    letter-spacing: var(--text-${key}--letter-spacing);`)
      }
      lines.push('  }')
    }

    pushTypeScaleClass(key, fontWeight)

    const emphasizedWeightValue = token?.['weight-emphasized']?.$value
    const emphasizedWeight =
      emphasizedWeightValue && weightVarMap.get(String(emphasizedWeightValue))
        ? weightVarMap.get(String(emphasizedWeightValue))
        : null

    if (emphasizedWeight) {
      pushTypeScaleClass(`${key}-emphasized`, emphasizedWeight)
    }
  }

  return lines
}

const build = async () => {
  const [colors, fonts, shapes, shadows, types] = await Promise.all([
    readJson('color.json'),
    readJson('font.json'),
    readJson('shape.json'),
    readJson('shadow.json'),
    readJson('typescale.json'),
  ])

  const lines = []
  lines.push('/* AUTO-GENERATED: do not edit directly. */')
  lines.push('@theme {')

  addVars(lines, extractSchemeColors(colors))
  addVars(lines, extractStateLayerColors(colors))
  addVars(lines, extractFonts(fonts))
  addVars(lines, extractRadius(shapes))
  addVars(lines, extractShadowVars(shadows))
  addVars(lines, extractTypeScaleVars(types))

  lines.push('}')
  lines.push('')
  lines.push('@layer utilities {')
  lines.push(...extractStateLayerUtilities(colors))
  lines.push(...extractShadowUtilities(shadows))
  lines.push(...extractTypeScaleUtilities(types, buildFontVarMap(fonts), buildWeightVarMap(fonts)))
  lines.push('}')
  lines.push('')

  await writeFile(OUTPUT_FILE, lines.join('\n'), 'utf8')
}

build().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[tokens] Failed to generate theme.css', error)
  process.exitCode = 1
})
