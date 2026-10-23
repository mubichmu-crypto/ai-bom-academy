/* AI봄 이벤트 선물공방 / 2026.10.23
 * SVG vector documents, live previews, 300 dpi PNG, browser vector-PDF print.
 * No server or paid API; no user input leaves the browser.
 */
(()=>{
'use strict';
const $=(s)=>document.querySelector(s);
const presets={
 new:['새로운 출발을 축하합니다','새로운 자리에서 펼쳐질 좋은 날들을 진심으로 응원합니다.'],
 promotion:['앞날을 진심으로 축하합니다','쌓아온 노력과 성실함이 빛나는 오늘, 새로운 도약을 축하합니다.'],
 thanks:['감사의 마음을 전합니다','함께해 주신 시간과 따뜻한 배려에 깊이 감사드립니다.'],
 birthday:['생일을 축하합니다','오늘의 기쁨이 오래도록 따뜻한 기억으로 남기를 바랍니다.'],
 retire:['그동안의 노고에 감사드립니다','함께한 시간에 감사드립니다. 앞으로의 나날에도 평안과 기쁨이 가득하기를 바랍니다.']
};
const themeMap={
 classic:{name:'기품',paper:'#fffdf6',ink:'#504637',accent:'#aa9061',muted:'#8d816c',secondary:'#e9ddc2',fill:'#f7f0e2'},
 garden:{name:'정원',paper:'#fffefa',ink:'#47584a',accent:'#79947c',muted:'#849385',secondary:'#d8e2d4',fill:'#f0f4ed'},
 minimal:{name:'여백',paper:'#fffefa',ink:'#343936',accent:'#656d64',muted:'#8c938c',secondary:'#cdd3cd',fill:'#f4f5f2'}
};
const state={style:'classic',product:'certificate'};
const getForm=()=>({title:$('#title').value.trim()||'새로운 출발을 축하합니다',recipient:$('#recipient').value.trim()||'○○○ 선생님',message:$('#message').value.trim()||'마음을 전하는 축하의 글을 적어 주세요.',sender:$('#sender').value.trim()});
const E=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const header=(w,h)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}" xmlns:xlink="http://www.w3.org/1999/xlink">`;
const t=(x,y,value,size,color,extra='')=>{const units=Array.from(String(value)).reduce((n,c)=>n+(/[\x00-\x7F]/.test(c)?.62:1.08),0);size=Math.min(size,(x*2-(x<=60?24:48))/Math.max(units,1));return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="${color}" font-size="${size}" ${extra.includes('font-family=')?'':`font-family="'Noto Serif KR','Batang','Malgun Gothic',serif"`} ${extra}>${E(value)}</text>`;};
const line=(x1,y1,x2,y2,color,width=.28,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
const circle=(x,y,r,c,w=.25)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
const rect=(x,y,w,h,fill,stroke='none',sw=.3)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const rose=(x,y,scale,ink)=>{let s=`<g transform="translate(${x} ${y}) scale(${scale})" opacity=".75">`;
for(let n=0;n<5;n++){const angle=n*72;s+=`<ellipse cx="0" cy="-6" rx="2.8" ry="5.9" fill="none" stroke="${ink}" stroke-width=".53" transform="rotate(${angle})"/>`;}s+=`<circle cx="0" cy="0" r="2.4" fill="${ink}" opacity=".56"/></g>`;return s;};
function ornament(w,y,th){
 if(state.style==='classic')return `<g opacity=".88">${line(w/2-32,y,w/2-8,y,th.accent,.22)}${line(w/2+8,y,w/2+32,y,th.accent,.22)}${circle(w/2,y,5.3,th.accent,.33)}${rose(w/2,y,.47,th.accent)}${circle(w/2-35,y,.7,th.accent,.6)}${circle(w/2+35,y,.7,th.accent,.6)}</g>`;
 if(state.style==='garden')return `<g>${rose(w/2,y,.9,th.accent)}<path d="M ${w/2-8} ${y+1} Q ${w/2-30} ${y-10} ${w/2-35} ${y-1} M ${w/2+8} ${y+1} Q ${w/2+30} ${y-10} ${w/2+35} ${y-1}" stroke="${th.accent}" stroke-width=".45" fill="none"/><ellipse cx="${w/2-24}" cy="${y-5}" rx="5" ry="1.7" transform="rotate(-28 ${w/2-24} ${y-5})" fill="${th.secondary}"/><ellipse cx="${w/2+24}" cy="${y-5}" rx="5" ry="1.7" transform="rotate(28 ${w/2+24} ${y-5})" fill="${th.secondary}"/></g>`;
 return line(w/2-12,y,w/2+12,y,th.accent,.37);
}
// Wrap at character boundaries, keeping short phrases together where possible.
function wrap(text,maxUnits,maxLines){
 const chunks=String(text).replace(/\r/g,'').split(/(\n|[^\S\n]+)/);
 const result=[];let current='',width=0;
 const measure=t=>Array.from(t).reduce((acc,c)=>acc+(/[\x00-\x7F]/.test(c)?.53:1),0);
 const flush=()=>{if(current.trim())result.push(current.trim());current='';width=0;};
 for(const chunk of chunks){
  if(!chunk)continue;
  if(chunk.includes('\n')){flush();continue;}
  if(!chunk.trim()){if(current&&!current.endsWith(' ')){current+=' ';width+=.53;}continue;}
  const len=measure(chunk);
  if(current.trim()&&width+len>maxUnits)flush();
  if(len>maxUnits){for(const ch of Array.from(chunk)){const n=measure(ch);if(width+n>maxUnits&&current)flush();current+=ch;width+=n;}}else{current+=chunk;width+=len;}
 }
 flush();
 if(result.length>maxLines){const merged=result.slice(0,maxLines-1);merged.push(result.slice(maxLines-1).join(' '));return merged;}
 return result.length?result:[''];
}
function textGroup(w,y,body,th,fontSize,maxUnits,maxLines,spacing=8.5){const lines=wrap(body,maxUnits,maxLines);const height=(lines.length-1)*spacing;return lines.map((str,i)=>{
 const len=Array.from(str).reduce((a,c)=>a+(/[\x00-\x7F]/.test(c)?.53:1),0);const font=len>maxUnits?fontSize*Math.max(.76,maxUnits/len):fontSize;
 return t(w/2,y+i*spacing-height/2,str,font,th.ink);
}).join('');}
function certificate(form){const w=210,h=297,th=themeMap[state.style];let s=header(w,h)+rect(0,0,w,h,th.paper);
 if(state.style==='classic'){
 s+=rect(12,12,186,273,'none',th.accent,.36)+rect(15,15,180,267,'none',th.secondary,.4);
 for(const x of [12,198])for(const y of [12,285])s+=circle(x,y,2.3,th.accent,.5);
 s+=`<path d="M 21 32 Q 32 20 46 24 M 189 32 Q 178 20 164 24 M 21 265 Q 34 276 46 272 M 189 265 Q 176 276 164 272" fill="none" stroke="${th.accent}" opacity=".42" stroke-width=".5"/>`;
 }else if(state.style==='garden'){
 s+=`<path d="M 0 0 H210 V40 Q135 20 105 42 Q40 63 0 29 Z" fill="${th.fill}"/>`;
 s+=`<path d="M 14 20 C 48 35 57 56 72 80 M 196 20 C 162 35 153 56 138 80" stroke="${th.accent}" stroke-width=".55" fill="none" opacity=".6"/>`;
 for(const a of [[25,34],[38,47],[55,58],[184,34],[171,47],[154,58]])s+=rose(a[0],a[1],.65,th.accent);
 s+=line(24,264,186,264,th.secondary,.35);
 }else{
 s+=rect(0,0,210,8,th.ink);s+=line(26,45,184,45,th.secondary,.5)+line(26,254,184,254,th.secondary,.5);
 s+=line(26,47,26,60,th.accent,.45)+line(184,47,184,60,th.accent,.45);
 }
 const micro=state.style==='minimal'?'A PERSONAL NOTE':'A NOTE OF CONGRATULATIONS';
 s+=t(w/2,57,micro,3.05,th.muted,'letter-spacing="1.3" font-family="Georgia,serif"');
 s+=ornament(w,79,th);
 const titleLines=wrap(form.title,13,2);const y0=111-(titleLines.length-1)*7;
 titleLines.forEach((v,i)=>{const len=Array.from(v).length; s+=t(w/2,y0+i*14,v,len>13?7.5:9,th.ink,'font-weight="600"');});
 s+=t(w/2,148,form.recipient,6.25,th.ink,'font-weight="500"');
 s+=line(68,163,142,163,th.secondary,.5);
 s+=textGroup(w,190,form.message,th,4.45,24,4,9);
 s+=ornament(w,226,th);
 if(form.sender)s+=t(w/2,248,form.sender,4.45,th.muted);
 s+=t(w/2,266,'마음을 담아',3.1,th.muted,'letter-spacing=".8"');
 return {svg:s+'</svg>',w,h,filename:'AI봄_축하장_A4'};
}
function postcard(form){const w=104,h=154,th=themeMap[state.style];let s=header(w,h)+rect(0,0,w,h,th.paper);
 if(state.style==='classic'){
 s+=rect(8,8,88,138,'none',th.accent,.28)+rect(10.3,10.3,83.4,133.4,'none',th.secondary,.29);
 s+=circle(52,33,9.4,th.accent,.3)+rose(52,33,.72,th.accent);
 }else if(state.style==='garden'){
 s+=`<path d="M0 0 H104 V37 Q80 23 52 36 Q25 50 0 30 Z" fill="${th.fill}"/>`;
 s+=rose(52,30,.95,th.accent)+rose(39,37,.45,th.accent)+rose(65,37,.45,th.accent);
 }else{
 s+=rect(0,0,w,4,th.ink)+line(15,30,89,30,th.secondary,.4)+line(15,129,89,129,th.secondary,.4);
 }
 s+=t(52,state.style==='classic'?51:48,'WITH WARM WISHES',2.7,th.muted,'letter-spacing=".7" font-family="Georgia,serif"');
 const ti=wrap(form.title,10,2),origin=70-6*(ti.length-1);ti.forEach((v,i)=>s+=t(52,origin+i*10,v,5.7,th.ink,'font-weight="600"'));
 s+=t(52,91,form.recipient,3.9,th.ink);
 s+=line(27,101,77,101,th.secondary,.4);
 s+=textGroup(104,115,form.message,th,3.0,21,3,5.7);
 if(form.sender)s+=t(52,136,form.sender,2.8,th.muted);
 // 2mm bleed on all four sides, trimmed finished size 100 x 150mm.
 return {svg:s+'</svg>',w,h,filename:'AI봄_축하카드_100x150_도련2mm'};
}
function envelope(form){const w=210,h=297,th=themeMap[state.style];let s=header(w,h)+rect(0,0,w,h,'#ffffff');
 // Net: 170 x 85 finished, 6mm side glue tabs, 35mm closing flap.
 // MAIN FRONT: x20..190, y79..164, BACK: x20..190 y164..249;
 // CLOSURE FLAP: y43..79; side tabs: x14..20 / 190..196 on back.
 const silhouette='M 30 43 Q 105 23 180 43 L 190 79 L 190 164 L 196 174 L 196 239 L 190 249 L 20 249 L 14 239 L 14 174 L 20 164 L 20 79 Z';
 s+=`<path d="${silhouette}" fill="${th.paper}" stroke="#474f49" stroke-width=".36" stroke-linejoin="round"/>`;
 s+=`<path d="M 20 79 H190 M 20 164 H190 M20 174 V239 M190 174 V239" fill="none" stroke="#5e8a83" stroke-width=".33" stroke-dasharray="2,1.5"/>`;
 // Flap is unprinted except decorative wash; front decorated with generous safe area.
 s+=`<path d="M32 43 Q105 27 178 43 L183 57 Q105 45 27 57 Z" fill="${th.fill}" opacity=".65"/>`;
 if(state.style==='classic'){
 s+=rect(33,91,144,61,'none',th.accent,.29)+line(45,147,165,147,th.secondary,.3)+ornament(210,109,th);
 }else if(state.style==='garden'){
 s+=`<path d="M20 79 Q105 92 190 79 V104 Q105 91 20 104 Z" fill="${th.fill}"/>`;
 s+=rose(105,100,.66,th.accent);
 }else{
 s+=line(43,99,167,99,th.accent,.55);
 }
 const envelopeTitle=wrap(form.title,25,2);envelopeTitle.forEach((v,i)=>s+=t(105,117+i*7,v,4.4,th.ink));
 s+=t(105,134,form.recipient,3.5,th.muted);
 s+=textGroup(210,145,form.message,th,2.55,48,3,3.8);
 if(form.sender)s+=t(105,158,form.sender,2.6,th.muted);
 // Geometry annotations outside the cutline, never part of the finished envelope.
 s+=t(105,15,'현금봉투 만들기 · 완성 크기 170 × 85mm',4.1,'#4f5850','font-family="Malgun Gothic,sans-serif"');
 s+=`<rect x="17" y="261" width="176" height="24" rx="2" fill="#f5f7f4"/>`;
 s+=`<text x="23" y="269" fill="#59665d" font-family="Malgun Gothic,sans-serif" font-size="3.5">진한 실선 : 오리기   /   청록 점선 : 접기   /   양옆 6mm 날개 : 풀칠</text>`;
 s+=`<text x="23" y="276" fill="#59665d" font-family="Malgun Gothic,sans-serif" font-size="3.2">A4 100% 출력 · 실제 지폐(154×68mm)를 넣기 전 실물 접기 시험을 하세요.</text>`;
 return {svg:s+'</svg>',w,h,filename:'AI봄_5만원권_현금봉투_A4_접기도안'};
}
function makeDocument(){let form=getForm();if(state.product==='certificate')return certificate(form);if(state.product==='card')return postcard(form);return envelope(form);}
function preview(){const d=makeDocument();$('#preview-paper').innerHTML=d.svg;
 const productName={certificate:'A4 축하장',card:'카드 100×150mm',envelope:'현금봉투 170×85mm'}[state.product];
 $('#preview-meta').textContent=productName;$('#preview-caption').textContent=productName+' · '+themeMap[state.style].name+' 디자인';
 const dim={certificate:['A4 / 210 × 297mm','여백이 있는 가정·사무실 출력용 축하장'],card:['카드 / 완성 100 × 150mm','PDF·PNG 작업 크기 104×154mm (사방 2mm 도련 포함)'],envelope:['A4 접기도안 / 완성 봉투 170 × 85mm','실선 재단 · 점선 접기 · 6mm 측면 접착날개 (실물 검증 전 시제품)']}[state.product];
 $('#dimensions').innerHTML='<strong>'+dim[0]+'</strong><p>'+dim[1]+'</p>';
 $('#print-guidance').innerHTML=state.product==='envelope'?'<strong>봉투 제작 시 주의</strong><p>일반 A4 용지에 100% 배율로 인쇄하고, 실선을 따라 오린 뒤 접는 선을 따라 접어보세요. 5만 원권 실물을 넣어 여유 공간·접착 면적을 시험해야 합니다. 인쇄업체 봉투 주문용 칼선은 아닙니다.</p>':'<strong>인쇄 품질을 위한 안내</strong><p>PDF 저장 시 배율 100%, 여백 없음, 머리글·바닥글 끄기를 선택하세요. 카드의 실제 완성 크기는 100×150mm이며 작업 파일은 도련 포함 104×154mm입니다. 인쇄업체가 요구하는 규격을 먼저 확인하세요.</p>';
}
function setStatus(text){$('#action-status').textContent=text;}
function chooseStyle(style){state.style=style;document.querySelectorAll('[data-style]').forEach(el=>{let on=el.dataset.style===style;el.classList.toggle('is-selected',on);el.setAttribute('aria-pressed',String(on));});preview();}
function chooseProduct(product){state.product=product;document.querySelectorAll('[data-product]').forEach(el=>{let on=el.dataset.product===product;el.classList.toggle('is-selected',on);el.setAttribute('aria-pressed',String(on));});preview();}
function download(blob,filename){let url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),45000);}
function validateDesign(){if(!$('#recipient').value.trim()||$('#recipient').value.includes('○○○')){setStatus('인쇄하기 전에 받는 분의 이름을 입력해 주세요.');$('#recipient').focus();return false;}return true;}
function openPrint(){if(!validateDesign())return;const d=makeDocument();
 // This is a genuine vector PDF route: the browser prints scalable SVG and text with
 // physical @page dimensions; it does not make a PDF from a screen capture.
 const page=window.open('','_blank');if(!page){setStatus('새 창이 차단됐습니다. 팝업을 허용한 뒤 다시 눌러 주세요.');return;}
 const printHtml='<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>'+d.filename+'</title><style>@page{size:'+d.w+'mm '+d.h+'mm;margin:0}html,body{margin:0;padding:0;width:'+d.w+'mm;height:'+d.h+'mm;overflow:hidden}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}svg{display:block;width:'+d.w+'mm;height:'+d.h+'mm}</style></head><body>'+d.svg+'<script>window.addEventListener("load",()=>{let f=document.fonts?document.fonts.ready:Promise.resolve();f.then(()=>setTimeout(()=>window.print(),250));});<\/script></body></html>';
 page.document.open();page.document.write(printHtml);page.document.close();
 setStatus('인쇄 창에서 대상을 ‘PDF로 저장’으로, 배율을 100%, 여백을 없음으로 선택해 주세요.');
}
async function pngWith300dpi(blob){
 const bytes=new Uint8Array(await blob.arrayBuffer()),parts=[bytes.slice(0,8)];
 const chunk=new Uint8Array(21),dv=new DataView(chunk.buffer);dv.setUint32(0,9);chunk.set([112,72,89,115],4);dv.setUint32(8,11811);dv.setUint32(12,11811);chunk[16]=1;
 let crc=0xffffffff;for(const b of chunk.slice(4,17)){crc^=b;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}dv.setUint32(17,(crc^0xffffffff)>>>0);
 for(let pos=8;pos<bytes.length;){const n=new DataView(bytes.buffer,bytes.byteOffset+pos,4).getUint32(0),end=pos+12+n;const type=String.fromCharCode(...bytes.slice(pos+4,pos+8));if(type!=='pHYs')parts.push(bytes.slice(pos,end));if(type==='IHDR')parts.push(chunk);pos=end;}
 return new Blob(parts,{type:'image/png'});
}
async function exportPNG(){if(!validateDesign())return;const d=makeDocument();const pixel=300/25.4;const W=Math.round(d.w*pixel),H=Math.round(d.h*pixel);const can=document.createElement('canvas');can.width=W;can.height=H;const c=can.getContext('2d');if(!c){setStatus('이 브라우저에서 PNG를 만들 수 없습니다.');return;}
 const img=new Image();const url=URL.createObjectURL(new Blob([d.svg],{type:'image/svg+xml;charset=utf-8'}));
 try{if(document.fonts)await document.fonts.ready;await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});c.fillStyle='#fff';c.fillRect(0,0,W,H);c.drawImage(img,0,0,W,H);
 const blob=await new Promise((resolve,reject)=>can.toBlob(b=>b?resolve(b):reject(new Error('Canvas export failed')),'image/png'));download(await pngWith300dpi(blob),d.filename+'_300dpi.png');
 setStatus('300dpi PNG를 저장했습니다. 인쇄 주문 전 문구와 인쇄 크기를 확인해 주세요.');
 }catch(e){setStatus('PNG 저장에 실패했습니다. Chrome 또는 Edge에서 다시 시도해 주세요.');}finally{URL.revokeObjectURL(url);}
}
function updateRibbon(){let v=E($('#ribbon-left').value.trim());$('#ribbon-view-left').innerHTML=v||'축하의 마음';v=E($('#ribbon-right').value.trim());$('#ribbon-view-right').innerHTML=v||'마음을 담아';}
function copyRibbon(){const text=$('#ribbon-left').value.trim()+'\n'+$('#ribbon-right').value.trim();if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(()=>{setStatus('리본 문구를 복사했어요.');$('#copy-ribbon').textContent='복사했어요 ✓';setTimeout(()=>$('#copy-ribbon').textContent='리본 문구 복사하기',1600);}).catch(()=>legacyCopy(text));}else legacyCopy(text);}
function legacyCopy(text){const x=document.createElement('textarea');x.value=text;document.body.append(x);x.select();const success=document.execCommand('copy');x.remove();$('#copy-ribbon').textContent=success?'복사했어요 ✓':'복사가 지원되지 않아요';setTimeout(()=>$('#copy-ribbon').textContent='리본 문구 복사하기',1600);}
for(const btn of document.querySelectorAll('[data-style]'))btn.addEventListener('click',()=>chooseStyle(btn.dataset.style));
for(const btn of document.querySelectorAll('[data-product]'))btn.addEventListener('click',()=>chooseProduct(btn.dataset.product));
for(const id of ['title','recipient','message','sender'])$('#'+id).addEventListener('input',preview);
$('#occasion').addEventListener('change',e=>{if(!presets[e.target.value])return;$('#title').value=presets[e.target.value][0];$('#message').value=presets[e.target.value][1];preview();});
$('#download-pdf').addEventListener('click',openPrint);$('#download-png').addEventListener('click',exportPNG);
$('#ribbon-theme').addEventListener('change',e=>{let options={start:['새로운 시작을 응원합니다','마음을 담아 드립니다'],thanks:['함께해 주셔서 감사합니다','고마운 마음을 전합니다'],congrats:['기쁜 날을 축하합니다','좋은 날들이 이어지기를']};let a=options[e.target.value];$('#ribbon-left').value=a[0];$('#ribbon-right').value=a[1];updateRibbon();});
$('#ribbon-left').addEventListener('input',updateRibbon);$('#ribbon-right').addEventListener('input',updateRibbon);
$('#copy-ribbon').addEventListener('click',copyRibbon);
preview();updateRibbon();
})();
