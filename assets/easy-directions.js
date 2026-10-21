(() => {
  'use strict';
  const $=id=>document.getElementById(id),key='aibom.easy-places.v1';
  let places=[],chosen='';
  try{const saved=JSON.parse(localStorage.getItem(key));if(Array.isArray(saved))places=saved.filter(p=>typeof p?.label==='string'&&typeof p?.query==='string').slice(0,6).map(p=>({label:p.label.slice(0,24),query:p.query.slice(0,120)}));}catch{/* Favorites are optional. */}
  function select(query){
    chosen=query.trim().slice(0,120);if(!chosen)return;
    $('easy-destination').value=chosen;$('chosen-destination').textContent=chosen;
    const params=new URLSearchParams({query:chosen,appname:'https://mubichmu-crypto.github.io/ai-bom-academy/easy-directions.html'});
    const action='search?'+params.toString();
    $('easy-app').href=/Android/i.test(navigator.userAgent)?'intent://'+action+'#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;end':'nmap://'+action;
    $('easy-web').href='https://map.naver.com/p/search/'+encodeURIComponent(chosen);
    $('easy-result').hidden=false;$('easy-status').textContent='가실 곳이 맞는지 확인한 뒤 지도 버튼을 눌러주세요.';
    $('easy-result').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  function render(){
    const list=$('easy-favorites');list.replaceChildren();
    if(!places.length){const p=document.createElement('p');p.className='easy-small';p.textContent='아직 보관한 장소가 없어요. 위에서 목적지를 먼저 적어주세요.';list.append(p);return;}
    places.forEach((place,index)=>{const row=document.createElement('div');row.className='easy-favorite-row';const b=document.createElement('button');b.type='button';b.className='easy-secondary';b.textContent=place.label+' →';b.addEventListener('click',()=>select(place.query));const remove=document.createElement('button');remove.type='button';remove.className='easy-remove';remove.textContent='지우기';remove.setAttribute('aria-label',place.label+' 보관 해제');remove.addEventListener('click',()=>{const previous=places.slice();places.splice(index,1);try{localStorage.setItem(key,JSON.stringify(places));render();}catch{places=previous;$('easy-status').textContent='보관 내용을 바꾸지 못했습니다.';}});row.append(b,remove);list.append(row);});
  }
  $('easy-form').addEventListener('submit',event=>{event.preventDefault();select($('easy-destination').value);});
  document.querySelectorAll('[data-easy-place]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.easyPlace)));
  $('save-easy-place').addEventListener('click',()=>{if(!chosen)return;const label=$('easy-label').value.trim()||chosen;const next=places.filter(p=>p.query!==chosen);if(next.length>=6){$('easy-status').textContent='6곳까지 보관할 수 있어요. 필요 없는 장소를 지운 뒤 다시 보관해 주세요.';return;}next.push({label:label.slice(0,24),query:chosen});try{localStorage.setItem(key,JSON.stringify(next));places=next;render();$('easy-status').textContent='이 브라우저에 보관했습니다. 다음에는 아래 큰 버튼을 눌러주세요.';}catch{$('easy-status').textContent='이 브라우저에서는 보관이 제한되어 있어요. 목적지를 적어 이용해 주세요.';}});
  render();
})();
