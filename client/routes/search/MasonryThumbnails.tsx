import React, { useLayoutEffect, useMemo, useState } from "react";
import ResizeObserver from "resize-observer-polyfill";
import { PostSummary } from "../../../server/routes/apiTypes";
import useConfig from "../../hooks/useConfig";
import Thumbnail, { ThumbnailProps } from "../../components/Thumbnail";
import { EM_SIZE } from "../../App";

const ROW_HEIGHT_FACTOR = 1;
const GAP_EM = 0.1;
const MIN_RATIO = 0.4;
const MAX_RATIO = 2.5;

export interface Row {
  height: number;
  ids: number[];
  widths: number[];
}

export type MasonryThumbnailsProps = { posts: PostSummary[] } & Partial<Omit<ThumbnailProps, "masonry">>;

export function aspectRatioOf(post: Pick<PostSummary, "width" | "height">) {
  if(!post.width || !post.height) return 1;
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, post.width / post.height));
}

export function justifyRows(ratios: number[], width: number, targetHeight: number, gap: number): Row[] {
  const rows: Row[] = [];
  const makeRow = (start: number, end: number, height: number) => {
    const ids = ratios.slice(start, end).map((_, i) => start + i);
    rows.push({ height, ids, widths: ids.map(id => ratios[id] * height) });
  };
  
  let start = 0;
  let ratioSum = 0;
  
  for(let i = 0; i < ratios.length; i++) {
    const count = i - start + 1;
    const withItem = (ratioSum + ratios[i]) * targetHeight + (count - 1) * gap;
    
    if(withItem < width) {
      ratioSum += ratios[i];
      continue;
    }
    
    const withoutItem = ratioSum * targetHeight + (count - 2) * gap;
    if(count === 1 || withItem - width <= width - withoutItem) {
      ratioSum += ratios[i];
      makeRow(start, i + 1, (width - (count - 1) * gap) / ratioSum);
      start = i + 1;
      ratioSum = 0;
    } else {
      makeRow(start, i, (width - (count - 2) * gap) / ratioSum);
      start = i;
      ratioSum = ratios[i];
    }
  }
  
  if(start < ratios.length) makeRow(start, ratios.length, targetHeight);
  
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
  const targetHeight = Math.min(config.thumbnailSize[1] * ROW_HEIGHT_FACTOR / EM_SIZE * fontSize, width / 2);
  
  const rows = useMemo(() => justifyRows(posts.map(aspectRatioOf), width, targetHeight, gap), [posts, width, targetHeight, gap]);
  
  return (
    <div className="posts masonry" ref={ref} style={{ gap }}>
      {width > 0 && rows.map((row, r) => (
        <div key={r} className="row" style={{ gap, height: row.height }}>
          {row.ids.map((id, i) => (
            <div key={posts[id].id} className="cell" style={{ width: row.widths[i] }}>
              <Thumbnail {...rest} id={id} post={posts[id]} useId masonry />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

export default MasonryThumbnails;
