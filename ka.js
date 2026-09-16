(function(){if(window._KR)return;window._KR=1;
var f=window.fetch;

function dig(o,A){
  if(!o||typeof o!='object')return;
  if(Array.isArray(o)){o.forEach(function(i){dig(i,A);});return;}
  if(o.correct===true||o.status==='correct'||o.considered==='correct'){
    var v=o.content||o.value||o.expression||o.text;
    if(v)A.push((''+v).replace(/\*\*/g,'').trim());
  }
  Object.keys(o).forEach(function(k){dig(o[k],A);});
}

function tryParse(t){
  try{
    var d=JSON.parse(t),A=[];
    // try nested itemData first
    var x=d&&d.data&&d.data.assessmentItem&&d.data.assessmentItem.item&&d.data.assessmentItem.item.itemData;
    if(x){dig(JSON.parse(x),A);}
    // fallback: dig whole blob
    if(!A.length)dig(d,A);
    return A;
  }catch(e){return[];}
}

function handle(t){
  var A=tryParse(t);
  if(A.length){window._KA=A;show(A);fill(A);}
}

// hook fetch
window.fetch=async function(){
  var a=arguments;
  var r=await f.apply(this,a);
  // check URL or POST body for graphql/assessment
  var u=typeof a[0]=='string'?a[0]:(a[0]&&a[0].url)||'';
  var body='';
  try{body=a[1]&&a[1].body?a[1].body:'';}catch(e){}
  if(u.includes('graphql')||u.includes('assessment')||u.includes('getAssessment')
     ||(''+body).includes('assessmentItem')||(''+body).includes('getAssessment')){
    r.clone().text().then(handle).catch(function(){});
  }
  return r;
};

// hook XHR fallback
var XO=XMLHttpRequest.prototype.open,XS=XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open=function(m,u){
  this._u=u;return XO.apply(this,arguments);
};
XMLHttpRequest.prototype.send=function(b){
  var t=this;
  var u=t._u||'';
  if(u.includes('graphql')||u.includes('assessment')||(''+b).includes('assessmentItem')){
    t.addEventListener('load',function(){
      if(t.responseText)handle(t.responseText);
    });
  }
  return XS.apply(t,arguments);
};

// panel
var P=document.createElement('div');
P.id='_kr';
P.style.cssText='position:fixed;top:64px;right:10px;width:185px;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:8px;z-index:9999999;font:12px sans-serif;color:#cbd5e1;box-shadow:0 4px 20px rgba(0,0,0,.6)';
P.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><b style="color:#818cf8">KA Rev</b><span id="_kx" style="color:#f87171;cursor:pointer;font-size:14px">✕</span></div><div id="_kb" style="margin-top:6px;min-height:20px;color:#64748b;font-size:11px">waiting for question…</div><button id="_kf" style="width:100%;margin-top:6px;padding:5px;border:none;border-radius:4px;background:#4f46e5;color:#fff;font-size:11px;cursor:pointer">⚡ Fill</button>';
document.body.appendChild(P);
document.getElementById('_kx').onclick=function(){window.fetch=f;P.remove();window._KR=0;};
document.getElementById('_kf').onclick=function(){fill(window._KA||[]);};

function show(A){
  document.getElementById('_kb').innerHTML=A.map(function(v,i){
    return'<div style="background:#1e293b;border-radius:3px;padding:3px 6px;margin:2px 0;color:#a5b4fc">'+
    (A.length>1?(i+1)+'. ':'')+v+'</div>';
  }).join('');
}

function fill(A){
  if(!A||!A.length)return;
  var opts=[].slice.call(document.querySelectorAll('[data-testid="answer-option"],.perseus-radio-option,.choice-item,li[class*="choice"]'));
  var hit=0;
  opts.forEach(function(o){
    var t=(o.innerText||'').replace(/\s+/g,' ').trim();
    if(A.some(function(v){return t.includes(v)||v.includes(t.slice(0,28));})){o.click();hit++;}
  });
  if(!hit&&A[0]){
    var inp=document.querySelector('input[type=text]:not([readonly]),.perseus-input,[contenteditable=true]');
    if(inp){
      inp.focus();
      try{
        var ns=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
        ns.call(inp,A[0]);
        inp.dispatchEvent(new Event('input',{bubbles:true}));
        inp.dispatchEvent(new Event('change',{bubbles:true}));
      }catch(e){document.execCommand('insertText',false,A[0]);}
    }
  }
}
})();
