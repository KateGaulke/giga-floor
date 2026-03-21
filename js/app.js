// === TABLES (lobby configuration) ===
const T={
  transformers:{n:'Transformer Blackjack',i:'🃏',d:'All products. Win hands, learn everything.',c:'Transformers'},
  switchgear:{n:'Switchgear Slots',i:'🎰',d:'All products. Spin to learn.',c:'Switchboards'},
  whale:{n:'The Whale',i:'🐋',d:'Close the deal with a real customer',c:'Sales Sim'}
};

let curTable=null,curBet=0;

// === SCREENS ===
function showScreen(n){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('s-'+n).classList.add('active');
  document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
  let nb=document.getElementById('n-'+n);if(nb)nb.classList.add('active');
  if(n==='lobby')renderLobby();if(n==='guide')renderGuide();if(n==='stats')renderStats();
  updBR();
}

// === LOBBY ===
function renderLobby(){
  S.whaleUnlocked=(S.levels.transformers>=2&&S.levels.switchgear>=2);save();
  let h='';
  for(let[k,t]of Object.entries(T)){
    let isW=k==='whale',locked=isW&&!S.whaleUnlocked;
    let lvl=isW?(S.whaleUnlocked?'OPEN':'LOCKED'):'Lvl '+S.levels[k];
    let ts=S.stats.ts[k],total=isW?ts.p:((ts.r[0]+ts.r[1]+ts.r[2])||0);
    let wrong=isW?0:((ts.wr[0]+ts.wr[1]+ts.wr[2])||0);
    let pct=total+wrong>0?Math.round(total/(total+wrong)*100):0;
    h+=`<div class="table-card${locked?' locked':''}" onclick="startTable('${k}')">
      <div class="tc-top"><span class="tc-icon">${t.i}</span><span class="tc-level">${lvl}</span></div>
      <div class="tc-name">${t.n}</div><div class="tc-desc">${t.d}</div>
      <div class="tc-bar"><div class="tc-fill" style="width:${pct}%"></div></div></div>`;
  }
  document.getElementById('lobby').innerHTML=h;
}

// === START TABLE ===
function startTable(k){curTable=k;curBet=0;showScreen('game');
  if(k==='transformers'){bjShowBet();}
  else if(k==='switchgear'){slShowBet();}
  else if(k==='whale'){whStart();}
}

// === STUDY GUIDE ===
const GD={
transformers:{t:'Transformers',c:`<h3>What They Do</h3><p>Step voltage up or down. Giga takes high-voltage utility power and delivers it at usable levels.</p>
<h4>3-Phase Padmount</h4><ul><li>Up to 46 kV, up to 10,000 kVA</li><li>In-stock: 1-2 business days (Long Beach, CA)</li><li>Custom: 12-14 weeks vs competitors' 52-104+ weeks</li><li>75 kVA ~$32,400 / 2,500 kVA ~$80,000</li></ul>
<h4>MV Substation</h4><ul><li>5-35 kV, up to 60 MVA. For needs above 10 MVA</li><li>Custom: ~26 weeks</li></ul>
<h4>HV Substation</h4><ul><li>69-138 kV, up to 100 MVA</li><li>Load tap changers, Buchholz relay, copper construction</li></ul>
<h4>1-Phase Padmount</h4><ul><li>Up to 35 kV, 250 kVA. Residential underground</li><li>In-stock: 2-6 weeks (Houston)</li></ul>
<h4>Polemount & Dry-Type</h4><ul><li>Polemount: gray cylinders on utility poles</li><li>Dry-type: air-cooled, safe indoors</li></ul>
<h3>Key Numbers</h3><ul><li>1,000+ transformers built, 3.5+ GW delivered</li><li>3-year warranty, free shipping (contiguous US)</li><li>Houston factory: 3,000+ units/year target</li><li>Distributors: Graybar, Border States, CED, Rexel</li></ul>
<h3>Standards</h3><table><tr><th>Standard</th><th>Meaning</th></tr><tr><td>UL-Listed</td><td>Safety-tested by Underwriters Labs</td></tr><tr><td>IEEE C57</td><td>Transformer design/test standard</td></tr><tr><td>DOE 2016</td><td>Min efficiency requirements</td></tr><tr><td>NEC 450</td><td>Installation safety</td></tr></table>`},
switchgear:{t:'Switchboards',c:`<h3>What They Do</h3><p>Distribute transformer power to multiple circuits with breaker protection.</p>
<h3>UL 891 Switchboard</h3><ul><li>480V up to 4,000A / 600V up to 2,000A / 800V coming</li><li>65 or 100 KAIC</li><li>NEMA 1 (indoor) or 3R (outdoor)</li><li>Up to 12 ABB breakers per cabinet</li><li>Base ~$90,000</li><li>8-12 weeks (7 expedited) vs 20-52+ weeks competitors</li></ul>
<h3>Customization (no lead time impact)</h3><ul><li>Surge protection, metering, ground fault, CTs/VTs</li></ul>
<h3>Skid-Mounted</h3><p>Transformer + switchboard pre-wired on one base, factory-tested, one delivery.</p>`},
datacenters:{t:'Data Centers',c:`<h3>Product Line</h3>
<h4>Giga Box Air</h4><ul><li>Air-cooled (fans + filters)</li><li>M: 20', 600 kW / L: 40', 1,430 kW</li><li>8-12 weeks. Primary: Bitcoin mining</li></ul>
<h4>Giga Box Hydro</h4><ul><li>Liquid-cooled, rated 113°F</li><li>Siemens PLC, N+1 pumps</li><li>12-16 weeks, built to order</li></ul>
<h4>Giga Box HPC</h4><ul><li>AI/GPU workloads, 26 racks/pod, 165+ kW/rack</li><li>Consultative custom sale</li></ul>
<h3>Site Development</h3><ul><li>6-8 months vs 24-36+ industry standard</li><li>175 MW operating / 500+ MW pipeline</li><li>4 grid regions: ERCOT, SPP, MISO, PJM</li></ul>
<h3>Air vs Hydro</h3><table><tr><th></th><th>Air</th><th>Hydro</th></tr><tr><td>Cooling</td><td>Fans</td><td>Liquid loop</td></tr><tr><td>Heat</td><td>Ambient</td><td>113°F</td></tr><tr><td>Lead time</td><td>8-12 wk</td><td>12-16 wk</td></tr><tr><td>Indoor?</td><td>No</td><td>Yes (skid)</td></tr></table>`},
gps:{t:'Giga Power Systems',c:`<h3>What It Is</h3><p>Software platform helping flexible-load data centers earn from wholesale energy markets. Launched Jan 13, 2026.</p>
<h3>Revenue</h3><table><tr><th>Approach</th><th>$/MW/Year</th></tr><tr><td>Generic DR</td><td>~$20,000</td></tr><tr><td>GPS-optimized</td><td>$50,000-$80,000</td></tr><tr><td>50 MW facility</td><td>~$3.25M/year</td></tr></table>
<h3>Four Revenue Streams</h3><ul><li>Energy arbitrage</li><li>Ancillary services</li><li>Demand response</li><li>Capacity payments</li></ul>
<h3>SPP Market</h3><ul><li>14 states, reserves shrinking (39% → 5% by 2029)</li><li>Heavy wind = price swings = profit</li></ul>
<h3>Expansion</h3><ul><li>ERCOT (Texas), PJM (13 states, biggest DC corridor), MISO (Midwest)</li></ul>
<h3>Sales Talking Points</h3><ul><li>"$40-60K/MW/year on the table"</li><li>"We eat our own cooking" (175 MW)</li><li>"One vendor, hardware to revenue"</li><li>"Settle 2x faster" (30-45 vs 60-90 days)</li></ul>`},
company:{t:'Company',c:`<h3>The Story</h3><p>Founded 2019 by Brent Whitehead & Matt Lohstroh at Texas A&M. Bitcoin mining with lawn-mowing money → $150M+ revenue by 2025. Forbes 30 Under 30.</p>
<h3>Key Numbers</h3><table><tr><td>Revenue (2025)</td><td>$150M+</td></tr><tr><td>Equipment</td><td>3.5+ GW</td></tr><tr><td>Transformers</td><td>1,000+</td></tr><tr><td>Switchboards</td><td>200+</td></tr><tr><td>Data centers</td><td>750+</td></tr><tr><td>Operating</td><td>175 MW / 15 sites</td></tr><tr><td>Pipeline</td><td>500+ MW</td></tr><tr><td>Team</td><td>70+</td></tr></table>
<h3>Manufacturing</h3><ul><li>Houston, TX: transformers (60K sq ft)</li><li>Long Beach, CA: switchboards + DC assembly</li><li>Mumbai + Shanghai: global ops</li></ul>
<h3>Industries</h3><p>AI/Data Centers, Bitcoin, Utilities, Renewables, Oil & Gas, Industrial, Distributors</p>`}
};

function renderGuide(){
  let keys=Object.keys(GD);
  document.getElementById('gtabs').innerHTML=keys.map((k,i)=>`<button class="guide-tab${i===0?' active':''}" onclick="swGuide('${k}',this)">${GD[k].t}</button>`).join('');
  document.getElementById('gcontent').innerHTML=keys.map((k,i)=>`<div class="guide-sec${i===0?' active':''}" id="g-${k}">${GD[k].c}</div>`).join('');
}
function swGuide(k,el){
  document.querySelectorAll('.guide-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.guide-sec').forEach(s=>s.classList.remove('active'));
  el.classList.add('active');document.getElementById('g-'+k).classList.add('active');
}

// === STATS ===
function renderStats(){
  let s=S.stats,tq=s.qRight+s.qWrong,acc=tq?Math.round(s.qRight/tq*100):0;
  let h=`<div class="stat-card"><h3>Overall</h3>
    <div class="stat-row"><span class="lb">Bankroll</span><span class="vl">$${S.bankroll.toLocaleString()}</span></div>
    <div class="stat-row"><span class="lb">Total Won</span><span class="vl" style="color:var(--win)">$${s.won.toLocaleString()}</span></div>
    <div class="stat-row"><span class="lb">Total Lost</span><span class="vl" style="color:var(--lose)">$${s.lost.toLocaleString()}</span></div>
    <div class="stat-row"><span class="lb">Accuracy</span><span class="vl">${acc}% (${s.qRight}/${tq})</span></div></div>`;
  for(let[k,t]of Object.entries(T)){
    if(k==='whale')continue;
    let ts=s.ts[k];
    h+=`<div class="stat-card"><h3>${t.i} ${t.n}</h3>
      <div class="stat-row"><span class="lb">Level</span><span class="vl"><span class="lvl-badge">Level ${S.levels[k]}</span></span></div>
      <div class="stat-row"><span class="lb">Played</span><span class="vl">${ts.p}</span></div>
      <div class="stat-row"><span class="lb">Won / Lost</span><span class="vl">${ts.w} / ${ts.l}</span></div>
      <div class="stat-row"><span class="lb">Table Earnings</span><span class="vl" style="color:var(--gold)">$${(ts.earn||0).toLocaleString()}</span></div>
      <div class="stat-row"><span class="lb">Streak</span><span class="vl">${S.levels[k]>=3?'MAX LEVEL':(S.streaks[k]||0)+'/'+STREAK_TO_LEVEL+' to Level '+(S.levels[k]+1)}</span></div></div>`;
  }
  // Whale stats
  let wts=s.ts.whale;
  h+=`<div class="stat-card"><h3>🐋 The Whale</h3>
    <div class="stat-row"><span class="lb">Meetings</span><span class="vl">${wts.p}</span></div>
    <div class="stat-row"><span class="lb">Deals Closed / Lost</span><span class="vl">${wts.w} / ${wts.l}</span></div>
    <div class="stat-row"><span class="lb">Commissions</span><span class="vl" style="color:var(--gold)">$${(wts.earn||0).toLocaleString()}</span></div></div>`;
  h+=`<div style="text-align:center;margin:16px 0"><button class="btn-clear" onclick="if(confirm('Reset all progress?')){localStorage.removeItem(SK);S=JSON.parse(JSON.stringify(DS));save();renderStats()}">Reset Progress</button></div>`;
  document.getElementById('stats').innerHTML=h;
}

// === INIT ===
updBR();renderLobby();
