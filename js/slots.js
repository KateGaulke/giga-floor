// ============================================================
// SLOTS ENGINE - 3x3 grid, 5 win lines, re-spin, bonus questions
// Static explainers (no auto-dismiss)
// ============================================================
const SL_SYMS=['⚡','⚡','⚡','⚙️','⚙️','⚙️','📦','📦','📈','📈','⭐','💎'];
const SL_NAMES={'⚡':'Transformer','⚙️':'Switchboard','📦':'Data Center','📈':'GPS','⭐':'Giga Star','💎':'Bonus'};
const SL_PAY={'⚡':8,'⚙️':10,'📦':15,'📈':20,'⭐':50,'💎':25};
const SL_LINES=[[0,1,2],[3,4,5],[6,7,8],[0,4,8],[6,4,2]];
const SL_LINE_NAMES=['Top Row','Middle Row','Bottom Row','Diagonal ↘','Diagonal ↗'];
let slBet=0,slQuestion=null,slGrid=[],slSpinning=false;

function slRand(){return SL_SYMS[Math.floor(Math.random()*SL_SYMS.length)];}
// Luck-influenced reel: higher luck = more weight toward high-value symbols
function slLuckyRand(){
  let luck=luckFactor();
  let bias=(luck-0.5)*0.3; // -0.15 to +0.15
  if(bias>0&&Math.random()<bias){
    // Pick from high-value symbols
    let highVal=['⭐','💎','📈','📦'];
    return highVal[Math.floor(Math.random()*highVal.length)];
  }
  return slRand();
}

function slShowBet(){
  slBet=0;slSpinning=false;
  let area=document.getElementById('game');
  area.innerHTML=`<div class="game-header"><span class="game-title">Switchgear Slots<br><span style="font-size:11px;color:var(--gold);font-weight:700">Level ${S.levels.switchgear}</span></span><button class="back-btn" onclick="showScreen('lobby')">← Lobby</button></div>
    ${levelSelectorHtml('switchgear')}
    <div class="bet-area"><div class="bet-label">Bet Per Spin</div><div class="bet-amount" id="slbd">$0</div>
    <div class="chip-row"><div class="chip chip-25" onclick="slAddB(25)">$25</div><div class="chip chip-50" onclick="slAddB(50)">$50</div>
    <div class="chip chip-100" onclick="slAddB(100)">$100</div><div class="chip chip-500" onclick="slAddB(500)">$500</div></div>
    <div class="btn-row"><button class="btn-clear" onclick="slClrB()">Clear</button></div>
    <button class="deal-btn" id="sldeal" disabled onclick="slAskToSpin()">SPIN</button></div>
    <div style="font-size:11px;color:var(--dim);text-align:center;margin:8px 0;line-height:1.6">
    5 win lines: 3 rows + 2 diagonals<br>
    ⭐⭐⭐ 50x · 💎💎💎 25x · 📈📈📈 20x · 📦📦📦 15x · ⚙️⚙️⚙️ 10x · ⚡⚡⚡ 8x</div>`;
}
function slAddB(n){if(slBet+n>S.bankroll)return;slBet+=n;document.getElementById('slbd').textContent='$'+slBet.toLocaleString();document.getElementById('sldeal').disabled=false;}
function slClrB(){slBet=0;document.getElementById('slbd').textContent='$0';document.getElementById('sldeal').disabled=true;}

let slWinCells=new Set();

function slRenderMachine(spinning){
  let cells='';
  for(let i=0;i<9;i++){
    let sym=spinning?slRand():(slGrid[i]||'🎰');
    let highlight=!spinning&&slGrid.length&&slWinCells.has(i)?' sl-win-cell':'';
    cells+=`<div class="sl-cell${spinning?' spin':''}${highlight}" id="sl-c${i}">${sym}</div>`;
  }
  return `<div class="slot-frame"><div class="sl-grid">${cells}</div></div>`;
}

// Gate spin with a question — STATIC explainer (no auto-dismiss)
function slAskToSpin(){
  if(slSpinning)return;
  if(slBet>S.bankroll){slBet=S.bankroll;}
  if(slBet<=0)return;
  let lvl=getQLvl('switchgear');
  let pool=allQ(lvl);
  slQuestion=pickQ(pool,'sl'+lvl);
  let q=slQuestion;
  let area=document.getElementById('game');
  area.innerHTML=`<div class="game-header"><span class="game-title">Switchgear Slots<br><span style="font-size:11px;color:var(--gold);font-weight:700">Level ${S.levels.switchgear}</span></span><span class="game-title" style="text-align:right;line-height:1.4">$${slBet} bet<br><span style="font-size:10px;color:var(--dim)">Bank: $${S.bankroll.toLocaleString()}</span></span></div>
    ${luckMeterHtml()}
    <div class="q-box">
      <div style="font-size:12px;color:var(--gold);margin-bottom:8px">Answer correctly to SPIN. Wrong = you lose your bet.</div>
      <div class="q-text">${q.q}</div>
      ${q.o.map((o,i)=>`<button class="q-opt" onclick="slAnswerSpin(${i})">${o}</button>`).join('')}
    </div>
    <div id="sl-explain-area"></div>`;
}

function slAnswerSpin(i){
  let q=slQuestion,correct=i===q.a,lvl=getQLvl('switchgear');
  document.querySelectorAll('.q-opt').forEach((b,j)=>{
    b.disabled=true;if(j===q.a)b.classList.add('correct');if(j===i&&!correct)b.classList.add('wrong');
  });
  if(correct){S.stats.qRight++;S.stats.ts.switchgear.r[lvl-1]++;}
  else{S.stats.qWrong++;S.stats.ts.switchgear.wr[lvl-1]++;}
  adjustLuck(correct);
  recordStreak('switchgear',correct);

  // Show static explainer with Continue button (no auto-dismiss!)
  let explainArea=document.getElementById('sl-explain-area');
  if(!explainArea){explainArea=document.getElementById('game');}
  explainArea.innerHTML=`${questionHtml(q)}<div class="explain" style="margin:8px 0;font-size:14px"><span class="explain-label">${correct?'Correct':'Incorrect'}</span>${q.e}<br>${srcHtml(q.s)}</div>
    ${streakHtml('switchgear')}
    <button class="deal-btn" style="margin-top:12px;max-width:200px" onclick="slAfterAnswer(${correct})">${correct?'SPIN THE REELS':'Continue'}</button>`;
}

function slAfterAnswer(correct){
  if(correct){
    slSpin();
  } else {
    // Lose bet, no spin
    let ts=S.stats.ts.switchgear;ts.p++;ts.l++;
    S.stats.lost+=slBet;S.bankroll-=slBet;
    if(S.bankroll<25)S.bankroll=500;save();
    let q=slQuestion;
    let area=document.getElementById('game');
    area.innerHTML=`<div class="game-header"><span class="game-title">Switchgear Slots<br><span style="font-size:11px;color:var(--gold);font-weight:700">Level ${S.levels.switchgear}</span></span><span class="game-title" style="text-align:right;line-height:1.4">$${slBet} bet<br><span style="font-size:10px;color:var(--dim)">Bank: $${S.bankroll.toLocaleString()}</span></span></div>
      <div class="slot-frame"><div class="sl-grid">${'<div class="sl-cell">🚫</div>'.repeat(9)}</div></div>
      ${questionHtml(q)}
      ${explainBox(q.e,q.s)}
      <div class="result-box lose"><div>WRONG ANSWER</div><div class="result-amt lose">-$${slBet.toLocaleString()}</div>
      <div style="font-size:13px;color:var(--dim);margin-top:4px">No spin. Know your products to pull the lever.</div></div>
      <div style="display:flex;gap:8px;justify-content:center;margin:12px 0;flex-wrap:wrap">
        <button class="deal-btn" style="max-width:160px" onclick="slAskToSpin()" ${slBet<=S.bankroll?'':'disabled'}>TRY AGAIN $${slBet}</button>
        <button class="deal-btn" style="max-width:160px;background:none;border:2px solid var(--gold);color:var(--gold)" onclick="slShowBet()">Change Bet</button>
        <button class="deal-btn" style="max-width:160px;background:none;border:1px solid rgba(212,175,55,0.3);color:var(--dim)" onclick="showScreen('lobby')">Lobby</button>
      </div>`;
  }
}

function slSpin(){
  if(slSpinning)return;
  if(slBet>S.bankroll){slBet=S.bankroll;}
  if(slBet<=0)return;
  slSpinning=true;slWinCells=new Set();decayLuck();
  slGrid=[];for(let i=0;i<9;i++)slGrid.push(slLuckyRand());

  let area=document.getElementById('game');
  area.innerHTML=`<div class="game-header"><span class="game-title">Switchgear Slots<br><span style="font-size:11px;color:var(--gold);font-weight:700">Level ${S.levels.switchgear}</span></span><span class="game-title" style="text-align:right;line-height:1.4">$${slBet} bet<br><span style="font-size:10px;color:var(--dim)">Bank: $${S.bankroll.toLocaleString()}</span></span></div>
    ${slRenderMachine(true)}
    <div id="sl-info" style="text-align:center;min-height:24px;margin:8px 0;font-weight:700"></div>
    <div id="sl-actions"></div>
    <div id="sl-result"></div>`;

  let cycles=[];
  for(let i=0;i<9;i++){
    cycles.push(setInterval(()=>{let el=document.getElementById('sl-c'+i);if(el)el.textContent=slRand();},80));
  }

  const cols=[[0,3,6],[1,4,7],[2,5,8]];
  cols.forEach((col,ci)=>{
    setTimeout(()=>{
      col.forEach(idx=>{
        clearInterval(cycles[idx]);
        let el=document.getElementById('sl-c'+idx);
        if(el){el.textContent=slGrid[idx];el.classList.remove('spin');}
      });
      if(ci===2){setTimeout(()=>{slSpinning=false;slCheckWins();},300);}
    },700+ci*500);
  });
}

function slCheckWins(){
  let wins=[];
  SL_LINES.forEach((line,li)=>{
    let syms=line.map(i=>slGrid[i]);
    if(syms[0]===syms[1]&&syms[1]===syms[2]){
      wins.push({line:li,sym:syms[0],mult:SL_PAY[syms[0]]||10});
      line.forEach(i=>slWinCells.add(i));
    }
  });

  let area=document.getElementById('game');
  area.innerHTML=`<div class="game-header"><span class="game-title">Switchgear Slots<br><span style="font-size:11px;color:var(--gold);font-weight:700">Level ${S.levels.switchgear}</span></span><span class="game-title" style="text-align:right;line-height:1.4">$${slBet} bet<br><span style="font-size:10px;color:var(--dim)">Bank: $${S.bankroll.toLocaleString()}</span></span></div>
    ${slRenderMachine(false)}
    <div id="sl-info" style="text-align:center;min-height:24px;margin:8px 0;font-weight:700"></div>
    <div id="sl-actions"></div>
    <div id="sl-result"></div>`;

  let info=document.getElementById('sl-info');
  if(wins.length>0){
    let totalMult=wins.reduce((a,w)=>a+w.mult,0);
    let winDescs=wins.map(w=>`${SL_LINE_NAMES[w.line]}: ${SL_NAMES[w.sym]} x3 (${w.mult}x)`).join('<br>');
    info.innerHTML=`<span style="color:var(--win)">${wins.length} WIN LINE${wins.length>1?'S':''}!</span><br><span style="font-size:12px;color:var(--dim);font-weight:400">${winDescs}</span>`;
    slBonusQuestion(totalMult);
  } else {
    info.innerHTML=`<span style="color:var(--dim)">No win lines</span>`;
    slResolveLoss();
  }
}

function slBonusQuestion(baseMult){
  let lvl=getQLvl('switchgear');
  let pool=allQ(lvl);
  slQuestion=pickQ(pool,'sl'+lvl);
  let q=slQuestion;
  let opts=q.o.map((o,i)=>`<button class="q-opt" onclick="slAnswerBonus(${i},${baseMult})">${o}</button>`).join('');
  document.getElementById('sl-actions').innerHTML=`<div class="q-box">
    <div style="font-size:12px;color:var(--gold);margin-bottom:8px">BONUS: Answer correctly for ${baseMult*3}x! Wrong still pays ${baseMult}x.</div>
    <div class="q-text">${q.q}</div>${opts}</div>`;
}

function slAnswerBonus(i,baseMult){
  let q=slQuestion,correct=i===q.a,lvl=getQLvl('switchgear');
  document.querySelectorAll('.q-opt').forEach((b,j)=>{
    b.disabled=true;
    if(j===q.a)b.classList.add('correct');
    if(j===i&&!correct)b.classList.add('wrong');
  });
  if(correct){S.stats.qRight++;S.stats.ts.switchgear.r[lvl-1]++;}
  else{S.stats.qWrong++;S.stats.ts.switchgear.wr[lvl-1]++;}
  adjustLuck(correct);
  recordStreak('switchgear',correct);

  let mult=correct?baseMult*3:baseMult;
  let win=slBet*mult;
  let ts=S.stats.ts.switchgear;ts.p++;ts.w++;
  S.stats.won+=win;S.bankroll+=win;ts.earn=(ts.earn||0)+win;
  if(S.bankroll<25)S.bankroll=500;checkLevelUp('switchgear');save();

  let bonusMsg=correct?`BONUS! ${mult}x your bet!`:`${baseMult}x (correct was worth ${baseMult*3}x)`;
  document.getElementById('sl-result').innerHTML=`
    ${questionHtml(q)}
    ${explainBox(q.e,q.s)}
    <div class="result-box win"><div>${bonusMsg}</div><div class="result-amt win">+$${win.toLocaleString()}</div></div>`;
  document.getElementById('sl-actions').innerHTML=slResButtons();
}

function slResolveLoss(){
  let lvl=getQLvl('switchgear');
  let pool=allQ(lvl);
  slQuestion=pickQ(pool,'sl'+lvl);
  let q=slQuestion;
  let ts=S.stats.ts.switchgear;ts.p++;ts.l++;
  S.stats.lost+=slBet;S.bankroll-=slBet;
  if(S.bankroll<25)S.bankroll=500;save();
  document.getElementById('sl-result').innerHTML=`
    ${questionHtml(q)}
    ${explainBox(q.e,q.s,'Did You Know?')}
    <div class="result-box lose"><div>NO WIN LINES</div><div class="result-amt lose">-$${slBet.toLocaleString()}</div></div>`;
  document.getElementById('sl-actions').innerHTML=slResButtons();
}

function slResButtons(){
  return `<div style="display:flex;gap:8px;justify-content:center;margin:12px 0;flex-wrap:wrap">
    <button class="deal-btn" style="max-width:160px" onclick="slReSpin()" ${slBet<=S.bankroll?'':'disabled'}>RE-SPIN $${slBet}</button>
    <button class="deal-btn" style="max-width:160px;background:none;border:2px solid var(--gold);color:var(--gold)" onclick="slShowBet()">Change Bet</button>
    <button class="deal-btn" style="max-width:160px;background:none;border:1px solid rgba(212,175,55,0.3);color:var(--dim)" onclick="showScreen('lobby')">Lobby</button>
  </div>`;
}

function slReSpin(){
  if(slBet>S.bankroll)return;
  slAskToSpin();
}
