import React, { useLayoutEffect, useMemo, useState } from "react";
import ResizeObserver from "resize-observer-polyfill";
import { PostSummary } from "../../../server/routes/apiTypes";
import useConfig from "../../hooks/useConfig";
import Thumbnail, { ThumbnailProps, thumbnailBoxSize } from "../../components/Thumbnail";
import { EM_SIZE } from "../../App";

// total gutter between cells, must match .posts.masonry .Thumbnail margins in SearchPage.scss
const GUTTER = 0.25;

export type MasonryThumbnailsProps = { posts: PostSummary[] } & Partial<Omit<ThumbnailProps, "masonry">>;

// Ties go to the leftmost column so appending items never moves already placed ones.
export function distributeColumns(heights: number[], columnCount: number): number[][] {
  const columns: number[][] = new Array(columnCount).fill(null).map(() => []);
  const columnHeights: number[] = new Array(columnCount).fill(0);
  
  heights.forEach((height, id) => {
    let shortest = 0;
    for(let c = 1; c < columnCount; c++) {
      if(columnHeights[c] < columnHeights[shortest]) shortest = c;
    }
    
    columns[shortest].push(id);
    columnHeights[shortest] += height;
  });
  
  return columns;
}

function useColumnCount(columnWidthEm: number) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [columnCount, setColumnCount] = useState(1);
  
  useLayoutEffect(() => {
    if(!node) return;
    
    const update = () => {
      const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || EM_SIZE;
      const width = node.getBoundingClientRect().width;
      setColumnCount(Math.max(1, Math.floor(width / (columnWidthEm * fontSize))));
    };
    
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
  }, [node, columnWidthEm]);
  
  return { ref: setNode, columnCount };
}

// eslint-disable-next-line prefer-arrow-callback,@typescript-eslint/naming-convention
const MasonryThumbnails = React.memo(function MasonryThumbnails({ posts, ...rest }: MasonryThumbnailsProps) {
  const [config] = useConfig();
  const columnWidthEm = config.thumbnailSize[0] / EM_SIZE + GUTTER;
  const { ref, columnCount } = useColumnCount(columnWidthEm);
  
  const columns = useMemo(() => {
    const heights = posts.map(post => thumbnailBoxSize(post, config, true)[1] / EM_SIZE + GUTTER);
    return distributeColumns(heights, columnCount);
  }, [posts, config, columnCount]);
  
  return (
    <div className="posts masonry" ref={ref}>
      {columns.map((column, c) => (
        <div key={c} className="column" style={{ width: columnWidthEm + "em" }}>
          {column.map(id => <Thumbnail key={posts[id].id} {...rest} id={id} post={posts[id]} useId masonry />)}
        </div>
      ))}
    </div>
  );
});

export default MasonryThumbnails;
