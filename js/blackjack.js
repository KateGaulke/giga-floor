// ============================================================
// BLACKJACK ENGINE - 6-deck shoe, split, hit/stand/double
// ============================================================
const SUITS=['♠','♥','♦','♣'];
const RANKS=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

// 6-deck shoe
let bjShoe=[];
const SHOE_DECKS=6;
const SHOE_CUT=78; // reshuffle when fewer than ~78 cards remain (about 25% of 312)

let bjHands=[];    // array of hands (for split support) — each hand is {cards:[], bet:number, done:boolean, result:string|null}
let bjActiveHand=0;
let bjDealer=[];
let bjBet=0;
let bjDone=false;
let bjQuestion=null;
let bjIsSplit=false;

function bjMakeShoe(){
  let d=[];
  for(let deck=0;deck<SHOE_DECKS;deck++){
    for(let s of SUITS)for(let r of RANKS)d.push({r,s});
  }
  // Fisher-Yates shuffle
  for(let i=d.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}
  return d;
}
function bjDraw(){
  if(bjShoe.length<SHOE_CUT)bjShoe=bjMakeShoe();
  return bjShoe.pop();
}

function bjCardVal(c){if('JQK'.includes(c.r))return 10;if(c.r==='A')return 11;return parseInt(c.r);}
function bjHandVal(hand){
  let cards=Array.isArray(hand)?hand:(hand.cards||[]);
  let t=0,aces=0;
  for(let c of cards){t+=bjCardVal(c);if(c.r==='A')aces++;}
  while(t>21&&aces>0){t-=10;aces--;}
  return t;
}
function bjIsRed(c){return c.s==='♥'||c.s==='♦';}
function bjCardHtml(c,faceDown){
  if(faceDown)return '<div class="bj-card bj-back"></div>';
  let color=bjIsRed(c)?'bj-red':'bj-blk';
  return `<div class="bj-card ${color}"><span class="bj-cr">${c.r}${c.s}</span><span class="bj-cs">${c.s}</span><span class="bj-cb">${c.r}${c.s}</span></div>`;
}
function bjHandHtml(cards,hideSecond){
  return cards.map((c,i)=>bjCardHtml(c,hideSecond&&i===1)).join('');
}

// Can split: first two cards of same rank, haven't split yet, enough bankroll
function bjCanSplit(){
  if(bjIsSplit)return false;
  let h=bjHands[bjActiveHand];
  if(!h||h.cards.length!==2)return false;
  if(bjCardVal(h.cards[0])!==bjCardVal(h.cards[1]))return false;
  if(S.bankroll<h.bet)return false;
  return true;
}

// Step 1: Show betting
function bjShowBet(){
  bjBet=0;bjDone=false;bjQuestion=null;bjIsSplit=false;bjHands=[];bjActiveHand=0;
  let area=document.getElementById('game');
  area.innerHTML=`<div class="game-header"><span class="game-title">Transformer Blackjack<br><span style="font-size:11px;color:var(--gold);font-weight:700">Level ${S.levels.transformers}</span></span><button class="back-btn" onclick="showScreen('lobby')">← Lobby</button></div>
    ${levelSelectorHtml('transformers')}
    <div class="bet-area"><div class="bet-label">Place Your Bet</div><div class="bet-amount" id="bjbd">$0</div>
    <div class="chip-row"><div class="chip chip-25" onclick="bjAdd(25)">$25</div><div class="chip chip-50" onclick="bjAdd(50)">$50</div>
    <div class="chip chip-100" onclick="bjAdd(100)">$100</div><div class="chip chip-500" onclick="bjAdd(500)">$500</div></div>
    <div class="btn-row"><button class="btn-clear" onclick="bjClr()">Clear</button></div>
    <button class="deal-btn" id="bjdeal" disabled onclick="bjDealCards()">DEAL</button></div>`;
}
function bjAdd(n){if(bjBet+n>S.bankroll)return;bjBet+=n;document.getElementById('bjbd').textContent='$'+bjBet.toLocaleString();document.getElementById('bjdeal').disabled=false;}
function bjClr(){bjBet=0;document.getElementById('bjbd').textContent='$0';document.getElementById('bjdeal').disabled=true;}
function bjQuickBet(amt){
  if(amt>S.bankroll)amt=S.bankroll;
  if(amt<=0)return;
  bjBet=amt;bjDone=false;bjQuestion=null;bjIsSplit=false;bjHands=[];bjActiveHand=0;
  bjDealCards();
}

// Step 2: Deal cards
function bjDealCards(){
  bjHands=[{cards:[bjDraw(),bjDraw()],bet:bjBet,done:false,result:null}];
  bjDealer=[bjDraw(),bjDraw()];
  bjActiveHand=0;bjDone=false;bjIsSplit=false;
  bjRenderTable(true);
  setTimeout(()=>bjCheckNatural(),600);
}

function bjCheckNatural(){
  let pv=bjHandVal(bjHands[0].cards),dv=bjHandVal(bjDealer);
  if(pv===21&&dv===21){bjResolveAll('push');return;}
  if(pv===21){bjResolveAll('blackjack');return;}
  if(dv===21){bjResolveAll('dealer_bj');return;}
  bjShowActions();
}

// === SPLIT ===
function bjAskSplit(){
  let lvl=getQLvl('transformers');
  let pool=allQ(lvl);
  bjQuestion=pickQ(pool,'bj'+lvl);
  let q=bjQuestion;
  document.getElementById('bj-actions').innerHTML=`<div class="q-box">
    <div style="font-size:12px;color:var(--gold);margin-bottom:8px">Answer correctly to SPLIT your pair. Wrong = no split, play continues.</div>
    <div class="q-text">${q.q}</div>
    ${q.o.map((o,i)=>`<button class="q-opt" onclick="bjAnswerSplit(${i})">${o}</button>`).join('')}</div>`;
}

function bjAnswerSplit(i){
  let q=bjQuestion,correct=i===q.a,lvl=getQLvl('transformers');
  document.querySelectorAll('.q-opt').forEach((b,j)=>{
    b.disabled=true;
    if(j===q.a)b.classList.add('correct');
    if(j===i&&!correct)b.classList.add('wrong');
  });
  if(correct){S.stats.qRight++;S.stats.ts.transformers.r[lvl-1]++;}
  else{S.stats.qWrong++;S.stats.ts.transformers.wr[lvl-1]++;}
  let lvlUp=recordStreak('transformers',correct);
  let explainHtml=`${questionHtml(q)}<div class="explain" style="margin:8px 0;font-size:14px"><span class="explain-label">${correct?'Correct':'Incorrect'}</span>${q.e}<br>${srcHtml(q.s)}</div>`;
  if(lvlUp)explainHtml+=`<div style="text-align:center;padding:8px;margin:8px 0;background:rgba(212,175,55,0.15);border-radius:8px;color:var(--gold);font-weight:700">🎰 LEVEL UP! Now Level ${S.levels.transformers}</div>`;
  explainHtml+=streakHtml('transformers');

  if(correct){
    // Perform split
    bjIsSplit=true;
    let h=bjHands[0];
    let c1=h.cards[0],c2=h.cards[1];
    bjHands=[
      {cards:[c1,bjDraw()],bet:h.bet,done:false,result:null},
      {cards:[c2,bjDraw()],bet:h.bet,done:false,result:null}
    ];
    S.bankroll-=h.bet; // second hand costs another bet
    save();
    bjActiveHand=0;
    bjRenderTable(true);
    // Check for 21 on first hand
    if(bjHandVal(bjHands[0].cards)===21){
      bjHands[0].done=true;
      bjActiveHand=1;
      if(bjHandVal(bjHands[1].cards)===21){
        bjHands[1].done=true;
        bjDealerPlay();
        return;
      }
    }
    bjShowActions(explainHtml);
  } else {
    let acts=document.getElementById('bj-actions');
    acts.innerHTML=explainHtml+`<button class="deal-btn" style="margin-top:12px;max-width:160px" onclick="bjShowActions()">Continue</button>`;
  }
}

// === HIT ===
function bjAskHit(){
  let lvl=getQLvl('transformers');
  let pool=allQ(lvl);
  bjQuestion=pickQ(pool,'bj'+lvl);
  let q=bjQuestion;
  document.getElementById('bj-actions').innerHTML=`<div class="q-box">
    <div style="font-size:12px;color:var(--gold);margin-bottom:8px">Answer correctly to HIT${bjIsSplit?' (Hand '+(bjActiveHand+1)+')':''}. Wrong = forced to STAND.</div>
    <div class="q-text">${q.q}</div>
    ${q.o.map((o,i)=>`<button class="q-opt" onclick="bjAnswerHit(${i})">${o}</button>`).join('')}</div>`;
}

function bjAnswerHit(i){
  let q=bjQuestion,correct=i===q.a,lvl=getQLvl('transformers');
  document.querySelectorAll('.q-opt').forEach((b,j)=>{
    b.disabled=true;
    if(j===q.a)b.classList.add('correct');
    if(j===i&&!correct)b.classList.add('wrong');
  });
  if(correct){S.stats.qRight++;S.stats.ts.transformers.r[lvl-1]++;}
  else{S.stats.qWrong++;S.stats.ts.transformers.wr[lvl-1]++;}
  let lvlUp=recordStreak('transformers',correct);
  let explainHtml=`${questionHtml(q)}<div class="explain" style="margin:8px 0;font-size:14px"><span class="explain-label">${correct?'Correct':'Incorrect'}</span>${q.e}<br>${srcHtml(q.s)}</div>`;
  if(lvlUp)explainHtml+=`<div style="text-align:center;padding:8px;margin:8px 0;background:rgba(212,175,55,0.15);border-radius:8px;color:var(--gold);font-weight:700">🎰 LEVEL UP! Now Level ${S.levels.transformers}</div>`;
  explainHtml+=streakHtml('transformers');
  if(correct){
    let h=bjHands[bjActiveHand];
    h.cards.push(bjDraw());
    bjRenderTable(true);
    if(bjHandVal(h.cards)>21){bjHandBust();return;}
    if(bjHandVal(h.cards)===21){bjHandStand();return;}
    bjShowActions(explainHtml);
  } else {
    let acts=document.getElementById('bj-actions');
    acts.innerHTML=explainHtml+`<button class="deal-btn" style="margin-top:12px;max-width:160px" onclick="bjHitWrongContinue()">Continue</button>`;
  }
}

function bjHitWrongContinue(){
  bjRenderTable(true);
  document.getElementById('bj-actions').innerHTML=`<div style="text-align:center;color:var(--lose);font-size:14px;font-weight:700;margin:8px 0">Wrong answer — forced to STAND</div>`;
  setTimeout(()=>bjHandStand(),1200);
}

// === STAND ===
function bjAskStand(){
  if(bjDone)return;
  let lvl=getQLvl('transformers');
  let pool=allQ(lvl);
  bjQuestion=pickQ(pool,'bj'+lvl);
  let q=bjQuestion;
  document.getElementById('bj-actions').innerHTML=`<div class="q-box">
    <div style="font-size:12px;color:var(--gold);margin-bottom:8px">Answer correctly to STAND clean${bjIsSplit?' (Hand '+(bjActiveHand+1)+')':''}. Wrong = lose your highest card.</div>
    <div class="q-text">${q.q}</div>
    ${q.o.map((o,i)=>`<button class="q-opt" onclick="bjAnswerStand(${i})">${o}</button>`).join('')}</div>`;
}

function bjAnswerStand(i){
  let q=bjQuestion,correct=i===q.a,lvl=getQLvl('transformers');
  document.querySelectorAll('.q-opt').forEach((b,j)=>{
    b.disabled=true;
    if(j===q.a)b.classList.add('correct');
    if(j===i&&!correct)b.classList.add('wrong');
  });
  if(correct){S.stats.qRight++;S.stats.ts.transformers.r[lvl-1]++;}
  else{S.stats.qWrong++;S.stats.ts.transformers.wr[lvl-1]++;}
  let lvlUp=recordStreak('transformers',correct);
  let acts=document.getElementById('bj-actions');
  let explainHtml=`${questionHtml(q)}<div class="explain" style="margin:8px 0;font-size:14px"><span class="explain-label">${correct?'Correct':'Incorrect'}</span>${q.e}<br>${srcHtml(q.s)}</div>`;
  if(lvlUp)explainHtml+=`<div style="text-align:center;padding:8px;margin:8px 0;background:rgba(212,175,55,0.15);border-radius:8px;color:var(--gold);font-weight:700">🎰 LEVEL UP! Now Level ${S.levels.transformers}</div>`;
  explainHtml+=streakHtml('transformers');
  acts.innerHTML=explainHtml+`<button class="deal-btn" style="margin-top:12px;max-width:160px" onclick="bjStandContinue(${correct})">Continue</button>`;
}

function bjStandContinue(correct){
  let h=bjHands[bjActiveHand];
  if(!correct&&h.cards.length>1){
    let bestIdx=0,bestVal=0;
    h.cards.forEach((c,idx)=>{
      let v=bjCardVal(c);
      if(c.r!=='A'&&v>bestVal){bestVal=v;bestIdx=idx;}
    });
    let removed=h.cards.splice(bestIdx,1)[0];
    bjRenderTable(true);
    document.getElementById('bj-actions').innerHTML=`<div style="text-align:center;color:var(--lose);font-size:14px;font-weight:700;margin:8px 0">Wrong — lost your ${removed.r}${removed.s}!</div>`;
    setTimeout(()=>bjHandStand(),1200);
  } else {
    bjHandStand();
  }
}

// === DOUBLE ===
function bjAskDouble(){
  let lvl=getQLvl('transformers');
  let pool=allQ(lvl);
  bjQuestion=pickQ(pool,'bj'+lvl);
  let q=bjQuestion;
  document.getElementById('bj-actions').innerHTML=`<div class="q-box">
    <div style="font-size:12px;color:var(--gold);margin-bottom:8px">Answer correctly to DOUBLE DOWN${bjIsSplit?' (Hand '+(bjActiveHand+1)+')':''}. Wrong = forced to STAND.</div>
    <div class="q-text">${q.q}</div>
    ${q.o.map((o,i)=>`<button class="q-opt" onclick="bjAnswerDouble(${i})">${o}</button>`).join('')}</div>`;
}

function bjAnswerDouble(i){
  let q=bjQuestion,correct=i===q.a,lvl=getQLvl('transformers');
  document.querySelectorAll('.q-opt').forEach((b,j)=>{
    b.disabled=true;
    if(j===q.a)b.classList.add('correct');
    if(j===i&&!correct)b.classList.add('wrong');
  });
  if(correct){S.stats.qRight++;S.stats.ts.transformers.r[lvl-1]++;}
  else{S.stats.qWrong++;S.stats.ts.transformers.wr[lvl-1]++;}
  let lvlUp=recordStreak('transformers',correct);
  let acts=document.getElementById('bj-actions');
  let explainHtml=`${questionHtml(q)}<div class="explain" style="margin:8px 0;font-size:14px"><span class="explain-label">${correct?'Correct':'Incorrect'}</span>${q.e}<br>${srcHtml(q.s)}</div>`;
  if(lvlUp)explainHtml+=`<div style="text-align:center;padding:8px;margin:8px 0;background:rgba(212,175,55,0.15);border-radius:8px;color:var(--gold);font-weight:700">🎰 LEVEL UP! Now Level ${S.levels.transformers}</div>`;
  explainHtml+=streakHtml('transformers');
  acts.innerHTML=explainHtml+`<button class="deal-btn" style="margin-top:12px;max-width:160px" onclick="bjDoubleContinue(${correct})">Continue</button>`;
}

function bjDoubleContinue(correct){
  let h=bjHands[bjActiveHand];
  if(correct){
    h.bet*=2;
    h.cards.push(bjDraw());
    bjRenderTable(true);
    if(bjHandVal(h.cards)>21){bjHandBust();return;}
    bjHandStand();
  } else {
    bjRenderTable(true);
    document.getElementById('bj-actions').innerHTML=`<div style="text-align:center;color:var(--lose);font-size:14px;font-weight:700;margin:8px 0">Wrong answer — forced to STAND</div>`;
    setTimeout(()=>bjHandStand(),1200);
  }
}

// === HAND MANAGEMENT (for split support) ===
function bjHandBust(){
  let h=bjHands[bjActiveHand];
  h.done=true;h.result='bust';
  bjAdvanceHand();
}

function bjHandStand(){
  let h=bjHands[bjActiveHand];
  h.done=true;
  bjAdvanceHand();
}

function bjAdvanceHand(){
  // Move to next unfinished hand, or dealer play
  for(let i=bjActiveHand+1;i<bjHands.length;i++){
    if(!bjHands[i].done){
      bjActiveHand=i;
      bjRenderTable(true);
      if(bjHandVal(bjHands[i].cards)===21){
        bjHands[i].done=true;
        bjAdvanceHand();
        return;
      }
      bjShowActions();
      return;
    }
  }
  // All hands done — dealer plays (unless all busted)
  let allBusted=bjHands.every(h=>h.result==='bust');
  if(allBusted){bjResolveAll();return;}
  bjDealerPlay();
}

// === ACTIONS ===
function bjShowActions(prefixHtml){
  let acts=document.getElementById('bj-actions');
  if(!acts)return;
  let h=bjHands[bjActiveHand];
  let canDouble=h.cards.length===2&&S.bankroll>=h.bet;
  let canSplit=bjCanSplit();
  let splitBtn=canSplit?`<button class="deal-btn" style="max-width:100px;display:inline-block;margin:4px;background:linear-gradient(135deg,#8e44ad,#9b59b6);color:#fff" onclick="bjAskSplit()">SPLIT</button>`:'';
  acts.innerHTML=(prefixHtml||'')+`
    ${bjIsSplit?`<div style="text-align:center;font-size:12px;color:var(--gold);margin:4px 0;font-weight:700">Playing Hand ${bjActiveHand+1} of ${bjHands.length}</div>`:''}
    <button class="deal-btn" style="max-width:100px;display:inline-block;margin:4px" onclick="bjAskHit()">HIT</button>
    <button class="deal-btn" style="max-width:100px;display:inline-block;margin:4px" onclick="bjAskStand()">STAND</button>
    ${canDouble?'<button class="deal-btn" style="max-width:140px;display:inline-block;margin:4px;background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff" onclick="bjAskDouble()">DOUBLE</button>':''}
    ${splitBtn}`;
}

// === RENDER ===
function bjRenderTable(hideDealer){
  let area=document.getElementById('game');
  let dv=hideDealer?'?':bjHandVal(bjDealer);
  let totalBet=bjHands.reduce((a,h)=>a+h.bet,0);

  // Dealer
  let html=`<div class="game-header"><span class="game-title">Transformer Blackjack<br><span style="font-size:11px;color:var(--gold);font-weight:700">Level ${S.levels.transformers}</span></span><span class="game-title" style="text-align:right;line-height:1.4">$${totalBet} bet<br><span style="font-size:10px;color:var(--dim)">Bank: $${S.bankroll.toLocaleString()}</span></span></div>
    <div style="text-align:center;margin:8px 0">
      <div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:1px">Dealer ${hideDealer?'':'— '+dv}</div>
      <div id="bj-dealer-hand" class="bj-hand">${bjHandHtml(bjDealer,hideDealer)}</div>
    </div>`;

  // Player hand(s)
  if(bjIsSplit){
    html+=`<div class="bj-split-hands">`;
    bjHands.forEach((h,hi)=>{
      let active=hi===bjActiveHand&&!bjDone;
      let pv=bjHandVal(h.cards);
      let cls=active?'active-hand':'inactive-hand';
      let resultTag=h.result?` <span style="color:${h.result==='bust'?'var(--lose)':'var(--win)'};font-size:10px">(${h.result.toUpperCase()})</span>`:'';
      html+=`<div class="bj-split-hand ${cls}">
        <div style="font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px">Hand ${hi+1} — ${pv}${resultTag}<br><span style="font-size:9px">$${h.bet} bet</span></div>
        <div class="bj-hand" style="min-height:60px">${bjHandHtml(h.cards,false)}</div>
      </div>`;
    });
    html+=`</div>`;
  } else {
    let pv=bjHandVal(bjHands[0].cards);
    html+=`<div style="text-align:center;margin:24px 0 8px">
      <div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:1px">Your Hand — ${pv}</div>
      <div class="bj-hand">${bjHandHtml(bjHands[0].cards,false)}</div>
    </div>`;
  }

  html+=`<div id="bj-actions" style="text-align:center;margin:12px 0"></div><div id="bj-result"></div>`;
  area.innerHTML=html;
}

// === DEALER PLAY ===
function bjDealerPlay(){
  bjRenderTable(false);
  function dealerStep(){
    if(bjHandVal(bjDealer)<17){
      bjDealer.push(bjDraw());
      bjRenderTable(false);
      setTimeout(dealerStep,600);
    } else {
      bjResolveAll();
    }
  }
  setTimeout(dealerStep,600);
}

// === RESOLVE ===
function bjResolveAll(override){
  bjDone=true;
  bjRenderTable(false);
  let ts=S.stats.ts.transformers;
  let dv=bjHandVal(bjDealer);
  let totalNet=0;

  // If override provided (natural, dealer bj, push on deal), apply to first hand only
  if(override){
    let h=bjHands[0];
    ts.p++;
    switch(override){
      case 'blackjack': h.result='blackjack';break;
      case 'push': h.result='push';break;
      case 'dealer_bj': h.result='dealer_bj';break;
    }
  } else {
    // Resolve each hand against dealer
    bjHands.forEach(h=>{
      if(h.result==='bust')return; // already resolved
      ts.p++;
      let pv=bjHandVal(h.cards);
      if(dv>21) h.result='dealer_bust';
      else if(pv>dv) h.result='win';
      else if(dv>pv) h.result='lose';
      else h.result='push';
    });
  }

  // Calculate payouts
  bjHands.forEach(h=>{
    let amt=0;
    switch(h.result){
      case 'blackjack': amt=Math.floor(h.bet*1.5);break;
      case 'win': case 'dealer_bust': amt=h.bet;break;
      case 'push': amt=0;break;
      case 'bust': case 'lose': case 'dealer_bj': amt=-h.bet;break;
    }
    if(amt>0){ts.w++;S.stats.won+=amt;S.bankroll+=amt;ts.earn=(ts.earn||0)+amt;}
    else if(amt<0){ts.l++;S.stats.lost+=Math.abs(amt);S.bankroll+=amt;}
    totalNet+=amt;
  });

  if(S.bankroll<25)S.bankroll=500;
  checkLevelUp('transformers');save();

  let q=bjQuestion;
  let resultHtml='';

  // Per-hand results
  bjHands.forEach((h,hi)=>{
    let amt=0;
    switch(h.result){
      case 'blackjack':amt=Math.floor(h.bet*1.5);break;
      case 'win':case 'dealer_bust':amt=h.bet;break;
      case 'bust':case 'lose':case 'dealer_bj':amt=-h.bet;break;
      default:amt=0;
    }
    let msg='',cls='';
    switch(h.result){
      case 'blackjack':msg='BLACKJACK!';cls='win';break;
      case 'win':msg='YOU WIN!';cls='win';break;
      case 'dealer_bust':msg='DEALER BUSTS!';cls='win';break;
      case 'push':msg='PUSH';cls='push';break;
      case 'bust':msg='BUST!';cls='lose';break;
      case 'lose':msg='DEALER WINS';cls='lose';break;
      case 'dealer_bj':msg='DEALER BLACKJACK';cls='lose';break;
    }
    let amtStr=amt>0?'+$'+amt.toLocaleString():amt<0?'-$'+Math.abs(amt).toLocaleString():'$0';
    let amtCls=amt>0?'win':amt<0?'lose':'';
    let handLabel=bjIsSplit?`<div style="font-size:11px;color:var(--dim);margin-bottom:4px">Hand ${hi+1}</div>`:'';
    resultHtml+=`<div class="result-box ${cls}">${handLabel}<div>${msg}</div><div class="result-amt ${amtCls}">${amtStr}</div></div>`;
  });

  let lastBet=bjBet;
  document.getElementById('bj-result').innerHTML=`
    ${q?`${questionHtml(q)}${explainBox(q.e,q.s)}`:''}
    ${resultHtml}
    <div style="text-align:center;margin:12px 0">
      <div style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Bankroll: $${S.bankroll.toLocaleString()}</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="deal-btn" style="max-width:180px" onclick="bjQuickBet(${Math.min(lastBet,S.bankroll)})">RE-BET $${Math.min(lastBet,S.bankroll)} & DEAL</button>
        <button class="deal-btn" style="max-width:120px;background:none;border:2px solid var(--gold);color:var(--gold)" onclick="bjShowBet()">Change Bet</button>
      </div>
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(212,175,55,0.15)">
        <div style="font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Or pick a new bet</div>
        <div class="chip-row">
          <div class="chip chip-25" style="width:44px;height:44px;font-size:11px" onclick="bjQuickBet(25)">$25</div>
          <div class="chip chip-50" style="width:44px;height:44px;font-size:11px" onclick="bjQuickBet(50)">$50</div>
          <div class="chip chip-100" style="width:44px;height:44px;font-size:11px" onclick="bjQuickBet(100)">$100</div>
          <div class="chip chip-500" style="width:44px;height:44px;font-size:11px" onclick="bjQuickBet(500)">$500</div>
        </div>
      </div>
      <button class="back-btn" style="margin-top:8px;font-size:12px" onclick="showScreen('lobby')">← Back to Floor</button>
    </div>`;
  document.getElementById('bj-actions').innerHTML='';
}
