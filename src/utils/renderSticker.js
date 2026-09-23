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
  const { contentX, contentWidth, letterSpacing, align } = options
  const graphemes = getGraphemes(line || ' ')
  const lineWidth = measureLine(context, line, letterSpacing)
  let x = contentX

  if (align === 'center') x = contentX + (contentWidth - lineWidth) / 2
  if (align === 'right') x = contentX + contentWidth - lineWidth

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
  const { contentY, contentHeight, letterSpacing, align } = options
  const graphemes = getGraphemes(line || ' ')
  const columnHeight = measureVerticalColumn(line, letterSpacing)
  let y = contentY + FONT_SIZE / 2

  if (align === 'center') y = contentY + (contentHeight - columnHeight) / 2 + FONT_SIZE / 2
  if (align === 'right') y = contentY + contentHeight - columnHeight + FONT_SIZE / 2

  graphemes.forEach((grapheme) => {
    context.fillText(grapheme, x, y)
    y += FONT_SIZE + letterSpacing
  })
}

function hexToRgba(hex, opacity) {
  const value = hex.replace('#', '')
  const normalized = value.length === 3
    ? value.split('').map((character) => character.repeat(2)).join('')
    : value
  const number = Number.parseInt(normalized, 16)

  if (!Number.isFinite(number)) return `rgba(0, 0, 0, ${opacity})`

  return `rgba(${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}, ${opacity})`
}

function roundedRectPath(context, x, y, width, height, radius) {
  const safeRadius = Math.min(Math.max(0, radius), width / 2, height / 2)

  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.lineTo(x + width - safeRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  context.lineTo(x + width, y + height - safeRadius)
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
  context.lineTo(x + safeRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  context.lineTo(x, y + safeRadius)
  context.quadraticCurveTo(x, y, x + safeRadius, y)
  context.closePath()
}

function drawBox(context, box, width, height) {
  const hasFill = ['fill', 'fill-stroke'].includes(box.type)
  const hasStroke = ['stroke', 'fill-stroke'].includes(box.type)
  const strokeInset = hasStroke ? box.strokeWidth / 2 : 0

  roundedRectPath(
    context,
    SAFE_PADDING + strokeInset,
    SAFE_PADDING + strokeInset,
    width - strokeInset * 2,
    height - strokeInset * 2,
    Math.max(0, box.radius - strokeInset),
  )

  if (hasFill) {
    context.fillStyle = hexToRgba(box.fillColor, box.fillOpacity)
    context.fill()
  }

  if (hasStroke) {
    context.lineWidth = box.strokeWidth
    context.strokeStyle = hexToRgba(box.strokeColor, box.strokeOpacity)
    context.stroke()
  }
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
  box = {},
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
  const boxOptions = {
    type: 'none',
    fillColor: '#FFFFFF',
    fillOpacity: 1,
    strokeColor: '#282522',
    strokeOpacity: 1,
    strokeWidth: 2,
    radius: 24,
    paddingX: 28,
    paddingY: 16,
    ...box,
  }
  const hasBox = boxOptions.type !== 'none'
  const hasStroke = ['stroke', 'fill-stroke'].includes(boxOptions.type)
  const strokeWidth = hasStroke ? boxOptions.strokeWidth : 0
  const paddingX = hasBox ? boxOptions.paddingX : 0
  const paddingY = hasBox ? boxOptions.paddingY : 0
  const contentWidth = isVertical ? lines.length * columnStep : Math.max(...widths)
  const contentHeight = isVertical
    ? Math.max(...columnHeights)
    : lines.length * FONT_SIZE * lineHeight
  const boxWidth = contentWidth + paddingX * 2 + strokeWidth * 2
  const boxHeight = contentHeight + paddingY * 2 + strokeWidth * 2
  const logicalWidth = Math.ceil(boxWidth + SAFE_PADDING * 2)
  const logicalHeight = Math.ceil(boxHeight + SAFE_PADDING * 2)
  const contentX = SAFE_PADDING + strokeWidth + paddingX
  const contentY = SAFE_PADDING + strokeWidth + paddingY
  const canvas = document.createElement('canvas')
  canvas.width = logicalWidth * OUTPUT_SCALE
  canvas.height = logicalHeight * OUTPUT_SCALE

  const context = canvas.getContext('2d')
  if (!context) throw new Error('此瀏覽器無法使用 Canvas。')

  context.scale(OUTPUT_SCALE, OUTPUT_SCALE)
  context.clearRect(0, 0, logicalWidth, logicalHeight)
  context.font = `${FONT_SIZE}px ${fontFamily}`
  context.textAlign = isVertical ? 'center' : 'left'
  context.textBaseline = 'middle'

  if (hasBox) drawBox(context, boxOptions, boxWidth, boxHeight)

  context.fillStyle = color

  if (isVertical) {
    lines.forEach((line, index) => {
      const x = contentX + contentWidth - columnStep * (index + 0.5)
      drawVerticalColumn(context, line, x, {
        contentY,
        contentHeight,
        letterSpacing,
        align,
      })
    })
  } else {
    lines.forEach((line, index) => {
      const y = contentY + FONT_SIZE * lineHeight * index + (FONT_SIZE * lineHeight) / 2
      drawLine(context, line, y, { contentX, contentWidth, letterSpacing, align })
    })
  }

  return canvasToBlob(canvas)
}
