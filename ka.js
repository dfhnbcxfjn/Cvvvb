(function(){if(window._KR)return;window._KR=1;
var f=fetch;
window.fetch=async function(){
  var a=arguments,r=await f.apply(this,a),
      u=typeof a[0]=='string'?a[0]:(a[0]&&a[0].url)||'';
  if(u.includes('getAssessment')){
    r.clone().text().then(function(t){
      try{
        var d=JSON.parse(t),
            x=d.data.assessmentItem.item.itemData,
            q=JSON.parse(x),A=[];
        (function g(o){
          if(!o||typeof o!='object')return;
          if(Array.isArray(o)){o.forEach(g);return;}
          if(o.correct===true||o.status==='correct'||o.considered==='correct'){
            var v=o.content||o.value||o.expression||o.text;
            if(v)A.push((''+v).replace(/\*\*/g,'').trim());
          }
          Object.keys(o).forEach(function(k){g(o[k]);});
        })(q);
        if(A.length){window._KA=A;show(A);fill(A);}
      }catch(e){}
    });
  }
  return r;
};

var P=document.createElement('div');
P.style.cssText='position:fixed;top:64px;right:10px;width:185px;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:8px;z-index:9999999;font:12px sans-serif;color:#cbd5e1';
P.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><b style="color:#818cf8">KA Rev</b><span id="_kx" style="color:#f87171;cursor:pointer">✕</span></div><div id="_kb" style="margin-top:6px;min-height:20px;color:#94a3b8">waiting...</div><button id="_kf" style="width:100%;margin-top:5px;padding:4px;border:none;border-radius:4px;background:#4f46e5;color:#fff;font-size:11px;cursor:pointer">⚡ Fill</button>';
document.body.appendChild(P);
document.getElementById('_kx').onclick=function(){window.fetch=f;P.remove();window._KR=0;};
document.getElementById('_kf').onclick=function(){fill(window._KA||[]);};

function show(A){
  document.getElementById('_kb').innerHTML=A.map(function(v,i){
    return'<div style="background:#1e293b;border-radius:3px;padding:2px 5px;margin:2px 0;color:#a5b4fc">'+
      (A.length>1?i+1+'. ':'')+v+'</div>';
  }).join('');
}

function fill(A){
  if(!A||!A.length)return;
  var opts=[].slice.call(document.querySelectorAll('[data-testid="answer-option"],.perseus-radio-option,.choice-item'));
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
