import { Writable } from "stream";
import { Statement } from "better-sqlite3";
import { Import } from "./import";

export default class Urls extends Import {
  display = "Urls";
  batchSizeMul = 1 / 2;
  
  initialKey = [-1, -1];
  outputTable = "urls";
  totalQuery = () => `
    SELECT count(1)
    FROM temp.kept_posts kept
      CROSS JOIN url_map ON url_map.hash_id = kept.hash_id
      CROSS JOIN urls ON urls.url_id = url_map.url_id
  `;
  
  outputQuery = (table: string) => `COPY ${table}(id, postid, url) FROM STDIN (FORMAT CSV)`;
  inputQuery = () => `
    SELECT
      kept.hash_id,
      url_map.url_id,
      urls.url_id || ',' ||
      url_map.hash_id || ',"' ||
      REPLACE(urls.url, '"', '""') || '"\n'
    FROM temp.kept_posts kept
      CROSS JOIN url_map ON url_map.hash_id = kept.hash_id
      CROSS JOIN urls ON urls.url_id = url_map.url_id
    WHERE kept.hash_id >= ? AND (kept.hash_id > ? OR url_map.url_id > ?)
    ORDER BY kept.hash_id, url_map.url_id
    LIMIT ?
  `;
  
  importBatch(lastKey: any[], limit: number, input: Statement, output: Writable) {
    return super.importBatch([lastKey[0], ...lastKey], limit, input, output);
  }
}
