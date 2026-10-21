/** AI봄 | 봄담이 블록 놀이터. Browser-only, no external dependencies. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const themes = {
    hello: { words: '오늘도 수고했어요. 늘 응원할게요!', caption: '당신을 응원해요', palette: ['#e6f5e9', '#f8f5d9'], sample: ['wave', 'say', 'sparkle'] },
    happy: { words: '생일 축하해요! 행복한 하루 보내세요.', caption: '생일 축하해요', palette: ['#ffece4', '#fff7d9'], sample: ['jump', 'say', 'hearts'] },
    thanks: { words: '함께해 줘서 고마워요. 마음을 전해요!', caption: '고마운 당신에게', palette: ['#fceaf1', '#faf7e3'], sample: ['bow', 'say', 'hearts'] }
  };
  const blockDefinitions = {
    left: {label:'← 왼쪽으로 걷기',color:'motion',duration:1600},
    right: {label:'→ 오른쪽으로 걷기',color:'motion',duration:1600},
    dance: {label:'♫ 춤추기',color:'magic',duration:2600},
    spin: {label:'⟳ 한 바퀴 돌기',color:'looks',duration:1800},
    wave: { label: '👋 손 흔들기', color: 'motion', duration: 1550 },
    say: { label: '💬 말하기', color: 'looks', duration: 1900 },
    jump: { label: '↥ 점프하기', color: 'motion', duration: 1600 },
    hearts: { label: '♥ 하트 보내기', color: 'heart', duration: 1800 },
    bow: { label: '♡ 고개 숙이기', color: 'looks', duration: 1550 },
    wait: { label: '◷ 1초 기다리기', color: 'control', duration: 1000 },
    sparkle: { label: '✦ 반짝이기', color: 'magic', duration: 1600 }
  };
  const imagePaths = {
    neutral: 'assets/bomdam-neutral.png',
    heart: 'assets/bomdam-heart.png',
    thanks: 'assets/bomdam-thanks.png'
  };
  const images = {};
  Object.entries(imagePaths).forEach(([key, path]) => {
    const image = new Image();
    image.src = path;
    images[key] = image;
    image.addEventListener('load', () => render(performance.now()));
    image.addEventListener('error', () => message('캐릭터 이미지가 보이지 않아요. assets 폴더를 확인해 주세요.'));
  });

  const canvas = $('#stage');
  const ctx = canvas.getContext('2d');
  const stack = $('#stack');
  const zone = $('#dropzone');
  const input = $('#speech-input');
  const playBtn = $('#play');
  const stopBtn = $('#stop');
  const videoBtn = $('#export-video');
  const pngBtn = $('#export-png');
  const maxBlocks = 14;
  const recipient = $('#recipient');
  const sender = $('#sender');
  function cardWords(){return [recipient?.value.trim(),input.value.trim() || themes[theme].words].filter(Boolean).join(', ');}

  let motionX=0;
  let theme = 'hello';
  let blocks = [];
  let currentAction = null;
  let playing = false;
  let session = 0;
  let isPortrait = true;
  let recorder = null;
  let recordingStream = null;
  let chunks = [];
  let finishedBlob=null,finishedURL=null,posterURL=null,finishedName='';
  let videoRevision=0;
  function markVideoEdited(){
    videoRevision++;
    const save=$('#save-finished-video');if(save)save.disabled=true;
    if(finishedBlob)$('#video-review-status').textContent='카드를 수정했어요. 새 미리보기를 만든 뒤 저장해 주세요.';
  }
  function releasePreview(){if(finishedURL)URL.revokeObjectURL(finishedURL);if(posterURL)URL.revokeObjectURL(posterURL);finishedURL=null;posterURL=null;}
  $('#save-finished-video')?.addEventListener('click',()=>{if(!finishedBlob||$('#save-finished-video').disabled)return;download(finishedBlob,finishedName);message('확인한 영상을 저장했어요. 카톡에서 다운로드 파일을 첨부해 주세요.');});
  $('#edit-video')?.addEventListener('click',()=>{$('#finished-video').pause();$('#editor').scrollIntoView?.({behavior:'smooth',block:'start'});input.focus();});
  window.addEventListener?.('beforeunload',releasePreview);
  $$('input,textarea,select').forEach(el=>{el.addEventListener('input',markVideoEdited);el.addEventListener('change',markVideoEdited);});
  let cancelRecord = false;
  let audioEnabled = true;
  let reactionWords = '';
  let gaze = 0;
  let reactionTimer = null;
  let reactionCount = 0;
  const synth = window.speechSynthesis;
  const voiceToggle = $('#voice-enabled');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function speak(words) {
    if (!audioEnabled || !synth || !window.SpeechSynthesisUtterance) return;
    synth.cancel();
    const utterance = new window.SpeechSynthesisUtterance(words);
    utterance.lang = 'ko-KR';
    const warm=$('#voice-tone')?.value!=='clear';
    utterance.rate = warm ? .9 : 1; utterance.pitch = 1;
    const korean=synth.getVoices().filter(v=>/^ko(?:-|_)/i.test(v.lang));
    const voice = korean.find(v=>v.voiceURI===$('#voice-choice')?.value) || korean[0];
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  }
  function populateVoices(){
    if(!synth)return;
    const select=$('#voice-choice');if(!select)return;
    const previous=select.value;
    const voices=synth.getVoices().filter(v=>/^ko(?:-|_)/i.test(v.lang));
    select.replaceChildren();
    const base=document.createElement('option');base.value='';base.textContent='기본 한국어 목소리';select.append(base);
    voices.forEach(voice=>{const option=document.createElement('option');option.value=voice.voiceURI;option.textContent=voice.name;select.append(option);});
    select.value=voices.some(v=>v.voiceURI===previous)?previous:'';
    $('#voice-choice-hint').textContent=voices.length ? '목소리를 골라 들어보세요. 높은 음정 변형 없이 조금 천천히 읽어요. 저장 영상은 무음입니다.' : '한국어 목소리 목록이 없으면 기기 기본 음성으로 읽습니다. Windows 음성 설정에 한국어 음성이 필요할 수 있어요.';
  }
  populateVoices();
  synth?.addEventListener?.('voiceschanged',populateVoices);
  $('#voice-preview')?.addEventListener('click',()=>{if(!synth||playing)return;audioEnabled=true;if(voiceToggle)voiceToggle.checked=true;speak('반가워요. 오늘도 당신을 응원할게요.');message('선택한 목소리로 짧은 인사를 읽어요.');});
  function react(kind = 'hello') {
    if (playing) return;
    clearTimeout(reactionTimer);
    const replies = {hello:['안녕! 같이 놀자!', '또 만나서 반가워!'], praise:['칭찬해 줘서 고마워!', '네가 있어 기뻐!'], tickle:['아하하! 간지러워!', '히히! 한 번 더?']};
    reactionWords = replies[kind][reactionCount++ % 2];
    currentAction = {kind:kind === 'tickle' ? 'jump' : kind === 'praise' ? 'hearts' : 'wave',start:performance.now(),duration:2400};
    speak(reactionWords); message(reactionWords);
    reactionTimer = setTimeout(()=>{if(!playing){currentAction=null;reactionWords='';}},2400);
  }
  voiceToggle?.addEventListener('change',()=>{audioEnabled=voiceToggle.checked;if(!audioEnabled)synth?.cancel();});
  if (!synth) { if(voiceToggle){voiceToggle.checked=false;voiceToggle.disabled=true;} audioEnabled=false;$$('#voice-choice,#voice-tone,#voice-preview').forEach(el=>el.disabled=true); $('#voice-hint').textContent='이 브라우저는 목소리를 지원하지 않아 말풍선으로 대화해요.'; }
  $$('[data-react]').forEach(button=>button.addEventListener('click',()=>react(button.dataset.react)));
  canvas.addEventListener('click',()=>react('hello'));
  canvas.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();react('hello');}});
  canvas.addEventListener('pointermove',event=>{const rect=canvas.getBoundingClientRect();gaze=Math.max(-1,Math.min(1,((event.clientX-rect.left)/rect.width-.5)*2));});
  canvas.addEventListener('pointerleave',()=>{gaze=0;});
  $('#mission-load')?.addEventListener('click',()=>{if(playing)return;blocks=['wave','say','hearts'];updateStack();$('#mission-status').textContent='준비됐어요! 내 문구를 적고 실행해 보세요.';message('인사 놀이 블록을 연결했어요.');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)synth?.cancel();});
  let lastAnimationTime = 0;

  function message(value) { $('#status').textContent = value; }
  function toggleControls(active) {
    playBtn.disabled = active;
    videoBtn.disabled = active;
    pngBtn.disabled = active;
    $('#clear').disabled = active;
    $('#example').disabled = active;
    $$('.theme-card').forEach(el => el.disabled = active);
    $$('input[name=ratio]').forEach(el => el.disabled = active);
    $$('#palette button').forEach(el => el.disabled = active);
    input.disabled = active;
    $$('#motion-speed,#dance-demo,#card-look,#repeat-count,#letter-example,[data-course],#voice-choice,#voice-tone,#voice-preview').forEach(el=>el.disabled=active);
    [recipient,sender,$('#share-card')].forEach(el=>{if(el)el.disabled=active;});
    $$('[data-react],#mission-load').forEach(el=>el.disabled=active);
  }
  function $$(selector) { return document.querySelectorAll(selector); }

  // Pointer dragging works with mouse and touch; click/arrow controls remain available.
  function pointerDrag(element, data) {
    element.draggable = false;
    let origin = null, ghost = null, suppressClick = false;
    const cleanup = () => { ghost?.remove(); ghost = null; origin = null; zone.classList.remove('is-over'); };
    element.addEventListener('pointerdown', event => {
      if (playing || event.button !== 0 || event.target.closest('.tiny')) return;
      origin = {x:event.clientX,y:event.clientY,id:event.pointerId};
      element.setPointerCapture(event.pointerId);
    });
    element.addEventListener('pointermove', event => {
      if (!origin || event.pointerId !== origin.id) return;
      if (!ghost && Math.hypot(event.clientX-origin.x,event.clientY-origin.y) < 8) return;
      if (!ghost) { ghost=document.createElement('div');ghost.className='block-drag-ghost';ghost.textContent=element.querySelector('.name')?.textContent || element.textContent;document.body.append(ghost); }
      ghost.style.left=(event.clientX+12)+'px';ghost.style.top=(event.clientY+12)+'px';
      const hit=document.elementFromPoint(event.clientX,event.clientY);
      zone.classList.toggle('is-over',Boolean(hit && zone.contains(hit)));
      event.preventDefault();
    });
    element.addEventListener('pointerup', event => {
      if (!origin || event.pointerId !== origin.id) return;
      if (ghost) {
        suppressClick=true;setTimeout(()=>{suppressClick=false;},0);
        const hit=document.elementFromPoint(event.clientX,event.clientY);
        if (!playing && hit && zone.contains(hit)) { const target=hit.closest('.assembled');onDrop(data(),target?Number(target.dataset.index):blocks.length); }
      }
      cleanup();
    });
    element.addEventListener('pointercancel',cleanup);
    element.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();}},true);
  }

  function createStackBlock(kind, index) {
    const definition = blockDefinitions[kind];
    const row = document.createElement('div');
    row.className = `assembled block-${definition.color}`;
    row.draggable = true;
    row.dataset.index = String(index);
    row.setAttribute('role', 'listitem');
    row.setAttribute('aria-label', `${index + 1}번째 블록: ${definition.label}`);
    pointerDrag(row, () => `move:${row.dataset.index}`);
    const number = document.createElement('span');
    number.className = 'ordinal';
    number.textContent = String(index + 1);
    const label = document.createElement('span');
    label.className = 'name';
    label.textContent = definition.label;
    row.append(number, label);
    const commands = [
      ['↑', '블록 위로 이동', () => moveBlock(index, index - 1)],
      ['↓', '블록 아래로 이동', () => moveBlock(index, index + 1)],
      ['×', '블록 제거', () => { blocks.splice(index, 1); updateStack(); }]
    ];
    commands.forEach(([text, accessibleName, callback]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tiny';
      button.textContent = text;
      button.setAttribute('aria-label', accessibleName);
      button.disabled = playing;
      button.addEventListener('click', (event) => { event.stopPropagation(); if (!playing) callback(); });
      row.appendChild(button);
    });
    row.addEventListener('dragstart', event => {
      if (playing) { event.preventDefault(); return; }
      event.dataTransfer.setData('text/plain', `move:${index}`);
      event.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragover', event => { event.preventDefault(); event.stopPropagation(); });
    row.addEventListener('drop', event => {
      event.preventDefault(); event.stopPropagation();
      zone.classList.remove('is-over');
      if (playing) return;
      onDrop(event.dataTransfer.getData('text/plain'), index);
    });
    return row;
  }
  function updateStack() {
    markVideoEdited();
    stack.replaceChildren();
    blocks.forEach((kind, index) => stack.append(createStackBlock(kind, index)));
    $('#block-count').textContent = String(blocks.length);
    $('#empty-hint').hidden = Boolean(blocks.length);
  }
  function addBlock(kind, at = blocks.length) {
    if (playing || !blockDefinitions[kind]) return;
    if (blocks.length >= maxBlocks) { message(`블록은 최대 ${maxBlocks}개까지 연결할 수 있어요.`); return; }
    blocks.splice(Math.min(Math.max(at, 0), blocks.length), 0, kind);
    updateStack();
    message(`「${blockDefinitions[kind].label}」 블록을 연결했어요.`);
  }
  function moveBlock(from, to) {
    if (playing || from < 0 || to < 0 || from >= blocks.length || to >= blocks.length || from === to) return;
    const [block] = blocks.splice(from, 1);
    blocks.splice(to, 0, block);
    updateStack();
    message('블록 순서를 바꿨어요. 다시 실행해 보세요.');
  }
  function onDrop(data, index) {
    if (data.startsWith('new:')) addBlock(data.substring(4), index);
    else if (data.startsWith('move:')) moveBlock(Number(data.substring(5)), Math.min(index, blocks.length - 1));
  }
  $$('#palette button').forEach(button => {
    pointerDrag(button, () => `new:${button.dataset.block}`);
    button.addEventListener('dragstart', event => {
      if (playing) { event.preventDefault(); return; }
      event.dataTransfer.setData('text/plain', `new:${button.dataset.block}`);
      event.dataTransfer.effectAllowed = 'copy';
    });
    button.addEventListener('click', () => addBlock(button.dataset.block));
  });
  zone.addEventListener('dragover', event => { if (!playing) { event.preventDefault(); zone.classList.add('is-over'); } });
  zone.addEventListener('dragleave', event => { if (!zone.contains(event.relatedTarget)) zone.classList.remove('is-over'); });
  zone.addEventListener('drop', event => {
    event.preventDefault();
    zone.classList.remove('is-over');
    if (!playing) onDrop(event.dataTransfer.getData('text/plain'), blocks.length);
  });
  $('#clear').addEventListener('click', () => { if (playing) return; blocks = []; updateStack(); message('블록을 모두 지웠어요. 처음부터 다시 만들어 보세요.'); });
  $('#example').addEventListener('click', () => { if (playing) return; blocks = [...themes[theme].sample]; updateStack(); message('예시 블록을 연결했어요. 이제 초록 깃발을 눌러보세요.'); });

  $('#letter-example')?.addEventListener('click',()=>{if(playing)return;selectTheme('thanks');recipient.value='지우';sender.value='할머니가';input.value='지우야,\n네 웃음은 할머니의 선물이야.\n건강하게 자라줘서 고마워.\n사랑해.';$('#card-look').value='warm';blocks=['wave','say','hearts'];updateStack();render(performance.now());message('예시 편지를 넣었어요. 이름과 문구를 내 이야기로 바꿔보세요.');});
  const courses={birthday:['wave','jump','dance','say','hearts'],cheer:['right','jump','left','say','sparkle'],love:['right','left','bow','say','hearts']};
  $$('[data-course]').forEach(button=>button.addEventListener('click',()=>{if(playing)return;blocks=[...courses[button.dataset.course]];updateStack();message('동작 코스를 넣었어요. 문구는 그대로예요. 재생해 보세요.');}));
  $('#card-look')?.addEventListener('change',()=>render(performance.now()));
  $('#dance-demo')?.addEventListener('click',()=>{if(playing)return;blocks=['wave','right','left','dance','spin','say','hearts'];updateStack();message('춤추는 카드 동작을 넣었어요. 재생해 보세요!');});

  function selectTheme(next) {
    if (playing || !themes[next]) return;
    theme = next;motionX=0;
    blocks = [...themes[next].sample];
    input.value = themes[theme].words;
    $$('.theme-card').forEach(button => {
      const selected = button.dataset.theme === theme;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    updateStack();
    currentAction = null;
    reactionWords='';clearTimeout(reactionTimer);synth?.cancel();
    message('문구와 이름을 바꾸면 내 카드가 돼요.');
    render(performance.now());
  }
  $$('.theme-card').forEach(button => button.addEventListener('click', () => selectTheme(button.dataset.theme)));
  input.addEventListener('input', () => render(performance.now()));
  [recipient,sender].forEach(el=>el?.addEventListener('input',()=>render(performance.now())));
  $$('input[name=ratio]').forEach(radio => radio.addEventListener('change', () => {
    if (playing) return;
    isPortrait = radio.value === 'portrait';
    canvas.width = isPortrait ? 720 : 1280;
    canvas.height = isPortrait ? 1280 : 720;
    canvas.classList.toggle('landscape', !isPortrait);
    render(performance.now());
  }));

  function rr(x, y, w, h, radius, fill) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fillStyle = fill; ctx.fill();
  }
  function heart(x, y, size, fill, rotate = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotate); ctx.scale(size, size);
    ctx.beginPath(); ctx.moveTo(0, .75); ctx.bezierCurveTo(-1.1, .1, -.9, -.7, 0, -.23); ctx.bezierCurveTo(.9, -.7, 1.1, .1, 0, .75);
    ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  }
  function star(x, y, r, color) {
    ctx.save();ctx.translate(x, y);ctx.beginPath();for(let k = 0; k < 8; k++) {
      const angle = -Math.PI / 2 + Math.PI * k / 4;
      const rad = k % 2 ? r * .32 : r;
      const xx = Math.cos(angle) * rad, yy = Math.sin(angle) * rad;
      if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.restore();
  }
  function drawSpeech(text, w, h) {
    const portrait = isPortrait;
    const bubbleW = w * (portrait ? .82 : .45);
    const bubbleH = h * (portrait ? .18 : .28);
    const x = portrait ? (w - bubbleW) / 2 : w * .5;
    const y = portrait ? h * .17 : h * .16;
    ctx.save();ctx.shadowColor='#62786125';ctx.shadowBlur=22;ctx.shadowOffsetY=8;
    rr(x, y, bubbleW, bubbleH, 28, '#fffdf7');ctx.restore();
    ctx.strokeStyle='#e6c8ae';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+28,y+bubbleH-18);ctx.lineTo(x+bubbleW-28,y+bubbleH-18);ctx.stroke();
    ctx.fillStyle='#5d453e';ctx.textAlign='center';ctx.textBaseline='middle';
    const fontSize=portrait?34:27;
    ctx.font=`600 ${fontSize}px "Batang","AppleMyungjo",serif`;
    const lines=[];
    for(const paragraph of text.split('\n')){
      let line='';
      for(const word of paragraph.split(/\s+/).filter(Boolean)){
        const next=line?line+' '+word:word;
        if(ctx.measureText(next).width<=bubbleW-48){line=next;continue;}
        if(line){lines.push(line);line='';}
        for(const char of word){if(line&&ctx.measureText(line+char).width>bubbleW-48){lines.push(line);line='';}line+=char;}
      }
      lines.push(line);
    }
    const lineHeight=fontSize*1.4;
    lines.slice(0,5).forEach((value,i)=>ctx.fillText(value,x+bubbleW/2,y+bubbleH/2+(i-(Math.min(lines.length,5)-1)/2)*lineHeight,bubbleW-48));
    ctx.textAlign='left';ctx.textBaseline='alphabetic';
  }
  function drawPuppet(img,iw,ih,kind,progress,now){
    const walking=kind==='left'||kind==='right';
    const dancing=kind==='dance';
    const cycle=progress*Math.PI*(walking?8:dancing?10:4);
    const headTilt=reducedMotion?0:(kind==='wave'?Math.sin(cycle)*.085:dancing?Math.sin(cycle)*.09:gaze*.035+Math.sin(now/1100)*.008);
    const drawPart=(top,bottom,pivotX,pivotY,angle,dy=0)=>{
      ctx.save();ctx.translate(pivotX,pivotY+dy);ctx.rotate(angle);ctx.translate(-pivotX,-pivotY);
      ctx.beginPath();ctx.rect(-iw/2,-ih/2+ih*top,iw,ih*(bottom-top));ctx.clip();
      ctx.drawImage(img,-iw/2,-ih/2,iw,ih);ctx.restore();
    };
    // Legs alternate while walking; head pivots at the neck, independently of the dress.
    drawPart(.59,.845,0,ih*.2,0);
    for(const side of [-1,1]){
      ctx.save();ctx.beginPath();ctx.rect(side<0?-iw/2:0,ih*.34,iw/2,ih*.2);ctx.clip();
      const footSwing=(walking||dancing)&&!reducedMotion?Math.sin(cycle+ (side<0?0:Math.PI))*.2:0;
      drawPart(.835,1,side*iw*.045,ih*.34,footSwing,Math.max(0,Math.sin(cycle)*side)*-ih*.012);ctx.restore();
    }
    drawPart(0,.64,0,ih*.13,headTilt);
  }
  function render(now) {
    if (!ctx) return;
    const w=canvas.width,h=canvas.height;
    const look=$('#card-look')?.value || 'warm';
    const colors=look==='night'?['#243550','#49516b']:look==='party'?['#fff0e9','#fff8e3']:['#fff5e9','#f7e6dc'];
    const gradient=ctx.createLinearGradient(0,0,w,h);
    gradient.addColorStop(0,colors[0]);gradient.addColorStop(1,colors[1]);ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
    // Calm, consistent hand-drawn stage motifs.
    ctx.fillStyle='#ffffff76';ctx.beginPath();ctx.arc(w*.13,h*.13,w*.11,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffffff85';ctx.beginPath();ctx.arc(w*.9,h*.25,w*.15,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=theme==='happy'?'#f4cebd':theme==='thanks'?'#e9cbda':'#c9e4c3';
    ctx.beginPath();ctx.ellipse(w*.17,h*1.05,w*.5,h*.16,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=theme==='happy'?'#eadcb3':theme==='thanks'?'#e2d9be':'#b9dabd';
    ctx.beginPath();ctx.ellipse(w*.86,h*1.07,w*.52,h*.2,0,0,Math.PI*2);ctx.fill();
    const playingAction=currentAction ? currentAction.kind : 'idle';
    const progress=currentAction?Math.max(0,Math.min(1,(now-currentAction.start)/currentAction.duration)):0;
    for(let i=0;i<11;i++) {
      const x=w*((i*.157+.075)%1), y=h*(.35+(Math.sin(i*7)*.06))+(currentAction?.kind==='sparkle'?Math.sin(progress*9+i)*20:0);
      star(x,y,isPortrait?7:6, i%2?'#ffffffdc':'#f5c2be');
    }
    const headText=themes[theme].caption;
    ctx.textAlign='center';ctx.fillStyle=look==='night'?'#fff0d6':'#8c7564';ctx.font=`700 ${isPortrait?22:24}px "Malgun Gothic",sans-serif`;
    ctx.fillText(look==='night'?'오늘 밤, 너에게 닿기를':'너를 생각하며 쓰는 작은 편지',w/2,h*.055);
    ctx.font=`900 ${isPortrait?48:38}px "Malgun Gothic",sans-serif`;
    ctx.fillStyle=look==='night'?'#fff2da':'#765040';ctx.fillText((recipient?.value.trim()?recipient.value.trim()+'에게':headText),w/2,h*.12);
    let form = theme==='happy'?'heart':theme==='thanks'?'thanks':'neutral';
    if(playingAction==='hearts')form='heart';
    if(playingAction==='bow')form='thanks';
    if(['left','right','dance','spin','wave','jump'].includes(playingAction))form='neutral';
    const img=images[form];
    const walking=playingAction==='left'||playingAction==='right';
    const ease=progress*progress*(3-2*progress);
    const travel=walking?(currentAction.fromX+(currentAction.toX-currentAction.fromX)*ease):motionX;
    let xOffset=w*travel;
    let yOffset=reducedMotion?0:Math.sin(now/800)*h*.003,rotation=0,scale=1;
    if(!currentAction && !reducedMotion)rotation=gaze*.025;
    if(playingAction==='jump'){const flight=Math.sin(progress*Math.PI);yOffset=-flight*h*.14;rotation=.04*Math.sin(progress*Math.PI*2);}
    if(playingAction==='wave'){rotation=.035*Math.sin(progress*Math.PI*5);scale=1+.015*Math.sin(progress*Math.PI*4);}
    if(playingAction==='bow'){rotation=.12*Math.sin(Math.PI*progress);yOffset=Math.sin(Math.PI*progress)*h*.024;}
    if(playingAction==='sparkle'){scale=1+.035*Math.sin(progress*Math.PI*8);}
    if(playingAction==='jump'){scale=1+.06*Math.sin(progress*Math.PI*2);}
    if(walking&&!reducedMotion){yOffset=-Math.abs(Math.sin(progress*Math.PI*8))*h*.009;rotation=.018*Math.sin(progress*Math.PI*8);}
    if(playingAction==='dance'&&!reducedMotion){xOffset+=Math.sin(progress*Math.PI*6)*w*.045;yOffset=-Math.abs(Math.sin(progress*Math.PI*10))*h*.018;rotation=Math.sin(progress*Math.PI*10)*.055;}
    if(playingAction==='spin'&&!reducedMotion)rotation=ease*Math.PI*2;
    if(reducedMotion){yOffset=0;rotation=0;scale=1;}
    const imageSize=h*(isPortrait?.49:.65);
    const centerY=h*(isPortrait?.585:.56)+yOffset;
    // Ground shadow anchors the jump and shrinks as the character rises.
    ctx.save();ctx.fillStyle='#49644724';ctx.beginPath();ctx.ellipse(w*(isPortrait?.5:.25)+xOffset,h*(isPortrait?.79:.84),w*.12*(1+Math.min(0,yOffset/h)*2),h*.012,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();ctx.translate(w*(isPortrait?.5:.25)+xOffset,centerY);ctx.rotate(rotation);ctx.scale(scale,scale);
    if(img&&img.complete&&img.naturalWidth>0){
      const z=Math.min(imageSize/img.naturalHeight,w*(isPortrait?.95:.56)/img.naturalWidth);
      const iw=img.naturalWidth*z,ih=img.naturalHeight*z;
      if(form==='neutral')drawPuppet(img,iw,ih,playingAction,progress,now);else ctx.drawImage(img,-iw/2,-ih/2,iw,ih);
    }else{
      ctx.fillStyle='#769475';ctx.font=`${isPortrait?72:65}px sans-serif`;ctx.fillText('🌱',0,30);
    }
    ctx.restore();
    if(playingAction==='wave'){
      ctx.save();ctx.strokeStyle='#d48a74';ctx.lineWidth=isPortrait?7:6;ctx.lineCap='round';
      const handX=w*(isPortrait?.75:.43),handY=centerY-h*.065;
      for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(handX,handY,(i+1)*17+7,Math.PI*1.22,Math.PI*1.8);ctx.stroke();}ctx.restore();
    }
    if(playingAction==='hearts'){
      for(let i=0;i<7;i++){
        let x=w*(.2+(i*.11)% .65),y=centerY+Math.sin(i*2)*h*.12-progress*h*(.22+.05*(i%3));
        heart(x,y,16+i%3*7, i%2?'#e7849b':'#f5adc2',Math.sin(i+progress)*.15);
      }
    }
    if(playingAction==='sparkle'){
      for(let i=0;i<16;i++){
        const angle=(i/16)*Math.PI*2+progress*.8;
        const rad=h*(.19+.03*Math.sin(progress*11+i));
        star(w*(isPortrait?.5:.25)+Math.cos(angle)*rad,centerY+Math.sin(angle)*rad,10+(i%4)*3,i%2?'#e6a9ba':'#e6bb60');
      }
    }
    drawSpeech((reactionWords || input.value.trim() || themes[theme].words).slice(0,60),w,h);
    if(look==='party'){for(let i=0;i<24;i++){const drift=playing?now/1000:0;const xx=w*((i*.173+.04)%1),yy=h*((i*.137+drift*.08)% .86);star(xx,yy,4+i%3*2,['#dc9c95','#d9b968','#a7bca2'][i%3]);}}
    if(look==='night'){for(let i=0;i<22;i++)star(w*((i*.193+.03)%1),h*((i*.129)% .88),3+i%3,'#fff4d3');}
    rr(w*.19,h*.89,w*.62,h*.065,24,'#fffaf1e8');
    ctx.fillStyle='#886050';ctx.textAlign='center';ctx.font=`800 ${isPortrait?25:23}px "Malgun Gothic",sans-serif`;
    ctx.fillText(sender?.value.trim() || '사랑과 응원을 담아',w/2,h*.935);
    ctx.textAlign='left';
  }
  function onFrame(time) { lastAnimationTime=time;render(time);requestAnimationFrame(onFrame); }
  requestAnimationFrame(onFrame);

  const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
  function download(blob, name) {
    const objectURL=URL.createObjectURL(blob);
    const anchor=document.createElement('a');anchor.href=objectURL;anchor.download=name;document.body.appendChild(anchor);
    anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(objectURL),30000);
  }
  function discardRecord() {
    if(recorder&&recorder.state!=='inactive')recorder.stop();
    if(recordingStream) recordingStream.getTracks().forEach(t=>t.stop());
    recordingStream=null;
  }
  async function run(shouldSave=false) {
    if(playing)return;
    if(blocks.length===0){message('색깔 블록을 하나 이상 연결해 주세요.');return;}
    if(shouldSave && (!canvas.captureStream || typeof MediaRecorder==='undefined')) {
      message('이 브라우저는 영상 저장을 지원하지 않아요. 크롬이나 엣지에서 다시 시도해 주세요.');return;
    }
    clearTimeout(reactionTimer);reactionWords='';synth?.cancel();
    if(shouldSave){markVideoEdited();$('#finished-video')?.pause();}
    motionX=0;
    playing=true;cancelRecord=false;
    const token=++session;
    const recordingRevision=videoRevision;
    const repeats=Number($('#repeat-count')?.value)||1;
    const commands=Array.from({length:repeats},()=>blocks).flat();
    toggleControls(true);
    if(shouldSave){
      try {
        chunks=[];
        recordingStream=canvas.captureStream(30);
        const type=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']
          .find(mime=>MediaRecorder.isTypeSupported(mime));
        if(!type)throw new Error('WebM unsupported');
        recorder=new MediaRecorder(recordingStream,{mimeType:type,videoBitsPerSecond:3500000});
        recorder.addEventListener('dataavailable',ev=>{if(ev.data && ev.data.size>0)chunks.push(ev.data);});
        recorder.addEventListener('stop',()=>{
          if(cancelRecord || session !== token)return;
          if(chunks.length===0){message('영상 파일이 비어 있어요. 다시 시도해 주세요.');return;}
          releasePreview();
          finishedBlob=new Blob(chunks,{type:'video/webm'});
          finishedURL=URL.createObjectURL(finishedBlob);
          finishedName=`봄담이_${theme}_${isPortrait?'세로':'가로'}.webm`;
          const review=$('#video-review'),video=$('#finished-video');
          video.src=finishedURL;video.load();review.hidden=false;
          canvas.toBlob(blob=>{if(blob && session===token){if(posterURL)URL.revokeObjectURL(posterURL);posterURL=URL.createObjectURL(blob);video.poster=posterURL;}},'image/png');
          $('#save-finished-video').disabled=videoRevision!==recordingRevision;
          $('#video-review-status').textContent=videoRevision===recordingRevision?'아직 저장하지 않았어요. 재생해서 보고 마음에 들면 아래 저장 버튼을 누르세요.':'수정 전 영상이에요. 새 미리보기를 만들어 주세요.';
          message('영상 완성본이 준비됐어요. 아래에서 재생해 본 뒤 저장하세요.');
          review.scrollIntoView?.({behavior:'smooth',block:'start'});
          $('#video-review-title').focus();
        },{once:true});
        recorder.start(200);
        await sleep(250);
      }catch(error){
        cancelRecord=true;discardRecord();recorder=null;playing=false;toggleControls(false);
        message('이 브라우저에서 영상 저장을 시작하지 못했어요. 실행 기능은 계속 이용할 수 있어요.');
        return;
      }
    }
    for(let index=0;index<commands.length;index++) {
      if(session!==token)break;
      const kind=commands[index];
      const def=blockDefinitions[kind];
      const words=cardWords();
      const speed=Number($('#motion-speed')?.value)||1;
      const duration=kind==='say'?Math.max(def.duration,Math.min(20000,words.length*270+700)):def.duration/speed;
      const toX=Math.max(-.14,Math.min(.14,motionX+(kind==='left'?-.14:kind==='right'?.14:0)));
      currentAction={kind,start:performance.now(),duration,fromX:motionX,toX};
      $$('#stack .assembled').forEach((row,i)=>row.classList.toggle('is-running',i===index));
      if(kind==='say' && !shouldSave)speak(words);
      message(`${index+1}/${commands.length} · ${def.label} 실행 중`);
      await sleep(duration);
      if(session===token)motionX=toX;
    }
    if(session===token){
      currentAction=null;
      render(performance.now());
      if(shouldSave) await sleep(450);
      if(shouldSave){message('영상 미리보기를 마무리하는 중이에요.');discardRecord();}
      else {message('완성! 봄담이가 내 순서대로 움직였어요.');if(commands.join(',')==='wave,say,hearts'){$('#mission-status').textContent='🎉 인사 놀이 성공! 이번엔 다른 말로 인사해 볼까요?';}}
      synth?.cancel();
      $$('#stack .assembled').forEach(row=>row.classList.remove('is-running'));
    }
    if(session===token) {playing=false;toggleControls(false);}
  }
  playBtn.addEventListener('click',()=>run(false));
  videoBtn.addEventListener('click',()=>run(true));
  stopBtn.addEventListener('click',()=>{
    synth?.cancel();clearTimeout(reactionTimer);reactionWords='';currentAction=null;
    $$('#stack .assembled').forEach(row=>row.classList.remove('is-running'));
    if(!playing){message('멈췄어요. 봄담이를 누르면 다시 인사해요.');return;}
    session+=1;cancelRecord=true;currentAction=null;discardRecord();playing=false;toggleControls(false);
    message('멈췄어요. 블록을 고쳐 다시 실행할 수 있어요.');
  });
  async function cardBlob(){
    const oldWords=reactionWords,oldAction=currentAction;
    reactionWords='';currentAction={kind:'say',start:performance.now(),duration:1900};render(performance.now());
    const result=new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    reactionWords=oldWords;currentAction=oldAction;render(performance.now());
    return result;
  }
  pngBtn.addEventListener('click',async()=>{if(playing)return;const blob=await cardBlob();if(blob){download(blob,'봄담이_마음카드.png');message('사진 카드를 저장했어요. 아래 ② 안내대로 카톡에 파일을 첨부하세요.');$('#send-guide')?.classList.add('is-ready');}else message('카드 저장을 다시 시도해 주세요.');});
  // Start with an empty, inviting workspace so the learner experiences connecting blocks.
  selectTheme('hello');
})();
