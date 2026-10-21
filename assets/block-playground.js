/** AI봄 | 봄담이 블록 놀이터. Browser-only, no external dependencies. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const themes = {
    hello: { words: '안녕하세요!', caption: '반가운 인사', palette: ['#e6f5e9', '#f8f5d9'], sample: ['wave', 'say', 'sparkle'] },
    happy: { words: '기뻐요!', caption: '즐거운 순간', palette: ['#ffece4', '#fff7d9'], sample: ['jump', 'say', 'hearts'] },
    thanks: { words: '고마워요!', caption: '따뜻한 마음', palette: ['#fceaf1', '#faf7e3'], sample: ['bow', 'say', 'hearts'] }
  };
  const blockDefinitions = {
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

  let theme = 'hello';
  let blocks = [];
  let currentAction = null;
  let playing = false;
  let session = 0;
  let isPortrait = true;
  let recorder = null;
  let recordingStream = null;
  let chunks = [];
  let cancelRecord = false;
  let audioEnabled = false;
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
  }
  function $$(selector) { return document.querySelectorAll(selector); }

  function createStackBlock(kind, index) {
    const definition = blockDefinitions[kind];
    const row = document.createElement('div');
    row.className = `assembled block-${definition.color}`;
    row.draggable = true;
    row.dataset.index = String(index);
    row.setAttribute('role', 'listitem');
    row.setAttribute('aria-label', `${index + 1}번째 블록: ${definition.label}`);
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

  function selectTheme(next) {
    if (playing || !themes[next]) return;
    theme = next;
    blocks = [];
    input.value = themes[theme].words;
    $$('.theme-card').forEach(button => {
      const selected = button.dataset.theme === theme;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    updateStack();
    currentAction = null;
    message('색깔 블록을 직접 골라 연결해 보세요.');
    render(performance.now());
  }
  $$('.theme-card').forEach(button => button.addEventListener('click', () => selectTheme(button.dataset.theme)));
  input.addEventListener('input', () => render(performance.now()));
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
    const bubbleH = h * (portrait ? .115 : .19);
    const x = portrait ? (w - bubbleW) / 2 : w * .5;
    const y = portrait ? h * .15 : h * .16;
    ctx.save();ctx.shadowColor='#62786125';ctx.shadowBlur=22;ctx.shadowOffsetY=8;
    rr(x, y, bubbleW, bubbleH, 35, '#fffefb');ctx.restore();
    ctx.strokeStyle='#ddb2a4';ctx.lineWidth=4;ctx.strokeRect(x+9,y+9,bubbleW-18,bubbleH-18);
    ctx.fillStyle='#5d453e';ctx.textAlign='center';ctx.textBaseline='middle';
    let fontSize=portrait?45:39;
    do {ctx.font=`800 ${fontSize}px "Malgun Gothic",system-ui,sans-serif`;if(ctx.measureText(text).width < bubbleW-55)break;fontSize-=1;} while(fontSize>22);
    ctx.fillText(text,x+bubbleW/2,y+bubbleH/2,bubbleW-55);
    ctx.textAlign='left';ctx.textBaseline='alphabetic';
  }
  function render(now) {
    if (!ctx) return;
    const w=canvas.width,h=canvas.height;
    const colors=themes[theme].palette;
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
    ctx.textAlign='center';ctx.fillStyle='#60836b';ctx.font=`700 ${isPortrait?22:24}px "Malgun Gothic",sans-serif`;
    ctx.fillText('AI봄 · 블록으로 만드는 한마디',w/2,h*.07);
    ctx.font=`900 ${isPortrait?48:38}px "Malgun Gothic",sans-serif`;
    ctx.fillStyle='#41644d';ctx.fillText(headText,w/2,h*.12);
    let form = theme==='happy'?'heart':theme==='thanks'?'thanks':'neutral';
    if(playingAction==='hearts')form='heart';
    if(playingAction==='bow')form='thanks';
    const img=images[form];
    let yOffset=0,rotation=0,scale=1;
    if(playingAction==='jump'){yOffset=-Math.sin(progress*Math.PI)*h*.115;rotation=.055*Math.sin(progress*Math.PI*2);}
    if(playingAction==='wave'){rotation=.085*Math.sin(progress*Math.PI*7);}
    if(playingAction==='bow'){rotation=.12*Math.sin(Math.PI*progress);yOffset=Math.sin(Math.PI*progress)*h*.024;}
    if(playingAction==='sparkle'){scale=1+.035*Math.sin(progress*Math.PI*8);}
    const imageSize=h*(isPortrait?.54:.72);
    const centerY=h*(isPortrait?.585:.56)+yOffset;
    ctx.save();ctx.translate(w*.5,centerY);ctx.rotate(rotation);ctx.scale(scale,scale);
    if(img&&img.complete&&img.naturalWidth>0){
      const z=Math.min(imageSize/img.naturalHeight,w*(isPortrait?.95:.56)/img.naturalWidth);
      const iw=img.naturalWidth*z,ih=img.naturalHeight*z;
      ctx.drawImage(img,-iw/2,-ih/2,iw,ih);
    }else{
      ctx.fillStyle='#769475';ctx.font=`${isPortrait?72:65}px sans-serif`;ctx.fillText('🌱',0,30);
    }
    ctx.restore();
    if(playingAction==='wave'){
      ctx.save();ctx.strokeStyle='#d48a74';ctx.lineWidth=isPortrait?7:6;ctx.lineCap='round';
      const handX=w*(isPortrait?.75:.715),handY=centerY-h*.065;
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
        star(w*.5+Math.cos(angle)*rad,centerY+Math.sin(angle)*rad,10+(i%4)*3,i%2?'#e6a9ba':'#e6bb60');
      }
    }
    if(playingAction==='say') drawSpeech((input.value.trim() || themes[theme].words).slice(0,28),w,h);
    rr(w*.19,h*.89,w*.62,h*.065,35,'#ffffffaa');
    ctx.fillStyle='#558168';ctx.textAlign='center';ctx.font=`800 ${isPortrait?25:23}px "Malgun Gothic",sans-serif`;
    ctx.fillText('봄담이와 함께, 오늘도 한 걸음',w/2,h*.935);
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
    playing=true;cancelRecord=false;
    const token=++session;
    const commands=[...blocks];
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
          download(new Blob(chunks,{type:'video/webm'}),`봄담이_${theme}_${isPortrait?'세로':'가로'}.webm`);
          message('영상이 준비됐어요. 브라우저 다운로드 목록을 확인해 주세요.');
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
      currentAction={kind,start:performance.now(),duration:def.duration};
      message(`${index+1}/${commands.length} · ${def.label} 실행 중`);
      await sleep(def.duration);
    }
    if(session===token){
      currentAction=null;
      render(performance.now());
      if(shouldSave) await sleep(450);
      if(shouldSave){message('영상 파일을 마무리하는 중이에요.');discardRecord();}
      else message('완성! 순서를 바꾸면 움직임도 달라져요.');
    }
    if(session===token) {playing=false;toggleControls(false);}
  }
  playBtn.addEventListener('click',()=>run(false));
  videoBtn.addEventListener('click',()=>run(true));
  stopBtn.addEventListener('click',()=>{
    if(!playing){message('정지 상태예요. 블록을 조립해 보세요.');return;}
    session+=1;cancelRecord=true;currentAction=null;discardRecord();playing=false;toggleControls(false);
    message('멈췄어요. 블록을 고쳐 다시 실행할 수 있어요.');
  });
  pngBtn.addEventListener('click',()=>{
    if(playing)return;
    // A still image should include the learner's words, even after playback ends.
    const previousAction = currentAction;
    currentAction = {kind:'say',start:performance.now(),duration:1900};
    render(performance.now());
    canvas.toBlob(blob=>{if(blob)download(blob,`봄담이_${theme}_${isPortrait?'세로':'가로'}.png`);else message('이미지 저장에 실패했어요. 다시 시도해 주세요.');},'image/png');
    currentAction = previousAction;
    render(performance.now());
  });
  // Start with an empty, inviting workspace so the learner experiences connecting blocks.
  selectTheme('hello');
})();
