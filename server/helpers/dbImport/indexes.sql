
DELETE FROM urls WHERE NOT EXISTS (SELECT 1 FROM posts WHERE id = postid);
CREATE INDEX ON urls(postid);
ALTER TABLE urls ADD CONSTRAINT urls_postid_fkey FOREIGN KEY (postid) REFERENCES posts(id) ON DELETE CASCADE;

DELETE FROM notes WHERE NOT EXISTS (SELECT 1 FROM posts WHERE id = postid);
CREATE INDEX ON notes(postid);
ALTER TABLE notes ADD CONSTRAINT notes_postid_fkey FOREIGN KEY (postid) REFERENCES posts(id) ON DELETE CASCADE;

CREATE TABLE mappings_kept (LIKE mappings INCLUDING DEFAULTS);
INSERT INTO mappings_kept
  SELECT * FROM mappings
  WHERE EXISTS (SELECT 1 FROM posts WHERE id = postid)
    AND EXISTS (SELECT 1 FROM tags WHERE id = tagid);
DROP TABLE mappings;
ALTER TABLE mappings_kept RENAME TO mappings;
ALTER TABLE mappings ADD CONSTRAINT mappings_pkey PRIMARY KEY (postid, tagid);

CREATE TABLE tags_kept (LIKE tags INCLUDING DEFAULTS);
INSERT INTO tags_kept
  SELECT * FROM tags
  WHERE id IN (SELECT tagid FROM mappings
               UNION
               SELECT tag_siblings.tagid
               FROM mappings
               INNER JOIN tag_siblings ON tag_siblings.betterid = mappings.tagid);
DROP TABLE tags;
ALTER TABLE tags_kept RENAME TO tags;
ALTER TABLE tags ADD CONSTRAINT tags_pkey PRIMARY KEY (id);
ANALYZE mappings, tags;

ALTER TABLE mappings ADD CONSTRAINT mappings_postid_fkey FOREIGN KEY (postid) REFERENCES posts(id) ON DELETE CASCADE,
                     ADD CONSTRAINT mappings_tagid_fkey FOREIGN KEY (tagid) REFERENCES tags(id) ON DELETE CASCADE;
CREATE INDEX ON mappings(tagid);
CREATE INDEX tags_name_idx ON tags USING gin(name gin_trgm_ops);
CREATE INDEX tags_subtag_idx ON tags USING gin(subtag gin_trgm_ops);

DROP TABLE IF EXISTS tag_postids;
CREATE TABLE tag_postids AS
  SELECT tagid, sort(array_agg(postid)) AS postids
  FROM mappings
  GROUP BY tagid;
CREATE UNIQUE INDEX ON tag_postids(tagid);

UPDATE posts SET tagged = EXISTS(SELECT 1 FROM mappings WHERE postid = id);
CREATE INDEX ON posts(posted, id);
CREATE INDEX ON posts(rating, id);
CREATE INDEX ON posts(size, id);
CREATE UNIQUE INDEX ON posts(sha256);
CREATE INDEX ON posts(md5);

DELETE FROM tag_parents WHERE NOT EXISTS (SELECT 1 FROM tags WHERE id = tagid);
DELETE FROM tag_parents WHERE NOT EXISTS (SELECT 1 FROM tags WHERE id = parentid);
CREATE INDEX ON tag_parents(parentid);
ALTER TABLE tag_parents ADD CONSTRAINT tag_parents_tagid_fkey FOREIGN KEY (tagid) REFERENCES tags(id) ON DELETE CASCADE;
ALTER TABLE tag_parents ADD CONSTRAINT tag_parents_parentid_fkey FOREIGN KEY (parentid) REFERENCES tags(id) ON DELETE CASCADE;

DELETE FROM tag_siblings WHERE NOT EXISTS (SELECT 1 FROM tags WHERE id = tagid);
DELETE FROM tag_siblings WHERE NOT EXISTS (SELECT 1 FROM tags WHERE id = betterid);
CREATE INDEX ON tag_siblings(betterid);
ALTER TABLE tag_siblings ADD CONSTRAINT tag_siblings_tagid_fkey FOREIGN KEY (tagid) REFERENCES tags(id) ON DELETE CASCADE;
ALTER TABLE tag_siblings ADD CONSTRAINT tag_siblings_betterid_fkey FOREIGN KEY (betterid) REFERENCES tags(id) ON DELETE CASCADE;

DELETE FROM relations WHERE NOT EXISTS (SELECT 1 FROM posts WHERE id = postid);
DELETE FROM relations WHERE NOT EXISTS (SELECT 1 FROM posts WHERE id = other_postid);
ALTER TABLE relations ADD CONSTRAINT relations_postid_fkey FOREIGN KEY (postid) REFERENCES posts(id) ON DELETE CASCADE,
                      ADD CONSTRAINT relations_other_postid_fkey FOREIGN KEY (other_postid) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE post_sort_keys ADD CONSTRAINT post_sort_keys_postid_fkey FOREIGN KEY (postid) REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE post_sort_keys ADD CONSTRAINT post_sort_keys_preset_fkey FOREIGN KEY (preset) REFERENCES sort_presets(name) ON DELETE CASCADE;
