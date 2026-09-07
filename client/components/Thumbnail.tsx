import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BlurhashCanvas } from "react-blurhash-async";
import { Config, PostSummary, ThumbnailsMode } from "../../server/routes/apiTypes";
import { thumbnailUrl } from "../../server/helpers/consts";
import { classJoin } from "../helpers/utils";
import useLocalStorage from "../hooks/useLocalStorage";
import useSSR from "../hooks/useSSR";
import useConfig from "../hooks/useConfig";
import useQuery from "../hooks/useQuery";
import { EM_SIZE } from "../App";
import "./Thumbnail.scss";

export interface ThumbnailProps {
  id: number;
  post: PostSummary;
  noFade?: boolean;
  onClick?: (ev: React.MouseEvent<HTMLAnchorElement>, post: number) => void;
  useId?: boolean;
  label?: React.ReactNode;
  masonry?: boolean;
}

export function thumbnailBoxSize(post: PostSummary, config: Config, masonry?: boolean): [number, number] {
  const [boxWidth, boxHeight] = config.thumbnailSize;
  
  if(masonry && config.thumbnailsMode === ThumbnailsMode.FIT && post.width && post.height) {
    const scale = Math.min(boxWidth / post.width, boxHeight / post.height);
    return [boxWidth, Math.round(post.height * scale)];
  }
  
  return [boxWidth, boxHeight];
}

export default function Thumbnail({ id, post, noFade, onClick, useId, label, masonry }: ThumbnailProps) {
  const SSR = useSSR();
  const [config] = useConfig();
  const ref = useRef<HTMLImageElement>(null);
  const [thumbnailFade] = useLocalStorage("thumbnailFade", true);
  const [blurhash] = useLocalStorage("blurhash", false);
  const [fade] = useState(thumbnailFade && !noFade && !SSR);
  const [loaded, setLoaded] = useReducer(() => true, false);
  const [unknown, setUnknown] = useReducer(() => true, false);
  let [query] = useQuery();
  query = query && `?query=${encodeURIComponent(query)}`;
  
  const onClickLink = useCallback((ev: React.MouseEvent<HTMLAnchorElement>) => {
    if(onClick) onClick(ev, id);
  }, [onClick, id]);
  
  useEffect(() => {
    if(ref.current?.complete && ref.current.naturalWidth === 0) setUnknown();
  }, []);
  
  let url = thumbnailUrl(post);
  if(unknown) url = "/static/file.svg";
  
  let aspectRatio;
  if(config.thumbnailsMode === ThumbnailsMode.FIT && post.width && post.height) aspectRatio = post.width / post.height;
  else aspectRatio = config.thumbnailSize[0] / config.thumbnailSize[1];
  
  const [boxWidth, boxHeight] = thumbnailBoxSize(post, config, masonry);
  
  return (
    <Link className="Thumbnail" to={`/posts/${post.id}${query}`} onClick={onClickLink}>
      <div className={classJoin(
             "imgWrap",
             fade && "fade",
             loaded && "loaded",
             unknown && "unknown",
             config.thumbnailsMode === ThumbnailsMode.FILL && "fill",
             config.thumbnailsMode === ThumbnailsMode.FIT && "fit",
           )}
           data-ext={post.extension.slice(1)}
           style={{
             width: boxWidth / EM_SIZE + "em",
             height: boxHeight / EM_SIZE + "em",
           }}>
        {!SSR && blurhash && post.blurhash && (
          <BlurhashCanvas className="Blurhash"
                          imageRef={ref}
                          hash={post.blurhash}
                          loading="eager"
                          width={32}
                          height={Math.ceil(32 / aspectRatio)} />
        )}
        <img src={url} alt={String(post.id)}
             id={useId ? post.id.toString() : undefined}
             onLoad={setLoaded} onError={setUnknown} ref={ref} />
      </div>
      {label && <label>{label}</label>}
    </Link>
  );
}

