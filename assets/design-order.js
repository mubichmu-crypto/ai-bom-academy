(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  function summary(){const service=$('order-service');return `AI봄 스튜디오 디자인 문의\n\n제작물: ${service.options[service.selectedIndex].text}\n사용 목적·행사: ${$('order-event').value.trim()||'상담 후 결정'}\n규격·사용할 곳: ${$('order-size').value.trim()||'상담 후 결정'}\n필요한 날짜: ${$('order-date').value||'상담 후 결정'}\n\n문구·요청사항:\n${$('order-notes').value.trim()||'상담 후 결정'}\n\n확인할 사항: 견적 / 일정 / 수정 횟수 / 제공 파일 / 인쇄·배송 포함 여부`;}
  function update(){const text=summary();$('order-summary').textContent=text;const email=$('email-order');if(email)email.href='mailto:mubich@hanmail.net?subject='+encodeURIComponent('AI봄 스튜디오 디자인 문의')+'&body='+encodeURIComponent(text);}
  function save(text){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='AI봄-디자인-문의서.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  $('order-form').addEventListener('submit',event=>{event.preventDefault();update();$('order-status').textContent='문의 내용을 정리했습니다. 내용을 확인한 뒤 이메일이나 전화로 문의해 주세요.';});
  $('order-form').addEventListener('input',update);
  $('copy-order').addEventListener('click',async()=>{update();try{await navigator.clipboard.writeText(summary());$('order-status').textContent='복사했습니다. 이메일 본문에 붙여 넣어 직접 보내주세요.';}catch{save(summary());$('order-status').textContent='복사가 제한되어 문의서를 파일로 저장했습니다.';}});
  $('save-order').addEventListener('click',()=>{update();save(summary());$('order-status').textContent='문의서 저장을 요청했습니다. 아직 주문이 접수된 것은 아닙니다.';});
  const selected=new URLSearchParams(location.search).get('service');
  if(['banner','invite','thanks','brand','other'].includes(selected))$('order-service').value=selected;
  if(selected==='banner')try{const d=JSON.parse(sessionStorage.getItem('aibom.banner.inquiry'));if(d){$('order-event').value=String(d.title||'').slice(0,100);$('order-size').value=String(d.size||'').slice(0,80);$('order-notes').value=String(d.notes||'').slice(0,1500);sessionStorage.removeItem('aibom.banner.inquiry');}}catch{/* The form is fully usable without session storage. */}
  update();
})();
