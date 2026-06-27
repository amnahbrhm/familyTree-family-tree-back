// Whole-graph payload for the home view.
//
// nodes: every family member with the fields the graph needs.
// edges: parent-child edges (father/mother) as type 'parent', and marriage
//        edges (canonical `husband` edge only, to avoid duplicating the
//        reciprocal `wife` edge) as type 'marriage'.
MATCH (n:FAMILYMEMPER)
WITH collect({
  id: n.id,
  name: n.name,
  firstname: coalesce(n.firstname, head(split(n.name, ' '))),
  fullname: coalesce(n.fullname, n.name),
  sex: n.sex,
  photoUrl: n.photoUrl,
  deceased: n.deathDate IS NOT NULL,
  external: coalesce(n.external, false)
}) AS nodes
OPTIONAL MATCH (parent:FAMILYMEMPER)-[:father|mother]->(child:FAMILYMEMPER)
WITH nodes, collect({ from: parent.id, to: child.id, type: 'parent' }) AS parentEdges
OPTIONAL MATCH (h:FAMILYMEMPER)-[:husband]->(w:FAMILYMEMPER)
WITH nodes, parentEdges, collect({ from: h.id, to: w.id, type: 'marriage' }) AS marriageEdges
RETURN nodes, parentEdges + marriageEdges AS edges