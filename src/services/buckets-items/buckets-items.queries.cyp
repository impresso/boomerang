// name: create
// create action item and add relationships with articles
MATCH (u:user {uid:{user__uid}})-[r:is_creator_of]->(buc:bucket {uid:{bucket_uid}})
WITH u, buc

{{! let us loop with mustache }}
{{#items}}
  MATCH (item:{{label}} {uid:"{{uid}}"})
  WHERE item.Project = {Project}
  MERGE (buc)-[r:contains]->(item)
  ON CREATE SET
    r.creation_time = {_exec_time},
    r.creation_date = {_exec_date}
  SET
    r.last_modified_time = {_exec_time},
    r.last_modified_date = {_exec_date}
  WITH u, buc
{{/items}}

{{! only if we have a saved query }}
{{#query_uid}}
{{/query_uid}}
// update bucket count for user
MATCH (u)-[r:is_creator_of]->(_buc:bucket)
WITH u, buc,
  count(r) as _count_buckets
OPTIONAL MATCH (buc)-[r:contains]->(n:article)
WITH u, buc, _count_buckets,
  count(r) as _count_articles
OPTIONAL MATCH (buc)-[r:contains]->(n:entity)
WITH u, buc, _count_buckets, _count_articles,
  count(r) as _count_entities
OPTIONAL MATCH (buc)-[r:contains]->(n:page)
WITH u, buc, _count_buckets, _count_articles, _count_entities,
  count(r) as _count_pages
OPTIONAL MATCH (buc)-[r:contains]->(n:issue)
WITH u, buc, _count_buckets, _count_articles, _count_entities, _count_pages,
  count(r) as _count_issues
SET
  buc.count_articles = _count_articles,
  buc.count_entities = _count_entities,
  buc.count_pages = _count_pages,
  buc.count_issues = _count_issues,
  buc.count_items = _count_articles + _count_entities + _count_pages + _count_issues,
  u.count_buckets = _count_buckets

RETURN buc as bucket

// name: find
//
MATCH (u:user {uid:{user__uid}})-[r:is_creator_of]->(buc:bucket)-[r2:contains]->(item)
ORDER BY buc.last_modified_time DESC,
WITH item, collect(buc) as _related_buckets, COALESCE(u.count_items, 0) as _total
SKIP {skip}
LIMIT {limit}
RETURN item, _related_buckets, _total
