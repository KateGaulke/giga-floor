// ============================================================
// WHALE ENGINE - Sales conversation sim, trust meter, multi-turn
// Expanded with more scenarios and customer archetypes
// ============================================================
const WH_CUSTOMERS=[
  {name:'Marcus Chen',role:'VP of Infrastructure, 50 MW Bitcoin Mining Co',avatar:'👔',
   intro:"We've got 50 megawatts of miners in Oklahoma and our margins are getting crushed by electricity costs. Heard you guys might be able to help.",
   personality:'numbers-driven, impatient, wants ROI fast'},
  {name:'Dana Okafor',role:'CTO, AI Startup Scaling Fast',avatar:'👩‍💻',
   intro:"We need to go from 5 MW to 40 MW of GPU compute in the next 8 months. Everyone says that timeline is impossible. Can you actually do it?",
   personality:'technical, deadline-focused, skeptical of bold claims'},
  {name:'Jim Hartley',role:'Procurement Manager, Regional Utility',avatar:'🏗️',
   intro:"I've got a new subdivision going in, 400 homes, all underground. And separately, we need a 75 MVA substation for an industrial park. What can Giga do for us?",
   personality:'methodical, risk-averse, wants proven track record'},
  {name:'Sarah Kim',role:'Director of Operations, Multi-Site Mining Operator',avatar:'📊',
   intro:"We run 5 sites across Texas and Oklahoma. We're using a demand response provider but I keep hearing we could be making more. And we need to replace some aging transformers.",
   personality:'strategic, comparison-shopper, wants data'},
  {name:'Raj Patel',role:'CEO, Edge Computing Startup',avatar:'💡',
   intro:"We're deploying edge compute nodes in rural areas. Need power infrastructure that can handle 2-5 MW per site, fast. We've got 8 sites to build out this year.",
   personality:'fast-moving, wants turnkey solutions, budget-conscious'},
  {name:'Carmen Reyes',role:'VP of Engineering, Hyperscale Data Center Operator',avatar:'🔬',
   intro:"We're spec'ing out a 100 MW campus build. Our current vendor just told us 24 months for transformers alone. That's not going to work.",
   personality:'deeply technical, high standards, enterprise procurement mindset'}
];

// Customer-specific dialogue responses (more varied and personality-matched)
const WH_CORRECT_RESPONSES=[
  ["Exactly what I wanted to hear.","That's the kind of answer that keeps me in this conversation.","Now we're talking. What else?","OK, you actually know your stuff."],
  ["Impressive. That matches what our engineers are looking for.","That's a real answer, not marketing. I respect that.","Alright, you've got my attention. Go on.","That's exactly the data point I needed."],
  ["Good. Our board will want to hear numbers like that.","That gives me something concrete to take back to my team.","Perfect. That's what I was hoping you'd say.","You're building a solid case here."]
];
const WH_WRONG_RESPONSES=[
  ["Hmm, that doesn't sound right.","I'm not sure that's accurate...","My engineers would push back on that.","That's not the answer I was looking for."],
  ["Hold on — that doesn't match what I've heard.","I think you need to check your numbers on that one.","That's a red flag for me.","I'd want to verify that before we go further."],
  ["Let me talk to your competitor instead.","If you don't know this, what else are you getting wrong?","That concerns me.","Not confident in that answer? Neither am I."]
];

let whBet=0,whTrust=50,whTurn=0,whCustomer=null,whQuestions=[],whChat=[],whDone=false;

function whStart(){
  whBet=0;whDone=false;
  let area=document.getElementById('game');
  area.innerHTML=`<div class="game-header"><span class="game-title">The Whale</span><button class="back-btn" onclick="showScreen('lobby')">← Lobby</button></div>
    <div class="bet-area"><div class="bet-label">Your Commission</div><div class="bet-amount" id="whbd">$0</div>
    <div class="chip-row"><div class="chip chip-25" onclick="whAddB(25)">$25</div><div class="chip chip-50" onclick="whAddB(50)">$50</div>
    <div class="chip chip-100" onclick="whAddB(100)">$100</div><div class="chip chip-500" onclick="whAddB(500)">$500</div></div>
    <div class="btn-row"><button class="btn-clear" onclick="whClrB()">Clear</button></div>
    <button class="deal-btn" id="whdeal" disabled onclick="whBegin()">MEET THE CLIENT</button></div>`;
}
function whAddB(n){if(whBet+n>S.bankroll)return;whBet+=n;document.getElementById('whbd').textContent='$'+whBet.toLocaleString();document.getElementById('whdeal').disabled=false;}
function whClrB(){whBet=0;document.getElementById('whbd').textContent='$0';document.getElementById('whdeal').disabled=true;}

function whBegin(){
  whTrust=50;whTurn=0;whChat=[];whDone=false;
  whCustomer=WH_CUSTOMERS[Math.floor(Math.random()*WH_CUSTOMERS.length)];
  // Pick 5 whale questions (was 4, now more for deeper conversations)
  let pool=[...Q.whale].sort(()=>Math.random()-0.5);
  whQuestions=pool.slice(0,5);
  whChat.push({who:'cust',text:whCustomer.intro});
  whRender();
  setTimeout(()=>whShowTurn(),800);
}

function whRender(){
  let area=document.getElementById('game');
  let trustColor=whTrust>=60?'var(--win)':whTrust>=40?'var(--gold)':'var(--lose)';
  let trustLabel=whTrust>=80?'Very Confident':whTrust>=60?'Interested':whTrust>=40?'Neutral':whTrust>=20?'Skeptical':'Walking Away';
  let chatHtml=whChat.map(c=>`<div class="wh-bubble ${c.who==='cust'?'cust':'you'}">${c.text}</div>`).join('');
  area.innerHTML=`<div class="game-header"><span class="game-title">${whCustomer.avatar} ${whCustomer.name}</span><button class="back-btn" onclick="showScreen('lobby')">← Lobby</button></div>
    <div style="font-size:11px;color:var(--dim)">${whCustomer.role}</div>
    <div style="font-size:10px;color:var(--dim);font-style:italic;margin-top:2px">${whCustomer.personality}</div>
    ${luckMeterHtml()}
    <div class="wh-trust-label"><span>Trust</span><span>${trustLabel}</span></div>
    <div class="wh-trust"><div class="wh-trust-fill" style="width:${whTrust}%;background:${trustColor}"></div></div>
    <div class="wh-chat" id="wh-chat">${chatHtml}</div>
    <div id="wh-actions"></div>
    <div id="wh-result"></div>`;
  // Scroll chat to bottom
  let chatEl=document.getElementById('wh-chat');
  if(chatEl)chatEl.scrollTop=chatEl.scrollHeight;
}

function whShowTurn(){
  if(whTurn>=whQuestions.length||whTrust<=0){whResolve();return;}
  let q=whQuestions[whTurn];
  let prompts=['How would you respond?','The conversation continues...','They lean in...','Another question comes your way...','Final moment...'];
  let prompt=prompts[Math.min(whTurn,prompts.length-1)];
  let opts=q.o.map((o,i)=>`<button class="wh-choice" onclick="whAnswer(${i})">${o}</button>`).join('');
  document.getElementById('wh-actions').innerHTML=`<div style="font-size:12px;color:var(--gold);margin:8px 0">${prompt}</div>
    <div class="wh-choices">${opts}</div>`;
}

function whAnswer(i){
  let q=whQuestions[whTurn],correct=i===q.a;
  document.querySelectorAll('.wh-choice').forEach((b,j)=>{
    b.disabled=true;
    if(j===q.a)b.classList.add('correct');
    if(j===i&&!correct)b.classList.add('wrong');
  });
  whChat.push({who:'you',text:q.o[i]});

  // Show explanation inline before customer responds
  let acts=document.getElementById('wh-actions');
  acts.innerHTML+=`${questionHtml(q)}<div class="explain" style="margin:8px 0;font-size:13px"><span class="explain-label">${correct?'Good move':'Wrong call'}</span>${q.e}<br>${srcHtml(q.s)}</div>`;

  if(correct){
    whTrust=Math.min(100,whTrust+15);
    let set=WH_CORRECT_RESPONSES[Math.floor(Math.random()*WH_CORRECT_RESPONSES.length)];
    whChat.push({who:'cust',text:set[Math.floor(Math.random()*set.length)]});
  } else {
    whTrust=Math.max(0,whTrust-20);
    let set=WH_WRONG_RESPONSES[Math.floor(Math.random()*WH_WRONG_RESPONSES.length)];
    whChat.push({who:'cust',text:set[Math.floor(Math.random()*set.length)]});
  }
  if(correct){S.stats.qRight++;}else{S.stats.qWrong++;}
  adjustLuck(correct);
  save();
  whTurn++;

  // Add continue button instead of auto-advancing
  acts.innerHTML+=`<button class="deal-btn" style="margin-top:12px;max-width:160px" onclick="whContinueTurn()">Continue</button>`;
}

function whContinueTurn(){
  whRender();
  setTimeout(()=>whShowTurn(),500);
}

function whResolve(){
  whDone=true;
  let ts=S.stats.ts.whale;ts.p++;
  let closed=whTrust>=50;
  let mult=whTrust>=80?3:whTrust>=60?2:whTrust>=50?1:0;
  let win=closed?whBet*mult:0;
  let net=win-whBet;

  // Customer-specific closing lines
  if(closed){
    ts.w++;S.stats.won+=win;S.bankroll+=win;ts.earn=(ts.earn||0)+net;
    let closers=mult>=3?
      ["Let's do this. Send over the contract.","I'm sold. Who do I need to talk to on your end to get this moving?","You've earned our business. Let's get the paperwork started."]:
      mult>=2?
      ["I think we can work together. Let's move forward.","Good conversation. I'll bring this to our board with a recommendation.","You've given me enough to justify moving ahead."]:
      ["I'll give you a shot, but I want to see results.","Let's start small and see how it goes.","You're on probation, but I'm willing to try."];
    whChat.push({who:'cust',text:closers[Math.floor(Math.random()*closers.length)]});
  } else {
    ts.l++;S.stats.lost+=whBet;S.bankroll-=whBet;
    let rejections=["I appreciate your time, but I'm going to pass. Good luck.","I don't think this is the right fit for us.","I need someone who knows these products inside and out. Come back when you're ready."];
    whChat.push({who:'cust',text:rejections[Math.floor(Math.random()*rejections.length)]});
  }
  if(S.bankroll<25)S.bankroll=500;
  save();
  whRender();

  let cls=net>=0?'win':'lose';
  let amtStr=net>0?'+$'+win.toLocaleString():net===0?'$0':'-$'+whBet.toLocaleString();
  let title=closed?(mult>=3?'DEAL CLOSED! Big commission!':mult>=2?'DEAL CLOSED!':'DEAL CLOSED (barely)'):'DEAL LOST';

  // Show explanations for all answered questions with the question text visible
  let explains=whQuestions.slice(0,whTurn).map(q=>`${questionHtml(q)}${explainBox(q.e,q.s)}`).join('');

  document.getElementById('wh-result').innerHTML=`
    ${explains}
    <div class="result-box ${cls}"><div>${title}</div><div class="result-amt ${cls}">${amtStr}</div>
    <div style="font-size:12px;color:var(--dim);margin-top:4px">Final trust: ${whTrust}%${mult>=3?' (3x commission)':mult>=2?' (2x commission)':mult>=1?' (1x commission)':''}</div></div>
    <button class="next-btn" onclick="whStart()">Next Client</button>
    <button class="next-btn" style="background:none;border:1px solid var(--gd);color:var(--gold);margin-top:8px" onclick="showScreen('lobby')">Back to Floor</button>`;
  document.getElementById('wh-actions').innerHTML='';
}
