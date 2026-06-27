// Recompute and store `firstname` + `fullname` for every member. Run after any
// name or relationship change so the stored values stay correct.
//   firstname = first word of `name`
//   fullname  = external -> whole `name`;
//               internal -> firstname + father firstname + grandfather firstname
MATCH (n:FAMILYMEMPER)
WITH n, head(split(trim(n.name), ' ')) AS fw
SET n.firstname = fw,
    n.fullname = CASE WHEN coalesce(n.external, false)
      THEN n.name
      ELSE fw
        + coalesce(' ' + head([ (f:FAMILYMEMPER)-[:father]->(n) | head(split(trim(f.name), ' ')) ]), '')
        + coalesce(' ' + head([ (g:FAMILYMEMPER)-[:father]->(:FAMILYMEMPER)-[:father]->(n) | head(split(trim(g.name), ' ')) ]), '')
      END
