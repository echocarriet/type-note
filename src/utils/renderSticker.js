const FONT_SIZE = 96
const LINE_HEIGHT = 1.35
const SAFE_PADDING = 48
const OUTPUT_SCALE = 3

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Safari 無法建立 PNG。'))
    }, 'image/png')
  })
}

export async function renderStickerPng({ text, fontFamily, color = '#282522' }) {
  const content = text.trim() || '今天也要慢慢來 ♡'
  const lines = content.split('\n')
  const measureCanvas = document.createElement('canvas')
  const measureContext = measureCanvas.getContext('2d')

  if (!measureContext) throw new Error('此瀏覽器無法使用 Canvas。')

  await document.fonts.ready
  measureContext.font = `${FONT_SIZE}px "${fontFamily}", sans-serif`
  measureContext.textBaseline = 'alphabetic'

  const widths = lines.map((line) => measureContext.measureText(line || ' ').width)
  const logicalWidth = Math.ceil(Math.max(...widths) + SAFE_PADDING * 2)
  const logicalHeight = Math.ceil(lines.length * FONT_SIZE * LINE_HEIGHT + SAFE_PADDING * 2)
  const canvas = document.createElement('canvas')
  canvas.width = logicalWidth * OUTPUT_SCALE
  canvas.height = logicalHeight * OUTPUT_SCALE

  const context = canvas.getContext('2d')
  if (!context) throw new Error('此瀏覽器無法使用 Canvas。')

  context.scale(OUTPUT_SCALE, OUTPUT_SCALE)
  context.clearRect(0, 0, logicalWidth, logicalHeight)
  context.font = `${FONT_SIZE}px "${fontFamily}", sans-serif`
  context.fillStyle = color
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  lines.forEach((line, index) => {
    const y = SAFE_PADDING + FONT_SIZE * LINE_HEIGHT * index + (FONT_SIZE * LINE_HEIGHT) / 2
    context.fillText(line || ' ', logicalWidth / 2, y)
  })

  return canvasToBlob(canvas)
}
