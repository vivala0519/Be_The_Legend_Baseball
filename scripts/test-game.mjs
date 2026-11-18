import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Compile the inert TS source into an ignored test-only directory. No browser or app is started.
const root = process.cwd();
const out = path.join(root, 'work', 'engine-test-runtime');
await fs.mkdir(out, { recursive: true });
for (const file of ['game-types', 'leagues', 'amateur-japan', 'amateur-korea', 'amateur-taiwan', 'amateur-us-texas', 'amateur-western-names', 'amateur-search', 'amateur-marks', 'amateur', 'game']) {
  const source = await fs.readFile(path.join(root, 'lib', `${file}.ts`), 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
  const code = result.outputText.replace(/from ['"](\.\/[\w-]+)['"]/g, "from '$1.mjs'");
  await fs.writeFile(path.join(out, `${file}.mjs`), code);
}
const game = await import(pathToFileURL(path.join(out, 'game.mjs')));
const data = await import(pathToFileURL(path.join(out, 'leagues.mjs')));
const { AMATEUR_COUNTRIES, getAmateurAffiliations } = await import(pathToFileURL(path.join(out, 'amateur.mjs')));
const { createAffiliationSearch } = await import(pathToFileURL(path.join(out, 'amateur-search.mjs')));
const { getAmateurMark } = await import(pathToFileURL(path.join(out, 'amateur-marks.mjs')));
const { createCareer, simulateSeason, advanceOffseason, retireCareer, getOverall, careerTotals, statsRates, validateCareer, emptyStats } = game;
const { LEAGUES, TEAMS, teamsForLeague } = data;
let checks = 0;
const report = [];
function check(condition, message) { checks++; assert.ok(condition, message); }
function eq(actual, expected, message) { checks++; assert.deepEqual(actual, expected, message); }
const clone = value => JSON.parse(JSON.stringify(value));

function assertStats(s, role, prefix) {
  for (const [key, value] of Object.entries(s)) check(Number.isInteger(value) && value >= 0, `${prefix}: ${key} integer and nonnegative`);
  check(s.h <= s.ab && s.ab <= s.pa, `${prefix}: H <= AB <= PA`);
  check(s.hr + s.doubles + s.triples <= s.h, `${prefix}: extra-base hits <= H`);
  if (role === 'batter') eq(s.pa, s.ab + s.bb + s.hbp + s.sf, `${prefix}: all PA accounted for`);
  else {
    eq(s.pa, s.ab + s.bba + s.hbp + s.sf, `${prefix}: pitcher batters faced accounted for`);
    check(s.so <= s.outs, `${prefix}: strikeouts <= pitching outs`);
    check(s.w + s.l <= s.g, `${prefix}: at most one pitching decision per appearance`);
    check(s.sv <= s.g, `${prefix}: saves <= appearances`);
  }
  const r = statsRates(s);
  eq(r.totalBases, s.h + s.doubles + s.triples * 2 + s.hr * 3, `${prefix}: total bases`);
  eq(r.innings, `${Math.floor(s.outs / 3)}.${s.outs % 3}`, `${prefix}: integer-out innings`);
  const era = Math.round((s.outs ? s.er * 27 / s.outs : 0) * 100) / 100;
  eq(r.era, era, `${prefix}: ERA from integer outs`);
  for (const key of ['avg','obp','slg','ops','era','whip']) check(Number.isFinite(r[key]), `${prefix}: finite ${key}`);
}
function assertSeason(career, label) {
  const s = career.history.at(-1), league = LEAGUES.find(l => l.id === s.leagueId);
  eq(s.games.length, league.games, `${label}: correct league game count`);
  eq(s.teamRecord.wins + s.teamRecord.losses + s.teamRecord.draws, league.games, `${label}: WLD sum`);
  check(s.teamRecord.rank >= 1 && s.teamRecord.rank <= teamsForLeague(s.leagueId).length, `${label}: valid rank`);
  assertStats(s.stats, s.role, `${label} season`);
  const totals = emptyStats();
  for (const [i, g] of s.games.entries()) {
    check(g.opponentId !== s.teamId, `${label} ${i}: no self opponent`);
    check(teamsForLeague(s.leagueId).some(t => t.id === g.opponentId), `${label} ${i}: opponent same league`);
    eq(g.result, g.scoreFor > g.scoreAgainst ? 'W' : g.scoreFor < g.scoreAgainst ? 'L' : 'D', `${label} ${i}: result matches score`);
    if (s.leagueId === 'MLB') check(g.result !== 'D', `${label} ${i}: MLB no draws`);
    assertStats(g.stats, s.role, `${label} game ${i}`);
    if (s.role === 'batter') {
      check(g.stats.r <= g.scoreFor, `${label} ${i}: player runs <= team runs`);
      check(g.stats.rbi <= g.scoreFor, `${label} ${i}: player RBI <= team runs`);
    } else check(g.stats.er <= g.scoreAgainst, `${label} ${i}: earned runs <= opponent runs`);
    for (const key of Object.keys(totals)) totals[key] += g.stats[key];
  }
  eq(totals, s.stats, `${label}: season equals game sum`);
  check(validateCareer(career) !== null, `${label}: generated save validates`);
  eq(validateCareer(JSON.parse(JSON.stringify(career))), career, `${label}: JSON roundtrip`);
}

eq(TEAMS.length, 58, '58 clubs across the four leagues');
for (const [id, count] of [['KBO',10],['NPB',12],['MLB',30],['CPBL',6]]) eq(teamsForLeague(id).length, count, `${id} team count`);
eq(new Set(TEAMS.map(t=>t.id)).size, TEAMS.length, 'unique team IDs');
const roleProfiles = [{role:'batter', styles:['contact','power','speed'],position:'CF'}, {role:'pitcher',styles:['velocity','control','breaking'],position:'SP'}];
const distribution = [];
for (const league of LEAGUES) for (const profile of roleProfiles) for (const style of profile.styles) {
  const label = `${league.id}/${profile.role}/${style}`;
  const initial = createCareer({name:'엔진검증',role:profile.role,position:profile.position,style,leagueId:league.id,teamId:teamsForLeague(league.id)[0].id,seed:191040+style.length});
  eq(getOverall(initial.player), 45, `${label}: balanced rookie OVR45`);
  check(validateCareer(initial) !== null, `${label}: initial save valid`);
  const before = JSON.stringify(initial), a = simulateSeason(initial), b = simulateSeason(initial);
  eq(a, b, `${label}: deterministic seed + choices`);
  eq(JSON.stringify(initial), before, `${label}: simulation does not mutate input`);
  assertSeason(a, label);
  eq(simulateSeason(a), a, `${label}: completed season cannot run twice`);
  const next = advanceOffseason(a, a.offers[0].id);
  eq(next.phase,'ready',`${label}: next phase ready`);
  eq(next.year,2027,`${label}: year increments`);
  eq(next.player.age,19,`${label}: age increments`);
  eq(next.season,2,`${label}: career year increments`);
  check(validateCareer(next)!==null,`${label}: next year save valid`);
  distribution.push({league:league.id,role:profile.role,style,g:a.history[0].stats.g,ovr:getOverall(a.player),...statsRates(a.history[0].stats)});
}
for (const position of ['RP','CP']) {
  let c = createCareer({name:'불펜검증',role:'pitcher',position,style:'control',leagueId:'MLB',teamId:teamsForLeague('MLB')[1].id,seed:4568});
  c = simulateSeason(c); assertSeason(c,position);
  if (position==='CP') check(c.history[0].stats.sv>0,'closer can earn saves');
}

const expectedAffiliations = { KR: 78, JP: 3608, US: 1230, TW: 41, DO: 53, VE: 38 };
const allAffiliations = Object.keys(AMATEUR_COUNTRIES).flatMap(getAmateurAffiliations);
eq(new Set(allAffiliations.map(affiliation => affiliation.id)).size, allAffiliations.length, 'unique affiliation IDs');
eq(new Set(getAmateurAffiliations('JP').map(affiliation => affiliation.region)).size, 47, 'all Japanese prefectures');

for (const country of ['JP', 'US', 'DO', 'VE']) {
  check(getAmateurAffiliations(country).every(affiliation => /\p{Script=Hangul}/u.test(affiliation.name)
    && !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Latin}]/u.test(affiliation.name)
    && affiliation.nativeName), `${country}: localized display with original search names`);
}
const searchCases = [
  ['JP', 'jp-429-大阪桐蔭', ['오사카토인', '오사카 도인 고교', '大阪桐蔭', '大阪桐蔭高等学校']],
  ['US', 'us-lake-travis', ['레이크트래비스', 'Lake Travis High School']],
  ['DO', 'do-la-javilla', ['라하비야', 'Academia La Javilla']],
  ['VE', 've-david-concepcion', ['Academia David Concepción', 'David Concepcion']],
  ['VE', 've-carlos-guillen', ['카를로스기옌', 'Academia Carlos Guillén']],
];
for (const [country, id, queries] of searchCases) {
  const entries = getAmateurAffiliations(country);
  const search = createAffiliationSearch(entries);
  const entry = entries.find(affiliation => affiliation.id === id);
  check(entry, `${country}: ${id} keeps its existing ID`);
  for (const query of [entry.name, ...queries]) {
    check(search(query).some(affiliation => affiliation.id === id), `${country}: search matches ${query}`);
  }
}

const marks = allAffiliations.map(getAmateurMark).filter(Boolean);
check(getAmateurAffiliations('KR').every(getAmateurMark), 'every Korean school has a mark');
check(getAmateurMark(getAmateurAffiliations('JP').find(affiliation => affiliation.id === 'jp-429-大阪桐蔭')), 'Osaka Toin mark survives localization');
for (const mark of marks) {
  check(mark.src.startsWith('/amateur-marks/') && mark.sourceUrl.startsWith('https://'), `${mark.src}: local image and attribution source`);
  check((await fs.stat(path.join(root, 'public', mark.src))).size > 0, `${mark.src}: bundled image exists`);
}

for (const [country, rules] of Object.entries(AMATEUR_COUNTRIES)) {
  const affiliations = getAmateurAffiliations(country);
  const affiliation = affiliations[0];
  const role = rules.kind === 'school' ? 'batter' : 'pitcher';
  const label = `${country} ${rules.kind}`;
  eq(affiliations.length, expectedAffiliations[country], `${label}: verified catalog coverage`);
  let c = createCareer({ name: '아마추어 검증', role, hand: role === 'batter' ? '좌투우타' : '좌투', amateurAffiliationId: affiliation.id, seed: 120591 });
  eq(c.player.hand, role === 'batter' ? '좌투우타' : '좌투', `${label}: selected handedness is saved`);
  eq(c.player.age, rules.startAge, `${label}: correct starting age`);
  eq(c.teamId, null, `${label}: starts without a professional club`);
  eq(c.leagueId, null, `${label}: starts without a professional league`);
  eq(retireCareer(c), c, `${label}: cannot retire as a professional before signing`);
  for (let i = 1; i <= rules.seasons; i++) {
    eq(c.season, i, `${label}: correct amateur season`);
    eq(validateCareer(clone(c)), c, `${label}: saves before amateur season ${i}`);
    const before = clone(c);
    c = simulateSeason(c);
    eq(c, simulateSeason(before), `${label}: amateur schedule is deterministic`);
    eq(simulateSeason(c), c, `${label}: amateur season cannot run twice`);
    const season = c.amateur.history.at(-1);
    eq(season.games.length, rules.games, `${label}: simulated amateur schedule`);
    check(season.games.every(game => affiliations.some(opponent => opponent.id === game.opponentId && opponent.id !== affiliation.id)), `${label}: games use actual catalog opponents`);
    const opponentCount = new Set(season.games.map(game => game.opponentId)).size;
    check(season.teamRecord.rank <= opponentCount + 1, `${label}: rank is relative to scheduled opponents`);
    assertStats(season.stats, role, `${label} season ${i}`);
    eq(careerTotals(c).g, 0, `${label}: amateur games excluded from professional totals`);
    eq(c.hallScore, 0, `${label}: amateur games excluded from hall score`);
    eq(validateCareer(clone(c)), c, `${label}: saves after amateur season ${i}`);
    if (i < rules.seasons) {
      eq(c.offers.length, 0, `${label}: no offers before final season`);
      c = advanceOffseason(c);
    }
  }
  eq(c.offers.length, 2, `${label}: receives two first pro offers`);
  check(c.offers.every(offer => offer.leagueId === rules.leagueId && !offer.isCurrent), `${label}: offers route to the correct pro league`);
  assert.throws(() => advanceOffseason(c, 'missing-offer'), /첫 프로 계약/);
  const offer = c.offers[1];
  const invalid = clone(c);
  invalid.amateur.history[0].games[0].opponentId = offer.teamId;
  eq(validateCareer(invalid), null, `${label}: rejects professional opponents in an amateur save`);
  c = advanceOffseason(validateCareer(clone(c)), offer.id);
  eq(c.teamId, offer.teamId, `${label}: joins chosen professional club`);
  eq(c.leagueId, rules.leagueId, `${label}: joins intended professional league`);
  eq(c.player.age, rules.startAge + rules.seasons, `${label}: ages through amateur years`);
  eq(c.season, 1, `${label}: starts at professional season one`);
  eq(c.amateur.history.length, rules.seasons, `${label}: retains amateur history after signing`);
  eq(c.amateur.status, 'completed', `${label}: finalizes amateur stage`);
  eq(validateCareer(clone(c)), c, `${label}: saves after first pro contract`);
  c = simulateSeason(c);
  assertSeason(c, `${label} first pro season`);
  eq(careerTotals(c).g, c.history[0].stats.g, `${label}: only pro stats count after promotion`);
}

// The two visible player-development controls must change their intended outcomes.
const trainingBase = createCareer({name:'육성검증',role:'batter',style:'contact',leagueId:'KBO',teamId:teamsForLeague('KBO')[0].id,seed:904177});
const trainContact = simulateSeason({...clone(trainingBase),training:['contact']});
const trainPower = simulateSeason({...clone(trainingBase),training:['power']});
eq(trainContact.history[0].stats,trainPower.history[0].stats,'training allocation applies after this season performance');
check(trainContact.player.attributes.contact>trainPower.player.attributes.contact,'contact focus improves contact growth');
check(trainPower.player.attributes.power>trainContact.player.attributes.power,'power focus improves power growth');
const aggressive = simulateSeason({...clone(trainingBase),plan:'aggressive'});
const rest = simulateSeason({...clone(trainingBase),plan:'rest'});
check(aggressive.fatigue>rest.fatigue,'aggressive workload has a fatigue cost');

// Skilled players must see reachable offers in every league, and accepted offers change the actual next season.
let elite = createCareer({name:'이적검증',role:'batter',leagueId:'KBO',teamId:teamsForLeague('KBO')[0].id,seed:777});
for (const k of Object.keys(elite.player.attributes)) elite.player.attributes[k]=92;
elite = simulateSeason(elite);
for (const league of LEAGUES) check(elite.offers.some(o=>o.leagueId===league.id),`elite has a ${league.id} career path`);
for (const offer of elite.offers) {
  const next = advanceOffseason(elite,offer.id); eq(next.leagueId,offer.leagueId,'offer league applied');eq(next.teamId,offer.teamId,'offer club applied');eq(next.salary,offer.salary,'offer salary applied');
}

for (const role of ['batter','pitcher']) {
  let c = createCareer({name:`끝까지${role}`,role,position:role==='batter'?'SS':'SP',leagueId:'CPBL',teamId:teamsForLeague('CPBL')[0].id,seed:10343});
  let iterations=0;
  while(c.phase!=='retired' && iterations++<30) {
    c = simulateSeason(c); assertSeason(c,`${role} career ${c.season}`);
    const priority = ['CPBL','KBO','NPB','MLB'][Math.floor(c.season/5)%4];
    const chosen=c.offers.find(o=>o.leagueId===priority)||c.offers[0];
    c=advanceOffseason(c,chosen?.id);
  }
  eq(c.phase,'retired',`${role}: automatically retires`);
  check(c.history.length>=20 && c.player.age<=41,`${role}: full 20+ season career`);
  check(validateCareer(c)!==null,`${role}: retired save validates`);
  const totals=careerTotals(c), summed=emptyStats();
  for(const s of c.history)for(const key of Object.keys(summed))summed[key]+=s.stats[key];
  for(const key of Object.keys(summed))eq(totals[key],summed[key],`${role}: career total ${key}`);
  eq(retireCareer(c),c,`${role}: retirement is idempotent`);
  report.push({role,seasons:c.history.length,hallScore:c.hallScore,tier:c.retirement.tier,peak:totals.peakOverall,leaguePaths:[...new Set(c.history.map(s=>s.leagueId))]});
}

const valid=elite;
for(const malformed of [null,{},[],NaN,undefined,42,'text',{schemaVersion:1}, {...clone(valid),seed:NaN}, {...clone(valid),teamId:'invented'}, {...clone(valid),salary:Infinity}]) eq(validateCareer(malformed),null,'reject malformed root data');
for(const key of ['player','history','offers','events','awards','training','phase','year','season','salary']) {const bad=clone(valid);delete bad[key];eq(validateCareer(bad),null,`reject missing ${key}`);}
const edits=[c=>c.player.name='',c=>c.player.age=-1,c=>c.player.attributes.contact=Infinity,c=>c.history[0].stats.h=c.history[0].stats.ab+1,c=>c.history[0].games[0].scoreFor=-1,c=>c.history[0].teamRecord.wins++,c=>c.history[0].games[0].opponentId=c.teamId,c=>c.history[0].games[0].stats.h++];
for(const edit of edits){const bad=clone(valid);edit(bad);eq(validateCareer(bad),null,'reject damaged save');}
const zero=statsRates(emptyStats());for(const value of Object.values(zero))check(typeof value==='string'||Number.isFinite(value),'zero-sample rate finite');
const precise=emptyStats();precise.outs=17;precise.er=2;eq(statsRates(precise).innings,'5.2','17 outs display 5.2');eq(statsRates(precise).era,3.18,'17 outs ERA uses 5 2/3 not decimal 5.2');
precise.ha=4;precise.bba=2;precise.hbp=3;eq(statsRates(precise).whip,1.06,'WHIP excludes hit batters');
let balance;
if (process.argv.includes('--balance')) {
  const runs = [];
  for (const [leagueIndex, league] of LEAGUES.entries()) for (const [roleIndex, role] of ['batter','pitcher'].entries()) for (let i=0;i<20;i++) {
    const seed = (89137 + i * 104729 + leagueIndex * 73061 + roleIndex * 43391) >>> 0;
    let c = createCareer({name:`밸런스${i}`,role,position:role==='batter'?'CF':'SP',style:role==='batter'?['contact','power','speed'][i%3]:['velocity','control','breaking'][i%3],leagueId:league.id,teamId:teamsForLeague(league.id)[i%teamsForLeague(league.id).length].id,seed});
    const potential=c.player.potential;
    while(c.phase!=='retired') {c=simulateSeason(c);c=advanceOffseason(c,c.offers.find(o=>o.isCurrent)?.id);}
    const totals=careerTotals(c);
    runs.push({league:league.id,role,seed,potential,score:c.hallScore,hall:c.retirement.hallOfFame,peak:totals.peakOverall,peakOps:Math.max(...c.history.map(s=>statsRates(s.stats).ops)),mvps:c.awards.filter(a=>a.name==='MVP').length,pitcherAwards:c.awards.filter(a=>['사이영상','최우수 투수'].includes(a.name)).length});
  }
  const summary = values => ({count:values.length,hall:values.filter(x=>x.hall).length,hallRate:Math.round(values.filter(x=>x.hall).length/values.length*1000)/10,potentialMean:Math.round(values.reduce((s,x)=>s+x.potential,0)/values.length*10)/10,scoreMean:Math.round(values.reduce((s,x)=>s+x.score,0)/values.length),scoreMin:Math.min(...values.map(x=>x.score)),scoreMax:Math.max(...values.map(x=>x.score)),mvpCareers:values.filter(x=>x.mvps).length,mvps:values.reduce((s,x)=>s+x.mvps,0)});
  balance={threshold:game.HALL_THRESHOLD,overall:summary(runs),byLeague:Object.fromEntries(LEAGUES.map(l=>[l.id,summary(runs.filter(x=>x.league===l.id))])),byRole:Object.fromEntries(['batter','pitcher'].map(role=>[role,summary(runs.filter(x=>x.role===role))])),potentialBands:{below75:runs.filter(x=>x.potential<75).length,from75to90:runs.filter(x=>x.potential>=75&&x.potential<=90).length,above91:runs.filter(x=>x.potential>=92).length},runs};
}
console.log(JSON.stringify({ok:true,checks,rookieProfiles:distribution,careers:report,...(balance?{balance}:{})},null,2));
