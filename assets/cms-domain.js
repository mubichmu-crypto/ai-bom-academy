export function safeLink(value) {
  const text=String(value||'').trim();
  if(!text || /[\u0000-\u0020\\]/.test(text))return '';
  if(text.startsWith('//'))return '';
  if(/^(?:https?):/i.test(text)){
    try{const url=new URL(text);return url.username||url.password?'':url.href;}catch{return '';}
  }
  if(/^[#?]/.test(text))return text;
  if(/^[\w./-]+(?:[?#][^\s]*)?$/.test(text) && !text.split(/[?#]/)[0].split('/').includes('..'))return text;
  return '';
}
export function safeImage(value){
 const text=String(value||'');
 if(text.length<=300000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(text)){
  try{const type=text.slice(11,text.indexOf(';')),bytes=atob(text.slice(text.indexOf(',')+1));
   if(type==='png'&&bytes.startsWith('\x89PNG\r\n\x1a\n'))return text;
   if(type==='jpeg'&&bytes.startsWith('\xff\xd8\xff'))return text;
   if(type==='webp'&&bytes.startsWith('RIFF')&&bytes.slice(8,12)==='WEBP')return text;
  }catch{}return '';
 }
 const url=safeLink(text);return url.startsWith('https://')?url:'';
}
export function itemPayload(values){
 const title=String(values.title||'').trim(),summary=String(values.summary||'').trim(),href=safeLink(values.href),sortOrder=Number(values.sortOrder);
 if(!title||title.length>120)throw Error('제목을 1~120자로 입력해 주세요.');
 if(summary.length>600)throw Error('설명은 600자 이내로 입력해 주세요.');
 if(values.imageUrl&&!safeImage(values.imageUrl))throw Error('이미지 주소를 확인해 주세요.');
 if(values.href&&!href)throw Error('연결 주소를 확인해 주세요.');
 if(!Number.isInteger(sortOrder)||sortOrder<0||sortOrder>9999)throw Error('정렬 순서는 0~9999의 정수로 입력해 주세요.');
 return {type:values.type,title,summary,href,imageUrl:safeImage(values.imageUrl),sortOrder,published:Boolean(values.published)};
}
export function publicItems(rows){return rows.filter(row=>row.published===true&&!row.archived).sort((a,b)=>(a.sortOrder??100)-(b.sortOrder??100));}
