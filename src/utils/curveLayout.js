const MAX_CURVE_ANGLE = (70 * Math.PI) / 180

export function createCurveLayout(glyphWidths, letterSpacing, amount) {
  const centers = []
  let cursor = 0

  glyphWidths.forEach((width, index) => {
    centers.push(cursor + width / 2)
    cursor += width + (index < glyphWidths.length - 1 ? letterSpacing : 0)
  })

  const lineWidth = cursor
  const firstCenter = centers[0] ?? 0
  const lastCenter = centers.at(-1) ?? firstCenter
  const centerSpan = lastCenter - firstCenter
  const midpoint = (firstCenter + lastCenter) / 2
  const direction = Math.sign(amount)
  const totalAngle = (Math.abs(amount) / 100) * MAX_CURVE_ANGLE

  if (glyphWidths.length < 2 || totalAngle === 0 || centerSpan === 0) {
    return {
      heightOffset: 0,
      lineWidth,
      visualWidth: lineWidth,
      glyphs: centers.map((center) => ({
        rotation: 0,
        translateX: 0,
        translateY: 0,
        x: center - lineWidth / 2,
      })),
    }
  }

  const radius = centerSpan / totalAngle
  const heightOffset = radius * (1 - Math.cos(totalAngle / 2))
  const glyphs = centers.map((center) => {
    const naturalX = center - midpoint
    const angle = naturalX / radius
    const x = radius * Math.sin(angle)

    return {
      rotation: direction * (angle * 180) / Math.PI,
      translateX: x - naturalX,
      translateY: direction * (radius * (1 - Math.cos(angle)) - heightOffset),
      x,
    }
  })
  const visualLeft = glyphs[0].x - glyphWidths[0] / 2
  const visualRight = glyphs.at(-1).x + glyphWidths.at(-1) / 2

  return {
    glyphs,
    heightOffset,
    lineWidth,
    visualWidth: visualRight - visualLeft,
    visualLeft,
  }
}
