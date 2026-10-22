(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const editWarning = $('banner-edit-warning') || document.createElement('p');
  const fields = ['banner-kicker', 'banner-title', 'banner-detail', 'banner-host'];
  const examples = {
    seollal: ['따뜻한 마음을 나누는 설날', '새해 복 많이 받으세요', '건강하고 행복한 명절 보내세요', ''],
    chuseok: ['마음까지 풍성한 한가위', '행복한 추석 보내세요', '가족과 함께 따뜻한 시간 되세요', ''],
    newyear: ['새로운 시작을 함께합니다', '희망찬 새해를 응원합니다', '건강과 행복이 가득한 한 해 되세요', ''],
    notice: ['입주민 여러분께 안내드립니다', '단지 내 정기 소독 안내', '일시와 대상 구역을 확인해 주세요.', '관리사무소'],
    community: ['함께해서 더 따뜻한 우리 마을', '가을맞이 주민 한마음 행사', '', ''],
    birthday: ['함께한 날들에 감사와 사랑을 담아', '팔순을 진심으로 축하드립니다', '', '사랑하는 가족 일동'],
    opening: ['새로운 시작, 힘찬 내일을 응원합니다', '개업을 진심으로 축하합니다', '', ''],
    thanks: ['당신의 따뜻한 발자취를 기억합니다', '그동안의 헌신에 감사드립니다', '', ''],
    learning: ['함께 배우고, 함께 만들어가는 시간', '우리 동네 AI 배움 모임', '', ''],
    celebration: ['기쁜 순간을 함께 나눕니다', '오늘의 주인공을 축하합니다', '', '']
  };
  const themes = {
    spring: { bg: '#edf3e2', fg: '#285640', soft: '#8aa875', accent: '#d6b26c', name: '주민 행사형' },
    coral: { bg: '#fff0e7', fg: '#793c35', soft: '#de9e83', accent: '#e8bb70', name: '축하·감사형' },
    navy: { bg: '#203b4b', fg: '#f9edce', soft: '#64868c', accent: '#d6b46c', name: '공지·안내형' }
  };
  let theme = 'spring', photo = '', svgSource = '', renderId = 0, ready = false, photoVersion = 0;
  const canvas = $('banner-canvas');
  const ctx = canvas.getContext('2d');
  const fontFamily = () => $('banner-font').value === 'serif' ? 'Batang, Georgia, serif' : 'Malgun Gothic, Apple SD Gothic Neo, sans-serif';
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function values() { return fields.map(id => $(id).value.trim()); }
  function dimensions() {
    if ($('banner-size').value !== 'custom') return $('banner-size').value.split(',').map(Number);
    return [Number($('width-cm').value), Number($('height-cm').value)];
  }
  function fit(text, width, maxSize, minSize, maxLines) {
    const paragraphs = text.split(/\r?\n/).slice(0, maxLines);
    let lines = [], size = maxSize;
    for (; size >= minSize; size -= 2) {
      ctx.font = `700 ${size}px ${fontFamily()}`;
      lines = [];
      for (const paragraph of paragraphs) {
        let current = '';
        for (const char of Array.from(paragraph)) {
          if (current && ctx.measureText(current + char).width > width) { lines.push(current); current = char; }
          else current += char;
        }
        lines.push(current);
      }
      if (lines.length <= maxLines) return {lines, size};
    }
    return {lines: lines.slice(0, maxLines).map((line, i) => i === maxLines - 1 ? line.slice(0, -1) + '…' : line), size: minSize, truncated: true};
  }
  function textSvg(text, x, y, size, color, weight = 500, anchor = 'middle') {
    return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${esc(text)}</text>`;
  }
  function buildSvg() {
    const [w, h] = dimensions();
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 50 || w > 1000 || h < 30 || h > 300 || w / h < 1.5 || w / h > 10) {
      throw new Error('가로형 규격을 확인해 주세요. 가로 50~1000cm, 세로 30~300cm, 가로:세로 비율 1.5~10 범위에서 만들 수 있습니다.');
    }
    const W = 2400, H = W * h / w, t = {...themes[theme], bg: $('banner-background').value};
    const [kicker, title, detail, host] = values();
    if (!title) throw new Error('가장 크게 전할 말을 적어 주세요.');
    const photoWidth = photo ? Math.min(W * .23, H * .95) : 0;
    const left = W * .07, right = photo ? W - photoWidth - W * .075 : W * .93;
    const center = (left + right) / 2, textWidth = right - left;
    const textX = theme === 'navy' ? left : center, anchor = theme === 'navy' ? 'start' : 'middle';
    const titleFit = fit(title, textWidth, Math.min(H * .17, 150) * Number($('font-scale').value) / 100, 32, 2);
    const kickerFit = fit(kicker, textWidth, Math.min(H * .07, 59), 22, 1);
    const detailFit = fit(detail, textWidth, Math.min(H * .065, 52), 20, 1);
    const hostFit = fit(host, textWidth, Math.min(H * .06, 47), 20, 1);
    const mid = H * .49, lineHeight = titleFit.size * 1.22;
    const titleStart = mid - ((titleFit.lines.length - 1) * lineHeight) / 2 + titleFit.size * .32;
    let elements = `<rect width="${W}" height="${H}" fill="${t.bg}"/><rect x="${W*.018}" y="${H*.065}" width="${W*.964}" height="${H*.87}" rx="${H*.025}" fill="none" stroke="${t.accent}" stroke-width="3"/>`;
    if (theme === 'navy') {
      elements += `<rect x="${left}" y="${H*.28}" width="${textWidth}" height="4" fill="${t.accent}"/><rect x="${left}" y="${H*.665}" width="${textWidth}" height="2" fill="${t.soft}"/>`;
    } else if (theme === 'coral') {
      for (const x of [W*.045,W*.96]) for (let i=0;i<5;i++) elements += `<circle cx="${x+Math.cos(i*1.256)*H*.055}" cy="${H*.5+Math.sin(i*1.256)*H*.055}" r="${H*.04}" fill="${t.soft}" opacity=".24"/>`;
      elements += `<path d="M ${center-90} ${H*.29} Q ${center} ${H*.24} ${center+90} ${H*.29}" fill="none" stroke="${t.accent}" stroke-width="4"/>`;
    } else {
      elements += `<circle cx="${W*.015}" cy="${H*.15}" r="${H*.22}" fill="${t.soft}" opacity=".15"/><circle cx="${W*.98}" cy="${H*.92}" r="${H*.29}" fill="${t.accent}" opacity=".14"/>`;
      for (let i=0;i<3;i++) elements += `<ellipse cx="${W*.045+i*13}" cy="${H*.73-i*H*.07}" rx="${H*.025}" ry="${H*.06}" fill="${t.soft}" opacity=".42" transform="rotate(-35 ${W*.045+i*13} ${H*.73-i*H*.07})"/>`;
    }
    elements += textSvg(kickerFit.lines[0] || '', textX, H*.22, kickerFit.size, t.fg,500,anchor);
    titleFit.lines.forEach((line, i) => { elements += textSvg(line, textX, titleStart + i*lineHeight, titleFit.size, t.fg, 750,anchor); });
    elements += textSvg(detailFit.lines[0] || '', textX, H*.76, detailFit.size, t.fg,500,anchor);
    elements += textSvg(hostFit.lines[0] || '', textX, H*.87, hostFit.size, t.fg,500,anchor);
    if (photo) {
      const x = W - photoWidth - W*.055, y = H*.13, ph = H*.74;
      elements += `<defs><clipPath id="photo-clip"><rect x="${x}" y="${y}" width="${photoWidth}" height="${ph}" rx="${H*.025}"/></clipPath></defs><image href="${photo}" x="${x}" y="${y}" width="${photoWidth}" height="${ph}" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo-clip)"/>`;
    }
    const truncated = [titleFit,kickerFit,detailFit,hostFit].some(v => v.truncated) || title.split(/\r?\n/).length > 2;
    return {source: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}cm" height="${h}cm" viewBox="0 0 ${W} ${H}"><title>${esc(title)}</title><g font-family="${fontFamily()}">${elements}</g></svg>`, W, H, w, h, truncated};
  }
  async function render() {
    $('font-scale-value').textContent = $('font-scale').value + '%';
    $('print-conditions').textContent = orderConditions();
    const id = ++renderId;
    ready = false;
    editWarning.hidden=true;
    for (const button of [$('download-banner-png'),$('download-banner-svg')]) button.disabled=true;
    try {
      const data = buildSvg();
      const url = URL.createObjectURL(new Blob([data.source], {type:'image/svg+xml;charset=utf-8'}));
      const img = new Image();
      img.width = data.W; img.height = data.H;
      try { await new Promise((resolve,reject) => {img.onload=resolve;img.onerror=reject;img.src=url;}); }
      finally { URL.revokeObjectURL(url); }
      if (id !== renderId) return;
      canvas.width = data.W; canvas.height = Math.round(data.H);
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      svgSource = data.source; ready = !data.truncated;
      canvas.setAttribute('aria-label', `현수막 미리보기: ${$('banner-title').value}, ${themes[theme].name}`);
      $('banner-dimensions').textContent = `${data.w} × ${data.h} cm 비율 · 가로 ${data.W.toLocaleString()}px`;
      $('banner-status').textContent = data.truncated ? '문구가 잘려 저장을 잠시 막았습니다. 문구나 줄바꿈을 줄이면 다시 저장할 수 있습니다.' : '미리보기를 확인한 뒤 저장하세요. 날짜·장소·이름은 한 번 더 확인해 주세요.';
    } catch (error) { if(id === renderId) $('banner-status').textContent = error.message || '미리보기를 만들지 못했습니다. 다시 시도해 주세요.'; }
    if(id!==renderId)return;
    if(!ready){editWarning.textContent=$('banner-status').textContent;editWarning.hidden=false;}
    for (const button of [$('download-banner-png'),$('download-banner-svg')]) button.disabled = !ready;
  }
  function download(blob, name) { const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000); }
  function orderConditions() { const [w,h]=dimensions(); return `현수막 인쇄 주문\n규격: ${w} × ${h}cm\n수량: 1장\n마감: 양쪽 막대 끼우기\n부자재: 설치용 끈 포함\n금속링(아일렛): 불필요\n배송: 택배\n업체별 마감 가능 여부·파일 접수 규격·최종 가격은 주문 전 확인`; }
  $('copy-print-conditions').addEventListener('click',()=>copy(orderConditions(),'print-copy-status'));
  ['banner-font','font-scale','banner-background'].forEach(id=>$(id).addEventListener('input',render));
  function brief() { const [w,h] = dimensions(); return `현수막 디자인 문의\n규격: ${w} × ${h} cm\n분위기: ${themes[theme].name}\n\n${values().filter(Boolean).join('\n')}\n\n사진 사용: ${photo ? '있음 (문의할 때 별도 전달)' : '없음'}\n희망일:\n추가 요청:`; }
  async function copy(text, status) { try {await navigator.clipboard.writeText(text);$(status).textContent='복사했습니다.';} catch {download(new Blob([text],{type:'text/plain;charset=utf-8'}),'AI봄-현수막-문구.txt');$(status).textContent='복사가 제한되어 텍스트 파일로 저장했습니다.';} }
  $('banner-form').addEventListener('submit', event=>{event.preventDefault();render();});
  fields.forEach(id=>$(id).addEventListener('input',render));
  $('occasion').addEventListener('change',()=>{const v=examples[$('occasion').value];fields.forEach((id,i)=>$(id).value=v[i]);$('form-status').textContent='선택한 예시 문구로 바꿨습니다. 날짜·장소·주최를 내 행사에 맞게 적어주세요.';render();});
  $('banner-size').addEventListener('change',()=>{$('custom-size').hidden=$('banner-size').value!=='custom';render();});
  ['width-cm','height-cm'].forEach(id=>$(id).addEventListener('input',render));
  document.querySelectorAll('[data-theme]').forEach(button=>button.addEventListener('click',()=>{theme=button.dataset.theme;$('banner-background').value=themes[theme].bg;document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();}));
  $('banner-photo').addEventListener('change',async event=>{
    const file=event.target.files[0], version=++photoVersion;if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024){$('form-status').textContent='JPG·PNG·WEBP, 15MB 이하 사진을 선택해 주세요.';event.target.value='';return;}
    try { const bitmap=await createImageBitmap(file);const c=document.createElement('canvas');const ratio=Math.min(1,6000/Math.max(bitmap.width,bitmap.height));c.width=Math.round(bitmap.width*ratio);c.height=Math.round(bitmap.height*ratio);c.getContext('2d').drawImage(bitmap,0,0,c.width,c.height);bitmap.close();if(version!==photoVersion)return;photo=c.toDataURL('image/png');$('form-status').textContent='사진을 넣었습니다. 미리보기에서 잘리는 부분을 확인해 주세요.';render(); }
    catch{$('form-status').textContent='사진을 열지 못했습니다. 다른 사진을 선택해 주세요.';}
  });
  $('remove-banner-photo').addEventListener('click',()=>{photoVersion++;photo='';$('banner-photo').value='';render();});
  $('download-banner-png').addEventListener('click',()=>{if(!ready)return;canvas.toBlob(blob=>{if(blob){download(blob,'AI봄-현수막-시안.png');$('banner-status').textContent='PNG 저장을 요청했습니다. 다운로드 또는 공유 메뉴를 확인해 주세요.';}},'image/png');});
  $('download-banner-svg').addEventListener('click',()=>{if(ready)download(new Blob([svgSource],{type:'image/svg+xml;charset=utf-8'}),`AI봄-현수막-${dimensions().join('x')}cm-출력협의용.svg`);});
  $('copy-banner-text').addEventListener('click',()=>copy(brief(),'banner-status'));
  $('save-banner-draft').addEventListener('click',()=>{try {localStorage.setItem('aibom.banner.draft.v1',JSON.stringify({values:values(),theme,occasion:$('occasion').value,font:$('banner-font').value,scale:$('font-scale').value,background:$('banner-background').value,size:$('banner-size').value,width:$('width-cm').value,height:$('height-cm').value}));$('form-status').textContent='이 브라우저에 문구와 규격을 보관했습니다. 사진은 저장하지 않았습니다.';}catch{$('form-status').textContent='브라우저 저장이 제한되어 있습니다. 문구 복사나 파일 저장을 이용해 주세요.';}});
  $('load-banner-draft').addEventListener('click',()=>{try {const d=JSON.parse(localStorage.getItem('aibom.banner.draft.v1'));if(!d){$('form-status').textContent='보관한 문구가 없습니다.';return;}fields.forEach((id,i)=>$(id).value=String(d.values?.[i]||'').slice(0,$(id).maxLength));theme=themes[d.theme]?d.theme:'spring';$('banner-font').value=d.font==='serif'?'serif':'gothic';$('font-scale').value=Number(d.scale)||100;$('banner-background').value=/^#[0-9a-f]{6}$/i.test(d.background)?d.background:themes[theme].bg;$('occasion').value=examples[d.occasion]?d.occasion:'community';$('banner-size').value=['300,90','500,90','180,60','custom'].includes(d.size)?d.size:'500,90';$('width-cm').value=Number(d.width)||500;$('height-cm').value=Number(d.height)||90;$('custom-size').hidden=$('banner-size').value!=='custom';document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===theme)));$('form-status').textContent='보관한 문구와 규격을 열었습니다.';render();}catch{$('form-status').textContent='보관한 내용을 열지 못했습니다.';}});
  $('banner-order-link').addEventListener('click',()=>{try{sessionStorage.setItem('aibom.banner.inquiry',JSON.stringify({title:$('banner-title').value,size:dimensions().join(' × ')+' cm',notes:brief()}));}catch{/* The inquiry page remains usable without storage. */}});
  render();
})();
