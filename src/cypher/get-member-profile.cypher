// Full profile payload for a single member.
//
// Returns the person, their parents, their spouses (each with the marriage
// relationship and that spouse's children with this person), and any children
// whose mother is not in the DB.
//
// Marriage data is canonical on the `husband` edge, matched undirected so it
// works whether the member is the husband (male) or the wife (female).
MATCH (p:FAMILYMEMPER {id: $id})
OPTIONAL MATCH (father:FAMILYMEMPER)-[:father]->(p)
OPTIONAL MATCH (mother:FAMILYMEMPER)-[:mother]->(p)
WITH p, father, mother
OPTIONAL MATCH (p)-[mar:husband]-(spouse:FAMILYMEMPER)
WITH p, father, mother, collect({
  spouse: spouse,
  marriage: mar,
  children: [ (spouse)-[:father|mother]->(c:FAMILYMEMPER)
              WHERE (p)-[:father|mother]->(c) | c ]
}) AS spouses
RETURN
  p,
  father,
  mother,
  spouses,
  [ (p)-[:father]->(c:FAMILYMEMPER)
    WHERE NOT (:FAMILYMEMPER)-[:mother]->(c) | c ] AS childrenWithUnknownMother