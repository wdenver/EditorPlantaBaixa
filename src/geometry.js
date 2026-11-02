import ClipperLib from 'clipper-lib'

const CLIPPER_SCALE = 100000

const toClipperPath = ({ x, y, width, height }) => [
  { X: Math.round(x * CLIPPER_SCALE), Y: Math.round(y * CLIPPER_SCALE) },
  { X: Math.round((x + width) * CLIPPER_SCALE), Y: Math.round(y * CLIPPER_SCALE) },
  { X: Math.round((x + width) * CLIPPER_SCALE), Y: Math.round((y + height) * CLIPPER_SCALE) },
  { X: Math.round(x * CLIPPER_SCALE), Y: Math.round((y + height) * CLIPPER_SCALE) }
]

const buildRectangleUnion = (rectangles) => {
  const paths = rectangles
    .filter(rectangle => rectangle.width > 0 && rectangle.height > 0)
    .map(toClipperPath)
  if (!paths.length) return []

  const clipper = new ClipperLib.Clipper()
  clipper.AddPaths(paths, ClipperLib.PolyType.ptSubject, true)
  const union = new ClipperLib.Paths()
  if (!clipper.Execute(
    ClipperLib.ClipType.ctUnion,
    union,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero
  )) {
    throw new Error('Não foi possível calcular a união dos retângulos.')
  }
  return union.filter(path => path.length >= 3)
}

export const buildRectangleUnionPolygons = (rectangles) => buildRectangleUnion(rectangles)
  .map(path => path.map(({ X, Y }) => ({
    x: X / CLIPPER_SCALE,
    y: Y / CLIPPER_SCALE
  })))

export const calculateRectangleUnionArea = (rectangles) => {
  // Clipper gives holes the opposite orientation, so signed areas subtract them.
  const area = buildRectangleUnion(rectangles)
    .reduce((total, path) => total + ClipperLib.Clipper.Area(path), 0)
  return Math.abs(area) / (CLIPPER_SCALE * CLIPPER_SCALE)
}
