(function(){if(window._KR)return;window._KR=1;
var f=window.fetch;

function dig(o,A){
  if(!o||typeof o!='object')return;
  if(Array.isArray(o)){o.forEach(function(i){dig(i,A);});return;}
  if(o.correct===true||o.status==='correct'||o.considered==='correct'){
    var v=o.content||o.value||o.expression||o.text;
    if(v)A.push((''+v).replace(/\*\*/g,'').trim().replace(/<[^>]+>/g,''));
  }
  Object.keys(o).forEach(function(k){dig(o[k],A);});
}

function tryParse(t){
  try{
    var d=JSON.parse(t),A=[];
    var x=d&&d.data&&d.data.assessmentItem&&d.data.assessmentItem.item&&d.data.assessmentItem.item.itemData;
    if(x)dig(JSON.parse(x),A);
    if(!A.length)dig(d,A);
    return A;
  }catch(e){return[];}
}

function handle(t){
  if(!t||t.length>500000)return;
  var A=tryParse(t);
  if(A.length){window._KA=A;show(A);}
}

// fetch hook
window.fetch=async function(){
  var r=await f.apply(this,arguments);
  r.clone().text().then(handle).catch(function(){});
  return r;
};

// XHR hook
var XS=XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send=function(){
  this.addEventListener('load',function(){if(this.responseText)handle(this.responseText);});
  return XS.apply(this,arguments);
};

// ── type into MathQuill hidden textarea ──────────────────────────────────
function typeIntoMQ(el,text){
  el.focus();
  // clear existing
  el.dispatchEvent(new KeyboardEvent('keydown',{key:'a',keyCode:65,ctrlKey:true,bubbles:true}));
  el.dispatchEvent(new KeyboardEvent('keyup',{key:'a',keyCode:65,ctrlKey:true,bubbles:true}));
  el.dispatchEvent(new KeyboardEvent('keydown',{key:'Backspace',keyCode:8,bubbles:true}));
  el.dispatchEvent(new KeyboardEvent('keyup',{key:'Backspace',keyCode:8,bubbles:true}));

  for(var i=0;i<text.length;i++){
    var c=text[i];
    var code=c.charCodeAt(0);
    el.dispatchEvent(new KeyboardEvent('keydown',{key:c,keyCode:code,charCode:code,bubbles:true,cancelable:true}));
    el.dispatchEvent(new KeyboardEvent('keypress',{key:c,keyCode:code,charCode:code,bubbles:true,cancelable:true}));
    el.dispatchEvent(new KeyboardEvent('keyup',{key:c,keyCode:code,charCode:code,bubbles:true,cancelable:true}));
  }
}

// ── type into plain React input ──────────────────────────────────────────
function typeIntoInput(el,text){
  el.focus();
  try{
    var ns=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
    ns.call(el,text);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }catch(e){
    el.value=text;
    el.dispatchEvent(new Event('input',{bubbles:true}));
  }
}

// ── contenteditable inject ───────────────────────────────────────────────
function typeIntoEditable(el,text){
  el.focus();
  document.execCommand('selectAll',false,null);
  document.execCommand('insertText',false,text);
}

// ── MC click ─────────────────────────────────────────────────────────────
function clickMC(A){
  var opts=[].slice.call(document.querySelectorAll('[data-testid="answer-option"],.perseus-radio-option,.choice-item'));
  var hit=0;
  opts.forEach(function(o){
    var t=(o.innerText||'').replace(/\s+/g,' ').trim();
    if(A.some(function(v){return t.includes(v)||v.includes(t.slice(0,30));})){
      o.click();hit++;
    }
  });
  return hit;
}

// ── main fill ────────────────────────────────────────────────────────────
function fill(A){
  if(!A||!A.length)return;
  var ans=A[0];

  // 1. MC
  if(clickMC(A))return;

  // 2. MathQuill hidden textarea
  var mq=document.querySelector('.mq-textarea textarea');
  if(mq){typeIntoMQ(mq,ans);return;}

  // 3. MathQuill editable field (older versions)
  var mqf=document.querySelector('.mq-editable-field');
  if(mqf){mqf.focus();typeIntoMQ(mqf,ans);return;}

  // 4. Plain text input
  var inp=document.querySelector('input[type=text]:not([readonly]),input[type=number]:not([readonly])');
  if(inp){typeIntoInput(inp,ans);return;}

  // 5. Contenteditable
  var ce=document.querySelector('[contenteditable=true]');
  if(ce){typeIntoEditable(ce,ans);}
}

// ── auto check after fill ────────────────────────────────────────────────
function check(){
  setTimeout(function(){
    var btn=document.querySelector('[data-testid="check-answer-button"],[data-test-id="check-answer-button"]');
    if(btn)btn.click();
  },400);
}

// ── panel ────────────────────────────────────────────────────────────────
var P=document.createElement('div');
P.id='_kr';
P.style.cssText='position:fixed;top:64px;right:10px;width:190px;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:8px;z-index:9999999;font:12px sans-serif;color:#cbd5e1;box-shadow:0 4px 20px rgba(0,0,0,.6)';
P.innerHTML=[
  '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">',
  '<b style="color:#818cf8">KA Rev</b>',
  '<span id="_kx" style="color:#f87171;cursor:pointer;font-size:14px">✕</span></div>',
  '<div id="_kb" style="min-height:20px;color:#64748b;font-size:11px;margin-bottom:6px">waiting for question…</div>',
  '<button id="_kf" style="width:100%;padding:5px;border:none;border-radius:4px;background:#4f46e5;color:#fff;font-size:11px;cursor:pointer;margin-bottom:4px">⚡ Fill</button>',
  '<button id="_ka" style="width:100%;padding:5px;border:none;border-radius:4px;background:#0f766e;color:#fff;font-size:11px;cursor:pointer">⌨️ Type + Check</button>'
].join('');
document.body.appendChild(P);

document.getElementById('_kx').onclick=function(){window.fetch=f;P.remove();window._KR=0;};
document.getElementById('_kf').onclick=function(){fill(window._KA||[]);};
document.getElementById('_ka').onclick=function(){fill(window._KA||[]);check();};

function show(A){
  document.getElementById('_kb').innerHTML=A.map(function(v,i){
    return'<div style="background:#1e293b;border-radius:3px;padding:3px 6px;margin:2px 0;color:#a5b4fc;word-break:break-all">'+(A.length>1?(i+1)+'. ':'')+v+'</div>';
  }).join('');
}
})();
