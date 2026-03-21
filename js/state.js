// === STATE MANAGEMENT ===
const SK='gigafloor_v2';
const DS={bankroll:10000,levels:{transformers:0,switchgear:0,datacenters:0,gps:0},whaleUnlocked:false,
stats:{won:0,lost:0,qRight:0,qWrong:0,ts:{
transformers:{p:0,w:0,l:0,r:[0,0,0],wr:[0,0,0],earn:0},switchgear:{p:0,w:0,l:0,r:[0,0,0],wr:[0,0,0],earn:0},
datacenters:{p:0,w:0,l:0,r:[0,0,0],wr:[0,0,0],earn:0},gps:{p:0,w:0,l:0,r:[0,0,0],wr:[0,0,0],earn:0},whale:{p:0,w:0,l:0,earn:0}}}};

const STREAK_TO_LEVEL=5;
const LUCK_BASE=50;
const LUCK_CORRECT=5;
const LUCK_WRONG=3;
const LUCK_DECAY=1;
let S=load();

function load(){
  let s;
  try{s=localStorage.getItem(SK);s=s?JSON.parse(s):JSON.parse(JSON.stringify(DS))}
  catch(e){s=JSON.parse(JSON.stringify(DS))}
  if(!s.streaks)s.streaks={transformers:0,switchgear:0,datacenters:0,gps:0};
  if(s.luck===undefined)s.luck=LUCK_BASE;
  if(!s.mastery)s.mastery={};
  return s;
}
function save(){localStorage.setItem(SK,JSON.stringify(S));updBR()}
function updBR(){
  let luckEmoji=S.luck>=65?'🍀':S.luck>=45?'🎲':'🥶';
  document.querySelectorAll('[id^=br]').forEach(e=>e.innerHTML='<span>Bankroll</span>$'+S.bankroll.toLocaleString()+`<span style="font-size:10px;color:var(--dim)">${luckEmoji} Luck: ${S.luck}%</span>`);
}

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
  let lvl=S.levels[tableKey]||0;
  if(lvl>=3)return `<div style="text-align:center;margin:6px 0;font-size:11px;color:var(--gold)">🏆 MAX LEVEL</div>`;
  let nextLabel=lvl===0?'Basics → Level 1':`Level ${lvl} → ${lvl+1}`;
  let dots='';
  for(let i=0;i<STREAK_TO_LEVEL;i++){
    dots+=`<span style="display:inline-block;width:10px;height:10px;border-radius:50%;margin:0 2px;${i<streak?'background:var(--gold)':'background:rgba(255,255,255,0.15)'}"></span>`;
  }
  return `<div style="text-align:center;margin:6px 0"><div style="font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${nextLabel}: ${streak}/${STREAK_TO_LEVEL} streak</div>${dots}</div>`;
}

// === LUCK SYSTEM ===
function adjustLuck(correct){
  let old=S.luck;
  if(correct){S.luck=Math.min(100,S.luck+LUCK_CORRECT);}
  else{S.luck=Math.max(0,S.luck-LUCK_WRONG);}
  save();
  animateLuck(S.luck>old);
}
function decayLuck(){
  if(S.luck>LUCK_BASE){S.luck=Math.max(LUCK_BASE,S.luck-LUCK_DECAY);save();}
  else if(S.luck<LUCK_BASE){S.luck=Math.min(LUCK_BASE,S.luck+LUCK_DECAY);save();}
}
// Returns a luck factor 0-1 (0.5 = neutral)
function luckFactor(){return S.luck/100;}

function luckMeterHtml(){
  let pct=S.luck;
  let color=pct>=65?'var(--win)':pct>=45?'var(--gold)':'var(--lose)';
  let label=pct>=80?'On Fire':pct>=65?'Lucky':pct>=45?'Neutral':pct>=25?'Cold':'Ice Cold';
  return `<div class="luck-meter" id="luck-meter"><div class="luck-label"><span>🍀 Luck</span><span>${label} (${pct}%)</span></div><div class="luck-bar"><div class="luck-fill" id="luck-fill" style="width:${pct}%;background:${color}"></div></div></div>`;
}

function animateLuck(up){
  let el=document.getElementById('luck-meter');
  if(!el)return;
  el.classList.remove('luck-up','luck-down');
  void el.offsetWidth; // force reflow
  el.classList.add(up?'luck-up':'luck-down');
  // Update meter display
  let pct=S.luck;
  let color=pct>=65?'var(--win)':pct>=45?'var(--gold)':'var(--lose)';
  let label=pct>=80?'On Fire':pct>=65?'Lucky':pct>=45?'Neutral':pct>=25?'Cold':'Ice Cold';
  let labelEl=el.querySelector('.luck-label');
  if(labelEl)labelEl.innerHTML=`<span>🍀 Luck</span><span>${label} (${pct}%)</span>`;
  let fill=document.getElementById('luck-fill');
  if(fill){fill.style.width=pct+'%';fill.style.background=color;}
}

// === ANSWER FEEDBACK ANIMATIONS ===
function showAnswerFeedback(correct){
  // Flash overlay with icon
  let flash=document.createElement('div');
  flash.className='answer-flash '+(correct?'correct':'wrong');
  flash.innerHTML=`<span class="flash-icon">${correct?'✓':'✗'}</span>`;
  document.body.appendChild(flash);
  setTimeout(()=>flash.remove(),900);

  // Confetti for correct answers
  if(correct){
    let container=document.createElement('div');
    container.className='confetti-container';
    let colors=['#d4af37','#27ae60','#f1c40f','#e67e22','#3498db','#e74c3c','#9b59b6'];
    for(let i=0;i<30;i++){
      let piece=document.createElement('div');
      piece.className='confetti-piece';
      piece.style.left=Math.random()*100+'%';
      piece.style.background=colors[Math.floor(Math.random()*colors.length)];
      piece.style.animationDelay=(Math.random()*0.4)+'s';
      piece.style.animationDuration=(0.8+Math.random()*0.8)+'s';
      piece.style.width=(6+Math.random()*8)+'px';
      piece.style.height=(6+Math.random()*8)+'px';
      piece.style.borderRadius=Math.random()>0.5?'50%':'2px';
      container.appendChild(piece);
    }
    document.body.appendChild(container);
    setTimeout(()=>container.remove(),1800);
  } else {
    // Shake the quiz box
    let qbox=document.querySelector('.q-box');
    if(qbox){qbox.classList.remove('shake');void qbox.offsetWidth;qbox.classList.add('shake');}
  }
}

// Smart question picker: prioritizes unmastered questions, avoids repeats
let _asked={};
function pickQ(pool,key,masteryLvl){
  if(!key)key='default';
  if(!_asked[key])_asked[key]=[];
  let mastered=new Set(masteryLvl!==undefined&&S.mastery[masteryLvl]?S.mastery[masteryLvl]:[]);
  // Priority 1: unasked AND unmastered
  let avail=pool.filter((_,i)=>!_asked[key].includes(i)&&!mastered.has(i));
  // Priority 2: unmastered (reset asked cycle)
  if(avail.length===0){
    let unm=pool.filter((_,i)=>!mastered.has(i));
    if(unm.length>0){_asked[key]=[];avail=unm;}
  }
  // Priority 3: all mastered — full reset, cycle through again
  if(avail.length===0){_asked[key]=[];avail=pool;}
  let pick=avail[Math.floor(Math.random()*avail.length)];
  _asked[key].push(pool.indexOf(pick));
  return pick;
}

// Mark a question as mastered (answered correctly)
function markMastered(lvl,question){
  let pool=allQ(lvl);
  let idx=pool.indexOf(question);
  if(idx===-1)return;
  if(!S.mastery[lvl])S.mastery[lvl]=[];
  if(!S.mastery[lvl].includes(idx)){S.mastery[lvl].push(idx);save();}
}

// Mastery progress display
function masteryHtml(lvl){
  let pool=allQ(lvl);
  if(!pool.length)return '';
  let m=(S.mastery[lvl]||[]).length;
  let t=pool.length;
  let pct=Math.round(m/t*100);
  let done=m>=t;
  let bar=`<div style="width:100%;max-width:200px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;margin:4px auto 0;overflow:hidden"><div style="width:${pct}%;height:100%;background:${done?'var(--gold)':'var(--win)'};border-radius:3px;transition:width 0.3s"></div></div>`;
  return `<div style="text-align:center;margin:6px 0;font-size:11px;color:${done?'var(--gold)':'var(--dim)'}">
    ${done?'🏆':'📚'} Mastered: ${m}/${t} questions (${pct}%)${bar}</div>`;
}

// Merged question pool: all 4 categories combined per level
function allQ(lvl){
  return [].concat(Q.transformers[lvl]||[],Q.switchgear[lvl]||[],Q.datacenters[lvl]||[],Q.gps[lvl]||[]);
}
// Check if all basics are complete (Level 0 unlocked to Level 1)
function basicsComplete(tableKey){return (S.levels[tableKey]||0)>=1;}
// Display-friendly level name
function lvlName(tableKey){let l=S.levels[tableKey]||0;return l===0?'Basics':'Level '+l;}

// Level selection state — tracks player's chosen question level per table
// null means "use current table level" (default behavior)
let selectedQLevels={transformers:null,switchgear:null};

// Get effective question level for a table (selected or current)
function getQLvl(tableKey){
  let sel=selectedQLevels[tableKey];
  if(sel!==null&&sel!==undefined)return sel;
  return S.levels[tableKey]||0;
}

// Build level selector UI for games that support it
function levelSelectorHtml(tableKey){
  let maxLvl=S.levels[tableKey]||0;
  let curSel=getQLvl(tableKey);
  if(maxLvl<1)return ''; // Still on Basics, no selector needed yet
  let btns=`<button class="${curSel===0?' active':''}" onclick="selectedQLevels.${tableKey}=0;this.parentNode.querySelectorAll('button').forEach(b=>b.classList.remove('active'));this.classList.add('active')">Basics</button>`;
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
