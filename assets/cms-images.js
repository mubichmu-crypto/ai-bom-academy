export const MAX_SOURCE_BYTES=5*1024*1024;
export const MAX_WEB_BYTES=220000;
export function validateImageFile(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('JPG, PNG, WebP 이미지 파일을 선택해 주세요.');
 if(file.size>MAX_SOURCE_BYTES)throw Error('5MB 이하 이미지를 선택해 주세요.');
}
export async function prepareImage(file){
 validateImageFile(file);
 const source=URL.createObjectURL(file),image=new Image();
 try{
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('이미지를 읽지 못했습니다. 다른 이미지 파일을 선택해 주세요.'));image.src=source;});
  const width=image.naturalWidth,height=image.naturalHeight;
  if(!width||!height||width*height>40000000)throw Error('이미지의 가로·세로 크기를 줄여 다시 선택해 주세요.');
  const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
  if(!context)throw Error('이 브라우저에서 이미지 처리를 사용할 수 없습니다.');
  let edge=Math.min(1400,Math.max(width,height));const minEdge=Math.min(128,edge);
  while(edge>=minEdge){
   const ratio=Math.min(1,edge/Math.max(width,height));canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));
   context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
   for(const quality of [0.88,0.78,0.68,0.58]){
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
    if(!blob)throw Error('이미지를 변환하지 못했습니다. 다른 이미지를 선택해 주세요.');
    if(blob.size<=MAX_WEB_BYTES){
     return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('이미지 저장 준비에 실패했습니다.'));reader.readAsDataURL(blob);});
    }
    if(blob.type==='image/png')break;
   }
   edge=Math.floor(edge*0.8);
  }
  throw Error('웹용 이미지 크기를 맞추지 못했습니다. 이미지를 조금 줄여 다시 선택해 주세요.');
 }finally{URL.revokeObjectURL(source);}
}
