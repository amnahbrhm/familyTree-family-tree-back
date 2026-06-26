// FamilyTree seed data.
//
// Labels/values are kept EXACTLY as the original schema: nodes are labeled
// `FAMILYMEMPER` and the female value is `famale` (both intentionally not
// renamed — see the build brief).
//
// Every person has a string `id` (used by GET /api/members/:id and the JWT
// strategy), and the additive/nullable fields added in Phase 1:
//   - deathDate (null/absent = alive)
//   - photoUrl  (null/absent = no photo)
//   - role      (member | moderator | admin)
// Marriage relationships (husband/wife) carry: marriageDate, divorceDate
// (only when divorced) and status (married | divorced). "Widowed" is derived
// when a spouse has a deathDate and the marriage is not divorced.
//
// Run this against an EMPTY database. To reset first:
//   MATCH (n) DETACH DELETE n

CREATE
// ----- Family A: Ibrahim's branch (admin at the root) -----------------------
(ibrahim:FAMILYMEMPER {id:"ibrahim", name:"Ibrahim", sex:'male', external:false,
  birthDate:'1945-02-10', maritalStatus:'married', role:'admin',
  phoneNumber:'966500000001', photoUrl:'https://i.pravatar.cc/150?u=ibrahim'}),
(badriah:FAMILYMEMPER {id:"badriah", name:"Badriah", sex:'famale', external:true,
  birthDate:'1950-06-01', maritalStatus:'married', role:'member',
  photoUrl:'https://i.pravatar.cc/150?u=badriah'}),

(lulu:FAMILYMEMPER {id:"lulu", name:"Lulu", sex:'famale', external:false,
  birthDate:'1968-04-12', deathDate:'2018-03-10', maritalStatus:'single', role:'member'}),
(gygy:FAMILYMEMPER {id:"gygy", name:"Joharah", sex:'famale', external:false,
  birthDate:'1970-09-22', maritalStatus:'single', role:'member'}),
(asma:FAMILYMEMPER {id:"asma", name:"Asma", sex:'famale', external:false,
  birthDate:'1972-01-15', maritalStatus:'single', role:'member'}),
(ibtesam:FAMILYMEMPER {id:"ibtesam", name:"ibtesam", sex:'famale', external:false,
  birthDate:'1974-07-30', maritalStatus:'single', role:'member'}),
(tahane:FAMILYMEMPER {id:"tahane", name:"Tahane", sex:'male', external:false,
  birthDate:'1976-11-05', maritalStatus:'single', role:'member'}),
(khulood:FAMILYMEMPER {id:"khulood", name:"Khulood", sex:'famale', external:false,
  birthDate:'1978-03-19', maritalStatus:'single', role:'member'}),
(amnah:FAMILYMEMPER {id:"amnah", name:"amnah", sex:'famale', external:false,
  birthDate:'1980-08-08', maritalStatus:'single', role:'member',
  phoneNumber:'966500000005'}),
(saleh:FAMILYMEMPER {id:"saleh", name:"Saleh", sex:'male', external:false,
  birthDate:'1975-05-25', maritalStatus:'married', role:'moderator',
  phoneNumber:'966500000002', photoUrl:'https://i.pravatar.cc/150?u=saleh'}),

(salma:FAMILYMEMPER {id:"salma", name:"Salma", sex:'famale', external:true,
  birthDate:'1982-12-01', maritalStatus:'married', role:'member'}),
(bisan:FAMILYMEMPER {id:"bisan", name:"Bisan", sex:'famale', external:false,
  birthDate:'2005-04-12', maritalStatus:'single', role:'member',
  phoneNumber:'966500000003'}),
(abdullah:FAMILYMEMPER {id:"abdullah", name:"Abdullah", sex:'male', external:false,
  birthDate:'2008-02-20', maritalStatus:'single', role:'member'}),
(ibrahimmi:FAMILYMEMPER {id:"ibrahimmi", name:"Ibrahim", sex:'male', external:false,
  birthDate:'2010-10-10', maritalStatus:'single', role:'member'}),

// ----- Family B: Hamad's polygamous branch (a moderator) --------------------
(hamad:FAMILYMEMPER {id:"hamad", name:"Hamad", sex:'male', external:false,
  birthDate:'1955-03-03', maritalStatus:'married', role:'moderator',
  phoneNumber:'966500000004', photoUrl:'https://i.pravatar.cc/150?u=hamad'}),
// Wife 1 — currently married
(noura:FAMILYMEMPER {id:"noura", name:"Noura", sex:'famale', external:true,
  birthDate:'1965-07-01', maritalStatus:'married', role:'member',
  photoUrl:'https://i.pravatar.cc/150?u=noura'}),
// Wife 2 — divorced
(sara:FAMILYMEMPER {id:"sara", name:"Sara", sex:'famale', external:true,
  birthDate:'1968-09-14', maritalStatus:'divorced', role:'member'}),
// Wife 3 — deceased (marriage not divorced -> widowed is derived)
(maryam:FAMILYMEMPER {id:"maryam", name:"Maryam", sex:'famale', external:true,
  birthDate:'1970-05-20', deathDate:'2015-08-20', maritalStatus:'married', role:'member'}),
// Wife 4 — currently married (a man may have up to 4 active wives)
(fatimah:FAMILYMEMPER {id:"fatimah", name:"Fatimah", sex:'famale', external:true,
  birthDate:'1975-01-30', maritalStatus:'married', role:'member',
  photoUrl:'https://i.pravatar.cc/150?u=fatimah'}),

// Hamad's children, grouped by mother
(rakan:FAMILYMEMPER {id:"rakan", name:"Rakan", sex:'male', external:false,
  birthDate:'1990-04-04', maritalStatus:'single', role:'member',
  photoUrl:'https://i.pravatar.cc/150?u=rakan'}),
(lina:FAMILYMEMPER {id:"lina", name:"Lina", sex:'famale', external:false,
  birthDate:'1993-06-16', maritalStatus:'single', role:'member'}),
(tariq:FAMILYMEMPER {id:"tariq", name:"Tariq", sex:'male', external:false,
  birthDate:'1996-08-21', maritalStatus:'single', role:'member'}),
(huda:FAMILYMEMPER {id:"huda", name:"Huda", sex:'famale', external:false,
  birthDate:'2000-02-11', maritalStatus:'single', role:'member'}),
(sami:FAMILYMEMPER {id:"sami", name:"Sami", sex:'male', external:false,
  birthDate:'2002-12-25', maritalStatus:'single', role:'member'}),
(dana:FAMILYMEMPER {id:"dana", name:"Dana", sex:'famale', external:false,
  birthDate:'2005-10-09', maritalStatus:'single', role:'member'}),
// A child of Hamad whose mother is NOT in the DB (childrenWithUnknownMother)
(omar:FAMILYMEMPER {id:"omar", name:"Omar", sex:'male', external:false,
  birthDate:'1985-01-01', maritalStatus:'single', role:'member'}),

// ----- A pending edit request (target inside Saleh's moderator scope) -------
(er1:EDITREQUEST {id:"er1", proposedChanges:'{"birthDate":"2004-04-12"}',
  status:'pending', createdAt:'2026-06-20', decidedAt:null, decidedBy:null}),

// ===== Relationships ========================================================

// --- Family A marriages ---
(ibrahim)-[:husband {marriageDate:'1967-01-01', status:'married'}]-> (badriah),
(badriah)-[:wife]-> (ibrahim),

(saleh)-[:husband {marriageDate:'2003-06-15', status:'married'}]-> (salma),
(salma)-[:wife]-> (saleh),

// --- Family A: Ibrahim + Badriah -> children ---
(ibrahim)-[:father]-> (lulu),
(ibrahim)-[:father]-> (gygy),
(ibrahim)-[:father]-> (asma),
(ibrahim)-[:father]-> (ibtesam),
(ibrahim)-[:father]-> (tahane),
(ibrahim)-[:father]-> (khulood),
(ibrahim)-[:father]-> (amnah),
(ibrahim)-[:father]-> (saleh),

(badriah)-[:mother]-> (lulu),
(badriah)-[:mother]-> (gygy),
(badriah)-[:mother]-> (asma),
(badriah)-[:mother]-> (ibtesam),
(badriah)-[:mother]-> (tahane),
(badriah)-[:mother]-> (khulood),
(badriah)-[:mother]-> (amnah),
(badriah)-[:mother]-> (saleh),

(lulu)-[:child]-> (ibrahim),
(asma)-[:child]-> (ibrahim),
(gygy)-[:child]-> (ibrahim),
(ibtesam)-[:child]-> (ibrahim),
(tahane)-[:child]-> (ibrahim),
(khulood)-[:child]-> (ibrahim),
(amnah)-[:child]-> (ibrahim),
(saleh)-[:child]-> (ibrahim),
(lulu)-[:child]-> (badriah),
(asma)-[:child]-> (badriah),
(gygy)-[:child]-> (badriah),
(ibtesam)-[:child]-> (badriah),
(tahane)-[:child]-> (badriah),
(khulood)-[:child]-> (badriah),
(amnah)-[:child]-> (badriah),
(saleh)-[:child]-> (badriah),

// --- Family A: Saleh + Salma -> children ---
(saleh)-[:father]-> (bisan),
(saleh)-[:father]-> (abdullah),
(saleh)-[:father]-> (ibrahimmi),

(salma)-[:mother]-> (bisan),
(salma)-[:mother]-> (abdullah),
(salma)-[:mother]-> (ibrahimmi),

(bisan)-[:child]-> (salma),
(abdullah)-[:child]-> (salma),
(ibrahimmi)-[:child]-> (salma),
(bisan)-[:child]-> (saleh),
(abdullah)-[:child]-> (saleh),
(ibrahimmi)-[:child]-> (saleh),

// --- Family B: Hamad's marriages (polygamous) ---
(hamad)-[:husband {marriageDate:'1989-01-01', status:'married'}]-> (noura),
(noura)-[:wife]-> (hamad),
(hamad)-[:husband {marriageDate:'1994-05-01', divorceDate:'2005-03-01', status:'divorced'}]-> (sara),
(sara)-[:wife]-> (hamad),
(hamad)-[:husband {marriageDate:'1998-02-01', status:'married'}]-> (maryam),
(maryam)-[:wife]-> (hamad),
(hamad)-[:husband {marriageDate:'2003-11-20', status:'married'}]-> (fatimah),
(fatimah)-[:wife]-> (hamad),

// Hamad + Noura -> Rakan, Lina
(hamad)-[:father]-> (rakan),
(hamad)-[:father]-> (lina),
(noura)-[:mother]-> (rakan),
(noura)-[:mother]-> (lina),
(rakan)-[:child]-> (hamad),
(lina)-[:child]-> (hamad),
(rakan)-[:child]-> (noura),
(lina)-[:child]-> (noura),

// Hamad + Sara -> Tariq
(hamad)-[:father]-> (tariq),
(sara)-[:mother]-> (tariq),
(tariq)-[:child]-> (hamad),
(tariq)-[:child]-> (sara),

// Hamad + Maryam -> Huda, Sami
(hamad)-[:father]-> (huda),
(hamad)-[:father]-> (sami),
(maryam)-[:mother]-> (huda),
(maryam)-[:mother]-> (sami),
(huda)-[:child]-> (hamad),
(sami)-[:child]-> (hamad),
(huda)-[:child]-> (maryam),
(sami)-[:child]-> (maryam),

// Hamad + Fatimah -> Dana
(hamad)-[:father]-> (dana),
(fatimah)-[:mother]-> (dana),
(dana)-[:child]-> (hamad),
(dana)-[:child]-> (fatimah),

// Hamad -> Omar (mother unknown / not in DB)
(hamad)-[:father]-> (omar),
(omar)-[:child]-> (hamad),

// ----- Moderator scopes (MODERATES) -----------------------------------------
// Saleh moderates his own branch (himself + descendants: bisan, abdullah, ibrahimmi).
(saleh)-[:MODERATES]-> (saleh),
// Hamad moderates his own branch (himself + all his children).
(hamad)-[:MODERATES]-> (hamad),

// ----- Edit request links ---------------------------------------------------
// Bisan (a member) proposed a change to her OWN profile; target is inside
// Saleh's moderator scope so the Phase 4 approval flow is testable.
(er1)-[:TARGET]-> (bisan),
(er1)-[:SUBMITTED_BY]-> (bisan)