const FONT_SIZE = 96
const SAFE_PADDING = 48
const OUTPUT_SCALE = 3

function getGraphemes(text) {
  if (typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    return Array.from(segmenter.segment(text), ({ segment }) => segment)
  }

  return Array.from(text)
}

function measureLine(context, line, letterSpacing) {
  const graphemes = getGraphemes(line || ' ')
  const glyphWidth = graphemes.reduce(
    (width, grapheme) => width + context.measureText(grapheme).width,
    0,
  )

  return glyphWidth + Math.max(0, graphemes.length - 1) * letterSpacing
}

function drawLine(context, line, y, options) {
  const { logicalWidth, letterSpacing, align } = options
  const graphemes = getGraphemes(line || ' ')
  const lineWidth = measureLine(context, line, letterSpacing)
  let x = SAFE_PADDING

  if (align === 'center') x = (logicalWidth - lineWidth) / 2
  if (align === 'right') x = logicalWidth - SAFE_PADDING - lineWidth

  graphemes.forEach((grapheme) => {
    context.fillText(grapheme, x, y)
    x += context.measureText(grapheme).width + letterSpacing
  })
}

function measureVerticalColumn(line, letterSpacing) {
  const graphemes = getGraphemes(line || ' ')
  return graphemes.length * FONT_SIZE + Math.max(0, graphemes.length - 1) * letterSpacing
}

function drawVerticalColumn(context, line, x, options) {
  const { logicalHeight, letterSpacing, align } = options
  const graphemes = getGraphemes(line || ' ')
  const columnHeight = measureVerticalColumn(line, letterSpacing)
  let y = SAFE_PADDING + FONT_SIZE / 2

  if (align === 'center') y = (logicalHeight - columnHeight) / 2 + FONT_SIZE / 2
  if (align === 'right') y = logicalHeight - SAFE_PADDING - columnHeight + FONT_SIZE / 2

  graphemes.forEach((grapheme) => {
    context.fillText(grapheme, x, y)
    y += FONT_SIZE + letterSpacing
  })
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Safari 無法建立 PNG。'))
    }, 'image/png')
  })
}

export async function renderStickerPng({
  text,
  fontFamily,
  color = '#282522',
  letterSpacing = 0,
  lineHeight = 1.4,
  align = 'center',
  writingMode = 'horizontal',
}) {
  const content = text ?? ''
  const lines = content.split('\n')
  const measureCanvas = document.createElement('canvas')
  const measureContext = measureCanvas.getContext('2d')

  if (!measureContext) throw new Error('此瀏覽器無法使用 Canvas。')

  await document.fonts.ready
  measureContext.font = `${FONT_SIZE}px ${fontFamily}`
  measureContext.textBaseline = 'alphabetic'

  const isVertical = writingMode === 'vertical'
  const columnStep = FONT_SIZE * lineHeight
  const widths = lines.map((line) => measureLine(measureContext, line, letterSpacing))
  const columnHeights = lines.map((line) => measureVerticalColumn(line, letterSpacing))
  const logicalWidth = Math.ceil(
    isVertical
      ? lines.length * columnStep + SAFE_PADDING * 2
      : Math.max(...widths) + SAFE_PADDING * 2,
  )
  const logicalHeight = Math.ceil(
    isVertical
      ? Math.max(...columnHeights) + SAFE_PADDING * 2
      : lines.length * FONT_SIZE * lineHeight + SAFE_PADDING * 2,
  )
  const canvas = document.createElement('canvas')
  canvas.width = logicalWidth * OUTPUT_SCALE
  canvas.height = logicalHeight * OUTPUT_SCALE

  const context = canvas.getContext('2d')
  if (!context) throw new Error('此瀏覽器無法使用 Canvas。')

  context.scale(OUTPUT_SCALE, OUTPUT_SCALE)
  context.clearRect(0, 0, logicalWidth, logicalHeight)
  context.font = `${FONT_SIZE}px ${fontFamily}`
  context.fillStyle = color
  context.textAlign = isVertical ? 'center' : 'left'
  context.textBaseline = 'middle'

  if (isVertical) {
    lines.forEach((line, index) => {
      const x = logicalWidth - SAFE_PADDING - columnStep * (index + 0.5)
      drawVerticalColumn(context, line, x, { logicalHeight, letterSpacing, align })
    })
  } else {
    lines.forEach((line, index) => {
      const y = SAFE_PADDING + FONT_SIZE * lineHeight * index + (FONT_SIZE * lineHeight) / 2
      drawLine(context, line, y, { logicalWidth, letterSpacing, align })
    })
  }

  return canvasToBlob(canvas)
}
