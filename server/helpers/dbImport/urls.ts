import { Import } from "./import";

export default class Urls extends Import {
  display = "Urls";
  batchSizeMul = 1 / 2;
  
  outputTable = "urls";
  // CROSS JOIN keeps urls as the outer loop, otherwise SQLite sorts every batch
  totalQuery = () => `
    SELECT count(1)
    FROM urls
      INNER JOIN url_map ON url_map.url_id = urls.url_id
      CROSS JOIN temp.kept_posts kept ON kept.hash_id = url_map.hash_id
  `;
  
  outputQuery = (table: string) => `COPY ${table}(id, postid, url) FROM STDIN (FORMAT CSV)`;
  inputQuery = () => `
    SELECT
      urls.url_id,
      urls.url_id || ',' ||
      url_map.hash_id || ',"' ||
      REPLACE(urls.url, '"', '""') || '"\n'
    FROM urls
      CROSS JOIN url_map ON url_map.url_id = urls.url_id
      CROSS JOIN temp.kept_posts kept ON kept.hash_id = url_map.hash_id
    WHERE urls.url_id > ?
    ORDER BY urls.url_id
    LIMIT ?
  `;
}
