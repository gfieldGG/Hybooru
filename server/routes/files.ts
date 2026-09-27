import * as fs from "fs";
import path from "path";
import express from "express";
import * as db from "../helpers/db";
import configs from "../helpers/configs";
import HTTPError from "../helpers/HTTPError";

export const router = express.Router();

const toArray = <T>(item: T | T[]) => Array.isArray(item) ? item : [item];

router.get<{ filename: string }>("/:filename", async (req, res, next) => {
  let roots = [path.resolve(db.findHydrusDB(), "client_files")];
  if(req.params.filename.startsWith("t") && configs.posts.thumbnailsPathOverride) roots = toArray(configs.posts.thumbnailsPathOverride);
  else if(configs.posts.filesPathOverride) roots = toArray(configs.posts.filesPathOverride);
  
  let filename = req.params.filename;
  filename = `./${filename.slice(0, 3)}/${filename.slice(1)}`;
  
  for(const root of roots) {
    const exists = await fs.promises.access(path.resolve(root, filename)).then(() => true, () => false);
    if(exists) {
      return res.sendFile(filename, { root }, err => {
        if(err && (err as any).code === 'ENOENT') next(new HTTPError(404));
        else if(err && (err as any).code === 'ECONNABORTED') return;
        else if(err) next(err);
      });
    }
  }
  
  return next(new HTTPError(404));
});
