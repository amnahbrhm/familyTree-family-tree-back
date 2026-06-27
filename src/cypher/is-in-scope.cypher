// Is $targetId within the moderator scope of $callerId?
//
// Scope = every node the caller MODERATES, plus all descendants of those nodes
// (downward via father/mother edges), plus the spouses of any in-scope member.
// (Admin is handled in code and never calls this.)
MATCH (target:FAMILYMEMPER {id: $targetId})
OPTIONAL MATCH (caller:FAMILYMEMPER {id: $callerId})-[:MODERATES]->(root)
WITH target, collect(root) AS roots
RETURN
  size(roots) > 0 AND (
    // target is itself a moderated root
    any(r IN roots WHERE r = target)
    // target is a descendant of a moderated root
    OR EXISTS { MATCH (rr)-[:father|mother*1..]->(target) WHERE rr IN roots }
    // target is the spouse of an in-scope member
    OR EXISTS {
      MATCH (target)-[:husband|wife]-(s)
      WHERE s IN roots
         OR EXISTS { MATCH (rr2)-[:father|mother*1..]->(s) WHERE rr2 IN roots }
    }
  ) AS inScope