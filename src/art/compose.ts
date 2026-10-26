import { defineSprite, type ColorMap, type Sprite } from './sprite'

/** A mutable character grid for building sprites from rectangles and single pixels. */
export class Grid {
  private readonly cells: string[][]

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.cells = Array.from({ length: height }, () => Array<string>(width).fill('.'))
  }

  px(x: number, y: number, ch: string): this {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      throw new Error(`pixel ${x},${y} is outside the ${this.width}x${this.height} grid`)
    }
    this.cells[y][x] = ch
    return this
  }

  rect(x: number, y: number, w: number, h: number, ch: string): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, ch)
    return this
  }

  /** Marks every transparent cell that touches a filled cell (4-neighbourhood). Cells outside the grid are skipped. */
  outline(ch: string): this {
    const marks: [number, number][] = []
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y][x] !== '.') continue
        const touches = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ].some(([nx, ny]) => this.cells[ny]?.[nx] !== undefined && this.cells[ny][nx] !== '.')
        if (touches) marks.push([x, y])
      }
    }
    for (const [x, y] of marks) this.cells[y][x] = ch
    return this
  }

  rows(): string[] {
    return this.cells.map((row) => row.join(''))
  }
}

export function compose(
  name: string,
  width: number,
  height: number,
  colors: ColorMap,
  draw: (grid: Grid) => void,
): Sprite {
  const grid = new Grid(width, height)
  draw(grid)
  return defineSprite(name, grid.rows(), colors)
}
