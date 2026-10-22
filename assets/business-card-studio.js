(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const editWarning = $('card-edit-warning') || document.createElement('p');
  const textFields = ['card-brand','card-name','card-role','card-phone','card-email','card-web','card-address','card-back-title','card-description','card-qr-url'];
  const savedFields = [...textFields,'card-font','card-scale','card-bg','card-accent','card-back-layout','card-sides','card-paper','card-quantity'];
  const themes = {classic:['#fffdf6','#315a43'],color:['#fff1e7','#874b3d'],center:['#f6f3e9','#3e586c']};
  const papers = {nouveau:{name:'누브 240g',single:9000,double:12000},linen:{name:'휘라레 216g',single:9000,double:12000},stardream:{name:'스타드림 240g',single:13000,double:16000},basic:{name:'비코팅 일반지 250g',single:8000,double:14000}};
  let theme='classic', logo=null, photo=null, valid=false, exporting=false;
  const versions={logo:0,photo:0};
  const value = id => $(id).value.trim();
  const font = () => $('card-font').value==='serif' ? '"Batang",Georgia,serif' : '"Malgun Gothic","Apple SD Gothic Neo",sans-serif';
  const contrast = hex => {const c=hex.slice(1).match(/../g).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722>.42?'#233f32':'#ffffff';};
  function price() { const kind=$('card-paper').value,side=$('card-sides').value;if($('card-quantity').value==='100'||kind==='basic')return papers[kind][side];return kind==='stardream'?(side==='double'?49000:43000):(side==='double'?31000:25000); }
  function orderBrief() {
    const side=$('card-sides').value, paper=papers[$('card-paper').value];
    return '명함 인쇄 주문 조건\n완성 규격: 90 × 50mm (가로형)\n수량: '+$('card-quantity').value+'장 (1인 동일 디자인)\n인쇄: '+(side==='double'?'양면 컬러 · PDF 1쪽 앞면 / 2쪽 뒷면':'단면 컬러 · PDF 1쪽 앞면')+'\n용지: '+paper.name+'\n후가공: 없음 · 사각 재단\n파일: PDF / 92 × 52mm / 사방 1mm 재단 여분 / 약 305dpi / CMYK 이미지\n배송: 택배\n표시 인쇄비: '+price().toLocaleString()+'원 (부가세 포함, 배송비 별도)\n업체 파일 접수·색상·교정·배송비 포함 최종 금액 확인 후 주문';
  }
  function single(ctx,text,x,y,width,size,label,align='left',min=2.1) {
    if(!text)return;
    const scale=Number($('card-scale').value)/100;
    let actual=size*scale;
    while(actual>min){ctx.font='500 '+actual+'px '+font();if(ctx.measureText(text).width<=width)break;actual-=.05;}
    ctx.font='500 '+Math.max(min,actual)+'px '+font();
    if(ctx.measureText(text).width>width+.01)throw new Error(label+'이(가) 길어 여백을 넘습니다. 짧게 수정하거나 다른 디자인을 골라주세요.');
    ctx.textAlign=align;ctx.fillText(text,x,y);
  }
  function paragraph(ctx,text,x,y,width) {
    let size=2.8*Number($('card-scale').value)/100, lines;
    for(;size>=2.19;size-=.1){
      ctx.font='400 '+size+'px '+font();lines=[];
      for(const line of text.split(/\r?\n/)){
        let row='';
        for(const ch of line){if(row&&ctx.measureText(row+ch).width>width){lines.push(row);row=ch;}else row+=ch;}
        lines.push(row);
      }
      if(lines.length<=7)break;
    }
    if(lines.length>7)throw new Error('뒷면 소개가 7줄을 넘습니다. 문구·줄바꿈을 줄이거나 소개 문구형을 선택하세요.');
    ctx.textAlign='left';ctx.font='400 '+Math.max(2.2,size)+'px '+font();
    lines.forEach((line,i)=>ctx.fillText(line,x,y+i*3.7));
  }
  function imageFit(ctx,img,x,y,w,h,cover=false) {
    if(!img)return;
    const r=(cover?Math.max:Math.min)(w/img.width,h/img.height),dw=img.width*r,dh=img.height*r;
    ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.restore();
  }
  function drawQr(ctx,x,y,size) {
    const input=value('card-qr-url');let url;
    try{url=new URL(input);}catch{throw new Error('QR로 연결할 주소를 https://로 시작해 입력하세요.');}
    if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error('QR에는 로그인 정보가 없는 http/https 주소만 넣어주세요.');
    if(url.href.length>160)throw new Error('QR 주소가 깁니다. 160자 이하의 짧은 주소를 넣어주세요.');
    if(typeof qrcode!=='function')throw new Error('QR 도구를 불러오지 못했습니다. 페이지를 다시 열어주세요.');
    const code=qrcode(0,'M');code.addData(url.href);code.make();
    const count=code.getModuleCount(),unit=Math.floor(size*12/(count+8)),actual=unit*(count+8)/12;
    if(unit<3)throw new Error('QR 주소가 너무 깁니다. 더 짧은 주소를 사용하세요.');
    const offset=(size-actual)/2;
    ctx.fillStyle='#ffffff';ctx.fillRect(x,y,size,size);ctx.fillStyle='#000000';
    for(let r=0;r<count;r++)for(let c=0;c<count;c++)if(code.isDark(r,c))ctx.fillRect(x+offset+(c+4)*unit/12,y+offset+(r+4)*unit/12,unit/12,unit/12);
    return url.href;
  }
  function paint(side,bleed=false) {
    const c=document.createElement('canvas');c.width=(bleed?92:90)*12;c.height=(bleed?52:50)*12;
    const ctx=c.getContext('2d',{willReadFrequently:true});ctx.scale(12,12);if(bleed)ctx.translate(1,1);
    const bg=$('card-bg').value,accent=$('card-accent').value;
    const backColor=side==='back'&&theme==='color'?accent:bg,ink=contrast(backColor);
    ctx.fillStyle=backColor;ctx.fillRect(-1,-1,92,52);ctx.fillStyle=ink;
    if(side==='front'){
      if(!value('card-name'))throw new Error('이름을 입력해 주세요.');
      const contacts=['card-phone','card-email','card-web','card-address'].map(value).filter(Boolean);
      if(theme==='center'){
        if(logo)imageFit(ctx,logo,38,4,14,10);
        single(ctx,value('card-brand'),45,logo?18:13,80,3.3,'상호','center');
        single(ctx,value('card-name'),45,logo?25:23,80,4.7,'이름','center');
        single(ctx,value('card-role'),45,logo?31:30,80,2.7,'직함','center');
        contacts.forEach((line,i)=>single(ctx,line,45,35+i*3.5,80,2.4,'연락처','center'));
      }else{
        if(theme==='color'){ctx.fillStyle=accent;ctx.fillRect(-1,-1,4,52);}
        ctx.fillStyle=ink;if(logo)imageFit(ctx,logo,6,5,12,10);
        single(ctx,value('card-brand'),logo?21:6,11,logo?63:78,3.4,'상호');
        single(ctx,value('card-name'),6,26,36,4.8,'이름');
        single(ctx,value('card-role'),6,33,36,2.6,'직함');
        contacts.forEach((line,i)=>single(ctx,line,47,24+i*5,37,2.5,'연락처'));
        ctx.fillStyle=accent;ctx.fillRect(6,42,30,.6);
      }
    }else{
      const layout=$('card-back-layout').value,width=layout==='text'?78:layout==='photo'?39:50;
      single(ctx,value('card-back-title'),6,12,width,4,'뒷면 제목');
      ctx.fillStyle=ink;paragraph(ctx,value('card-description'),6,20,width);
      if(layout==='photo'){
        if(photo)imageFit(ctx,photo,49,-1,42,52,true);
        else{ctx.fillStyle=accent;ctx.globalAlpha=.15;ctx.fillRect(49,-1,42,52);ctx.globalAlpha=1;ctx.fillStyle=ink;single(ctx,'내 사진을 넣어보세요',69,26,35,2.5,'사진 안내','center');}
      }
      if(layout==='qr'){drawQr(ctx,63,23,22);ctx.fillStyle=ink;single(ctx,'QR로 만나보세요',74,18,25,2.4,'QR 안내','center');}
    }
    return c;
  }
  function render() {
    valid=false;
    const basicOption=$('card-paper').querySelector('option[value="basic"]');basicOption.disabled=$('card-quantity').value!=='500';if(basicOption.disabled&&$('card-paper').value==='basic')$('card-paper').value='nouveau';
    $('card-scale-output').textContent=$('card-scale').value+'%';
    const side=$('card-sides').value,paper=papers[$('card-paper').value];
    $('card-price').textContent=$('card-quantity').value+'장 '+(side==='double'?'양면':'단면')+' 인쇄비 '+price().toLocaleString()+'원 + 배송비';
    $('card-order-brief').textContent=orderBrief();
    $('copy-card-order').textContent=$('card-quantity').value+'장 인쇄 주문 조건 복사';
    $('card-vendor-link').href='https://www.morningprint.co.kr/product/card.php?acode='+($('card-paper').value==='basic'?'18':'94');
    $('card-photo-fields').hidden=$('card-back-layout').value!=='photo';
    $('card-qr-fields').hidden=$('card-back-layout').value!=='qr';
    $('card-back-figure').hidden=side==='single';
    if($('card-back-fields')){$('card-back-fields').hidden=side==='single';$('card-back-fields').disabled=side==='single';}
    editWarning.hidden=true;
    document.querySelectorAll('.card-safe').forEach(el=>el.hidden=!$('card-guides').checked);
    try{
      for(const s of side==='double'?['front','back']:['front']){const result=paint(s);const target=$('card-'+s);target.getContext('2d').drawImage(result,0,0);target.setAttribute('aria-label','명함 '+(s==='front'?'앞면: '+value('card-name'):'뒷면: '+value('card-back-title')));}
      valid=!($('card-sides').value==='double'&&$('card-back-layout').value==='photo'&&!photo);
      let note=value('card-name')==='나의 이름'?'예시 이름을 내 이름으로 바꿔주세요.':'오탈자와 연락처를 확인한 뒤 저장하세요.';
      if($('card-back-layout').value==='photo'&&side==='double'&&!photo)note+=' 뒷면 사진을 선택하세요.';
      if((logo&&Math.min(logo.width,logo.height)<180)||(photo&&Math.min(photo.width,photo.height)<500))note+=' 사진·로고 원본이 작아 확대 인쇄 시 흐릴 수 있습니다.';
      $('card-status').textContent=note;
      if(!valid){editWarning.textContent='뒷면 사진을 넣거나 소개 문구형을 선택하면 저장할 수 있습니다.';editWarning.hidden=false;}
    }catch(error){$('card-status').textContent=error.message;editWarning.textContent=error.message;editWarning.hidden=false;}
    updateButtons();
  }
  function updateButtons(){for(const id of ['download-card-pdf','download-card-front','download-card-back'])$(id).disabled=!valid||exporting||(id==='download-card-back'&&$('card-sides').value==='single');}
  function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  const encode=text=>new TextEncoder().encode(text);
  async function makePdf(canvases) {
    const objects=[null,'<< /Type /Catalog /Pages 2 0 R >>',null],pageIds=[];
    const stream=(dict,data)=>[encode('<< '+dict+' /Length '+data.length+' >>\nstream\n'),data,encode('\nendstream')];
    const pt=mm=>(mm*72/25.4).toFixed(6),W=pt(92),H=pt(52),b=pt(1),right=pt(91),top=pt(51);
    for(const canvas of canvases){
      const rgb=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,cmyk=new Uint8Array(canvas.width*canvas.height*4);
      for(let i=0;i<rgb.length;i+=4){const r=rgb[i]/255,g=rgb[i+1]/255,bl=rgb[i+2]/255,k=1-Math.max(r,g,bl),den=1-k;cmyk[i]=den?Math.round((1-r-k)/den*255):0;cmyk[i+1]=den?Math.round((1-g-k)/den*255):0;cmyk[i+2]=den?Math.round((1-bl-k)/den*255):0;cmyk[i+3]=Math.round(k*255);}
      let data=cmyk,filter='';
      if(typeof CompressionStream==='function'){const compressed=new Blob([cmyk]).stream().pipeThrough(new CompressionStream('deflate'));data=new Uint8Array(await new Response(compressed).arrayBuffer());filter='/Filter /FlateDecode';}
      const imageId=objects.length;objects.push(stream('/Type /XObject /Subtype /Image /Width '+canvas.width+' /Height '+canvas.height+' /ColorSpace /DeviceCMYK /BitsPerComponent 8 '+filter,data));
      const contentId=objects.length;objects.push(stream('',encode('q '+W+' 0 0 '+H+' 0 0 cm /Img Do Q')));
      const pageId=objects.length;objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+W+' '+H+'] /BleedBox [0 0 '+W+' '+H+'] /TrimBox ['+b+' '+b+' '+right+' '+top+'] /Resources << /XObject << /Img '+imageId+' 0 R >> >> /Contents '+contentId+' 0 R >>');pageIds.push(pageId);
    }
    objects[2]='<< /Type /Pages /Count '+pageIds.length+' /Kids ['+pageIds.map(n=>n+' 0 R').join(' ')+'] >>';
    const parts=[encode('%PDF-1.4\n')],offsets=[0];let length=parts[0].length;
    for(let i=1;i<objects.length;i++){offsets.push(length);const objectParts=[encode(i+' 0 obj\n'),...(typeof objects[i]==='string'?[encode(objects[i])]:objects[i]),encode('\nendobj\n')];for(const part of objectParts){parts.push(part);length+=part.length;}}
    const xref=length;
    parts.push(encode('xref\n0 '+objects.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+objects.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n'));
    return new Blob(parts,{type:'application/pdf'});
  }
  $('download-card-pdf').addEventListener('click',async()=>{
    if(!valid||exporting)return;exporting=true;updateButtons();
    try{
      if($('card-sides').value==='double'&&$('card-back-layout').value==='photo'&&!photo)throw new Error('뒷면 사진을 먼저 넣거나 소개 문구형을 선택하세요.');
      const sides=$('card-sides').value==='double'?['front','back']:['front'],canvases=sides.map(s=>paint(s,true));
      const blob=await makePdf(canvases);download(blob,'AI봄-명함-90x50mm-'+(sides.length===2?'양면':'단면')+'-인쇄용.pdf');$('card-status').textContent='인쇄용 PDF 저장을 요청했습니다. 업체에서 페이지 순서·여백·색상을 확인하세요.';
    }catch(error){$('card-status').textContent=error.message||'PDF를 저장하지 못했습니다. 다시 시도해주세요.';}finally{exporting=false;updateButtons();}
  });
  for(const side of ['front','back'])$('download-card-'+side).addEventListener('click',()=>{if(!valid)return;const result=paint(side);result.toBlob(blob=>{if(blob)download(blob,'AI봄-명함-'+(side==='front'?'앞면':'뒷면')+'-시안.png');},'image/png');});
  savedFields.forEach(id=>$(id).addEventListener('input',render));$('card-guides').addEventListener('change',render);
  $('card-form').addEventListener('submit',e=>e.preventDefault());
  document.querySelectorAll('[data-card-theme]').forEach(button=>button.addEventListener('click',()=>{theme=button.dataset.cardTheme;[$('card-bg').value,$('card-accent').value]=themes[theme];document.querySelectorAll('[data-card-theme]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));render();}));
  for(const kind of ['logo','photo']){
    $('card-'+kind).addEventListener('change',async event=>{
      const file=event.target.files[0],version=++versions[kind];if(!file)return;
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){$('card-form-status').textContent='PNG·JPG·WEBP, 10MB 이하 파일을 선택하세요.';event.target.value='';return;}
      try{const bitmap=await createImageBitmap(file),c=document.createElement('canvas'),ratio=Math.min(1,2400/Math.max(bitmap.width,bitmap.height));c.width=Math.round(bitmap.width*ratio);c.height=Math.round(bitmap.height*ratio);c.getContext('2d').drawImage(bitmap,0,0,c.width,c.height);bitmap.close();if(version!==versions[kind])return;if(kind==='logo')logo=c;else photo=c;$('card-form-status').textContent=(kind==='logo'?'로고를':'뒷면 사진을')+' 넣었습니다. 미리보기에서 잘리는 부분을 확인하세요.';render();}catch{$('card-form-status').textContent='이미지를 열지 못했습니다. 다른 파일을 선택해 주세요.';}
    });
    $('remove-card-'+kind).addEventListener('click',()=>{versions[kind]++;if(kind==='logo')logo=null;else photo=null;$('card-'+kind).value='';render();});
  }
  $('save-card-draft').addEventListener('click',()=>{try{const data={theme,fields:Object.fromEntries(savedFields.map(id=>[id,$(id).value]))};localStorage.setItem('aibom.businessCard.v1',JSON.stringify(data));$('card-form-status').textContent='이 기기에 문구·디자인을 보관했습니다. 사진은 보관하지 않습니다.';}catch{$('card-form-status').textContent='보관 공간이 제한되어 있습니다. 파일을 저장해 주세요.';}});
  $('load-card-draft').addEventListener('click',()=>{try{const data=JSON.parse(localStorage.getItem('aibom.businessCard.v1'));if(!data){$('card-form-status').textContent='보관한 문구가 없습니다.';return;}for(const id of savedFields){const el=$(id),v=data.fields?.[id];if(typeof v!=='string')continue;if(el.tagName==='SELECT'&&![...el.options].some(o=>o.value===v))continue;if(el.type==='color'&&!/^#[0-9a-f]{6}$/i.test(v))continue;el.value=el.maxLength>0?v.slice(0,el.maxLength):v;}theme=themes[data.theme]?data.theme:'classic';document.querySelectorAll('[data-card-theme]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.cardTheme===theme)));$('card-form-status').textContent='문구·디자인을 열었습니다. 로고와 사진은 필요하면 다시 넣어주세요.';render();}catch{$('card-form-status').textContent='보관한 내용을 열지 못했습니다.';}});
  $('copy-card-order').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(orderBrief());$('card-copy-status').textContent='주문 조건을 복사했습니다. 업체 주문 화면에 참고하세요.';}catch{download(new Blob([orderBrief()],{type:'text/plain;charset=utf-8'}),'AI봄-명함-'+$('card-quantity').value+'장-주문조건.txt');$('card-copy-status').textContent='복사가 제한되어 주문 조건을 텍스트 파일로 저장했습니다.';}});
  render();
})();
