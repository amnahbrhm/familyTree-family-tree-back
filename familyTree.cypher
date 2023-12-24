CREATE 
(ibrahim:FAMILYMEMPER{name:"Ibrahim", sex: 'male', external: false}),
(badriah:FAMILYMEMPER{name:"Badriah", sex: 'famale', external: true}),
(lulu:FAMILYMEMPER{name:"Lulu", sex: 'famale', external: false}),
(gygy:FAMILYMEMPER{name:"Joharah", sex: 'famale', external: false}),
(asma:FAMILYMEMPER{name:"Asma", sex: 'famale', external: false}),
(ibtesam:FAMILYMEMPER{name:"ibtesam", sex: 'famale', external: false}),
(tahane:FAMILYMEMPER{name:"Tahane", sex: 'male', external: false}),
(khulood:FAMILYMEMPER{name:"Khulood", sex: 'famale', external: false}),
(amnah:FAMILYMEMPER{name:"amnah", sex: 'famale', external: false}),
(saleh:FAMILYMEMPER{name:"Saleh", sex: 'male', external: false}),
(bisan:FAMILYMEMPER{name:"Bisan", sex: 'famale', external: false}),
(ibrahimmi:FAMILYMEMPER{name:"Ibrahim", sex: 'male', external: false}),
(abdullah:FAMILYMEMPER{name:"Abdullah", sex: 'male', external: false}),
(salma:FAMILYMEMPER{name:"Salma", sex: 'famale', external: true}),



(ibrahim)-[:husband]-> (badriah),
(badriah)-[:wife]-> (ibrahim),

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

(saleh)-[:husband]-> (salma),
(salma)-[:wife]-> (saleh),

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
(ibrahimmi)-[:child]-> (saleh)



// QUERY

//Sibling query
MATCH (p:FAMILYMEMPER{name: 'Bisan'}) -[:child]-> (n) MATCH (n:FAMILYMEMPER) -[:father]-> (c) RETURN c


