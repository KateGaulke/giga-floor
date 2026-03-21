// === STATE MANAGEMENT ===
const SK='gigafloor_v2';
const DS={bankroll:10000,levels:{transformers:1,switchgear:1,datacenters:1,gps:1},whaleUnlocked:false,
stats:{won:0,lost:0,qRight:0,qWrong:0,ts:{
transformers:{p:0,w:0,l:0,r:[0,0,0],wr:[0,0,0],earn:0},switchgear:{p:0,w:0,l:0,r:[0,0,0],wr:[0,0,0],earn:0},
datacenters:{p:0,w:0,l:0,r:[0,0,0],wr:[0,0,0],earn:0},gps:{p:0,w:0,l:0,r:[0,0,0],wr:[0,0,0],earn:0},whale:{p:0,w:0,l:0,earn:0}}}};

const STREAK_TO_LEVEL=5;
let S=load();

function load(){
  let s;
  try{s=localStorage.getItem(SK);s=s?JSON.parse(s):JSON.parse(JSON.stringify(DS))}
  catch(e){s=JSON.parse(JSON.stringify(DS))}
  if(!s.streaks)s.streaks={transformers:0,switchgear:0,datacenters:0,gps:0};
  return s;
}
function save(){localStorage.setItem(SK,JSON.stringify(S));updBR()}
function updBR(){document.querySelectorAll('[id^=br]').forEach(e=>e.innerHTML='<span>Bankroll</span>$'+S.bankroll.toLocaleString())}

function checkLevelUp(tableKey){
  if(tableKey==='whale')return;
  save();
}

function recordStreak(tableKey,correct){
  if(tableKey==='whale')return false;
  if(!S.streaks)S.streaks={transformers:0,switchgear:0,datacenters:0,gps:0};
  if(correct){
    S.streaks[tableKey]=(S.streaks[tableKey]||0)+1;
    if(S.streaks[tableKey]>=STREAK_TO_LEVEL&&S.levels[tableKey]<3){
      S.levels[tableKey]++;
      S.streaks[tableKey]=0;
      save();
      return true;
    }
  } else {
    S.streaks[tableKey]=0;
  }
  save();
  return false;
}

function streakHtml(tableKey){
  if(!S.streaks)S.streaks={transformers:0,switchgear:0,datacenters:0,gps:0};
  let streak=S.streaks[tableKey]||0;
  let lvl=S.levels[tableKey]||1;
  if(lvl>=3)return `<div style="text-align:center;margin:6px 0;font-size:11px;color:var(--gold)">🏆 MAX LEVEL</div>`;
  let dots='';
  for(let i=0;i<STREAK_TO_LEVEL;i++){
    dots+=`<span style="display:inline-block;width:10px;height:10px;border-radius:50%;margin:0 2px;${i<streak?'background:var(--gold)':'background:rgba(255,255,255,0.15)'}"></span>`;
  }
  return `<div style="text-align:center;margin:6px 0"><div style="font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Level ${lvl} → ${lvl+1}: ${streak}/${STREAK_TO_LEVEL} streak</div>${dots}</div>`;
}

// Smart question picker: avoids repeats until pool exhausted
let _asked={};
function pickQ(pool,key){
  if(!key)key='default';
  if(!_asked[key])_asked[key]=[];
  let avail=pool.filter((_,i)=>!_asked[key].includes(i));
  if(avail.length===0){_asked[key]=[];avail=pool;}
  let pick=avail[Math.floor(Math.random()*avail.length)];
  _asked[key].push(pool.indexOf(pick));
  return pick;
}

// Merged question pool: all 4 categories combined per level
function allQ(lvl){
  return [].concat(Q.transformers[lvl]||[],Q.switchgear[lvl]||[],Q.datacenters[lvl]||[],Q.gps[lvl]||[]);
}

// Level selection state — tracks player's chosen question level per table
// null means "use current table level" (default behavior)
let selectedQLevels={transformers:null,switchgear:null};

// Get effective question level for a table (selected or current)
function getQLvl(tableKey){
  let sel=selectedQLevels[tableKey];
  if(sel!==null&&sel!==undefined)return sel;
  return S.levels[tableKey]||1;
}

// Build level selector UI for games that support it
function levelSelectorHtml(tableKey){
  let maxLvl=S.levels[tableKey]||1;
  let curSel=getQLvl(tableKey);
  if(maxLvl<=1)return ''; // Only one level unlocked, no selector needed
  let btns='';
  for(let i=1;i<=3;i++){
    let active=i===curSel?' active':'';
    let disabled=i>maxLvl?' disabled':'';
    btns+=`<button class="${active}" ${disabled} onclick="selectedQLevels.${tableKey}=${i};this.parentNode.querySelectorAll('button').forEach(b=>b.classList.remove('active'));this.classList.add('active')">Lvl ${i}</button>`;
  }
  return `<div class="lvl-select"><span style="font-size:10px;color:var(--dim);align-self:center;margin-right:4px">Questions:</span>${btns}</div>`;
}

// Source link helper
function srcHtml(u){if(!u)return '';try{return '<a href="'+u+'" target="_blank" rel="noopener" class="src-link">Source: '+new URL(u).hostname.replace('www.','')+' ↗</a>'}catch(e){return ''}}

// Explanation box
function explainBox(text,src,label){
  label=label||'The Takeaway';
  return `<div class="explain"><span class="explain-label">${label}</span>${text}<br>${srcHtml(src)}</div>`;
}

// Build question HTML that stays visible — used by all games
function questionHtml(q){
  return `<div class="q-text" style="margin-bottom:0;padding:10px 14px;background:rgba(255,255,255,0.03);border-radius:8px;font-size:14px;color:var(--dim)"><b style="color:var(--txt)">Q:</b> ${q.q}</div>`;
}
