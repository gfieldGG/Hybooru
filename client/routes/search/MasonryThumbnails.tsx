import React, { useLayoutEffect, useMemo, useState } from "react";
import ResizeObserver from "resize-observer-polyfill";
import { PostSummary } from "../../../server/routes/apiTypes";
import useConfig from "../../hooks/useConfig";
import Thumbnail, { ThumbnailProps } from "../../components/Thumbnail";
import { EM_SIZE } from "../../App";

const UNIT_DIVISIONS = 3;
const ROW_HEIGHT = 6;
const GAP_EM = 0.1;
const LOOKAHEAD = 24;
const MIN_COLUMNS = 4;

export enum Shape { TALL, PORTRAIT, SQUARE, LANDSCAPE, WIDE }

const SHAPE_SIZE: Record<Shape, [number, number]> = {
  [Shape.TALL]: [2, 6],
  [Shape.PORTRAIT]: [2, 3],
  [Shape.SQUARE]: [2, 2],
  [Shape.LANDSCAPE]: [3, 2],
  [Shape.WIDE]: [3, 1],
};

export interface Cell {
  id: number;
  col: number;
  row: number;
  w: number;
  h: number;
}

export interface Row {
  columns: number;
  cells: Cell[];
}

export type MasonryThumbnailsProps = { posts: PostSummary[] } & Partial<Omit<ThumbnailProps, "masonry">>;

export function shapeOf(post: Pick<PostSummary, "width" | "height">): Shape {
  if(!post.width || !post.height) return Shape.SQUARE;
  const ratio = post.width / post.height;
  
  if(ratio < 0.47) return Shape.TALL;
  if(ratio < 0.82) return Shape.PORTRAIT;
  if(ratio < 1.22) return Shape.SQUARE;
  if(ratio < 2.12) return Shape.LANDSCAPE;
  return Shape.WIDE;
}

class Buffer {
  queues: Record<Shape, number[]> = { [Shape.TALL]: [], [Shape.PORTRAIT]: [], [Shape.SQUARE]: [], [Shape.LANDSCAPE]: [], [Shape.WIDE]: [] };
  size = 0;
  
  constructor(private shapes: Shape[], private next = 0) {}
  
  fill(count: number) {
    while(this.size < count && this.next < this.shapes.length) {
      this.queues[this.shapes[this.next]].push(this.next);
      this.next++;
      this.size++;
    }
  }
  
  exhausted() {
    return this.next >= this.shapes.length;
  }
  
  count(shape: Shape) {
    return this.queues[shape].length;
  }
  
  take(shape: Shape) {
    this.size--;
    return this.queues[shape].shift()!;
  }
  
  // full 3-wide stacks formable from landscapes (h=2) and wides (h=1)
  wideStacks() {
    let landscapes = this.count(Shape.LANDSCAPE);
    let wides = this.count(Shape.WIDE);
    let stacks = 0;
    
    for(;;) {
      const l = Math.min(3, landscapes);
      const w = ROW_HEIGHT - 2 * l;
      if(w > wides) return stacks;
      landscapes -= l;
      wides -= w;
      stacks++;
    }
  }
  
  narrowStacks() {
    return Math.floor(this.count(Shape.PORTRAIT) / 2) + Math.floor(this.count(Shape.SQUARE) / 3) + this.count(Shape.TALL);
  }
}

function stackOrder(wide: number, narrow: number, rotate: number) {
  const total = wide + narrow;
  const order: number[] = [];
  let placedWide = 0;
  
  for(let i = 0; i < total; i++) {
    if(placedWide < wide && (placedWide + 1) / (i + 1) <= wide / total + 1e-9) {
      order.push(3);
      placedWide++;
    } else {
      order.push(2);
    }
  }
  
  const shift = total ? rotate % total : 0;
  return order.slice(shift).concat(order.slice(0, shift));
}

function fillStack(buffer: Buffer, cells: Cell[], col: number, width: number, partial: boolean) {
  let h = 0;
  const push = (shape: Shape) => {
    const [w, sh] = SHAPE_SIZE[shape];
    cells.push({ id: buffer.take(shape), col, row: h, w, h: sh });
    h += sh;
  };
  
  if(width === 3) {
    while(h + 2 <= ROW_HEIGHT && buffer.count(Shape.LANDSCAPE)) push(Shape.LANDSCAPE);
    while(h < ROW_HEIGHT && buffer.count(Shape.WIDE)) push(Shape.WIDE);
  } else if(!partial) {
    const portraits = Math.floor(buffer.count(Shape.PORTRAIT) / 2);
    const squares = Math.floor(buffer.count(Shape.SQUARE) / 3);
    const talls = buffer.count(Shape.TALL);
    
    if(portraits >= squares && portraits >= talls) { push(Shape.PORTRAIT); push(Shape.PORTRAIT); }
    else if(squares >= talls) { push(Shape.SQUARE); push(Shape.SQUARE); push(Shape.SQUARE); }
    else push(Shape.TALL);
  } else {
    while(h < ROW_HEIGHT) {
      if(h + 3 <= ROW_HEIGHT && buffer.count(Shape.PORTRAIT)) push(Shape.PORTRAIT);
      else if(h + 2 <= ROW_HEIGHT && buffer.count(Shape.SQUARE)) push(Shape.SQUARE);
      else if(h === 0 && buffer.count(Shape.TALL)) push(Shape.TALL);
      else break;
    }
  }
}

function packFullRow(buffer: Buffer, columns: number, rowIndex: number): Row | null {
  const wideStacks = buffer.wideStacks();
  const narrowStacks = buffer.narrowStacks();
  if(wideStacks + narrowStacks === 0) return null;
  
  const ideal = columns * wideStacks / (3 * wideStacks + 2 * narrowStacks);
  let best: { wide: number; narrow: number; score: number } | null = null;
  
  for(let wide = 0; wide <= Math.min(wideStacks, Math.floor(columns / 3)); wide++) {
    const narrow = Math.min(narrowStacks, Math.floor((columns - 3 * wide) / 2));
    const shortfall = columns - 3 * wide - 2 * narrow;
    if(shortfall > 2) continue;
    
    const score = shortfall * 10 + Math.abs(wide - ideal);
    if(!best || score < best.score) best = { wide, narrow, score };
  }
  
  if(!best) return null;
  
  const cells: Cell[] = [];
  let col = 0;
  for(const width of stackOrder(best.wide, best.narrow, rowIndex)) {
    fillStack(buffer, cells, col, width, false);
    col += width;
  }
  
  return { columns: col, cells };
}

function packPartialRow(buffer: Buffer, columns: number): Row {
  const cells: Cell[] = [];
  let col = 0;
  
  while(col < columns && buffer.size) {
    const hasWide = buffer.count(Shape.LANDSCAPE) + buffer.count(Shape.WIDE) > 0;
    const hasNarrow = buffer.size > buffer.count(Shape.LANDSCAPE) + buffer.count(Shape.WIDE);
    
    if(columns - col >= 3 && hasWide) fillStack(buffer, cells, col, 3, true), col += 3;
    else if(columns - col >= 2 && hasNarrow) fillStack(buffer, cells, col, 2, true), col += 2;
    else break;
  }
  
  return { columns, cells };
}

export function packRows(shapes: Shape[], columns: number, lookahead = LOOKAHEAD): Row[] {
  const buffer = new Buffer(shapes);
  const rows: Row[] = [];
  buffer.fill(lookahead);
  
  while(buffer.size) {
    const row = packFullRow(buffer, columns, rows.length);
    if(row) {
      rows.push(row);
      buffer.fill(lookahead);
    } else if(!buffer.exhausted()) {
      buffer.fill(buffer.size + lookahead);
    } else {
      rows.push(packPartialRow(buffer, columns));
    }
  }
  
  return rows;
}

function useContainerMetrics() {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [metrics, setMetrics] = useState({ width: 0, fontSize: EM_SIZE });
  
  useLayoutEffect(() => {
    if(!node) return;
    
    const update = () => setMetrics({
      width: node.getBoundingClientRect().width,
      fontSize: parseFloat(getComputedStyle(document.documentElement).fontSize) || EM_SIZE,
    });
    
    // deferred so App's resize listener has updated the root font size
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    
    const observer = new ResizeObserver(onResize);
    observer.observe(node);
    window.addEventListener("resize", onResize);
    update();
    
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [node]);
  
  return { ref: setNode, ...metrics };
}

// eslint-disable-next-line prefer-arrow-callback,@typescript-eslint/naming-convention
const MasonryThumbnails = React.memo(function MasonryThumbnails({ posts, ...rest }: MasonryThumbnailsProps) {
  const [config] = useConfig();
  const { ref, width, fontSize } = useContainerMetrics();
  
  const gap = GAP_EM * fontSize;
  const baseUnit = config.thumbnailSize[0] / UNIT_DIVISIONS / EM_SIZE * fontSize;
  const columns = Math.max(MIN_COLUMNS, Math.floor((width + gap) / (baseUnit + gap)));
  
  const rows = useMemo(() => packRows(posts.map(shapeOf), columns), [posts, columns]);
  
  return (
    <div className="posts masonry" ref={ref} style={{ gap }}>
      {width > 0 && rows.map((row, r) => {
        const unit = (width - (row.columns - 1) * gap) / row.columns;
        
        return (
          <div key={r} className="row" style={{ gap, gridTemplateColumns: `repeat(${row.columns}, ${unit}px)`, gridAutoRows: `${unit}px` }}>
            {row.cells.map(cell => (
              <div key={posts[cell.id].id} className="cell" style={{ gridColumn: `${cell.col + 1} / span ${cell.w}`, gridRow: `${cell.row + 1} / span ${cell.h}` }}>
                <Thumbnail {...rest} id={cell.id} post={posts[cell.id]} useId masonry />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
});

export default MasonryThumbnails;
