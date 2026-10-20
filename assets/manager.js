import { SITE_ID, FIREBASE_CONFIG } from './firebase-config.js';
import {safeLink,safeImage,itemPayload} from './cms-domain.js';
import {prepareImage,validateImageFile} from './cms-images.js';
import { initializeApp,getApps } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { getFirestore, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, collection, serverTimestamp, query, orderBy } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

const $=id=>document.getElementById(id);
const status=message=>{$('status').textContent=message;};
const fields=['title','subtitle','ctaLabel','ctaHref','contactPhone','contactEmail','hours'];
let auth,db,currentItems=[],sessionGeneration=0,currentImageData="",previewObjectUrl="";
const sitePath=(...segments)=>['sites',SITE_ID,...segments];
function messageError(e){return e?.code==='permission-denied'?'관리자 쓰기 권한이 없습니다. Firestore 규칙과 UID를 확인하세요.':(e?.message||String(e));}
async function loadData(){
  const s=await getDoc(doc(db,...sitePath('settings','public')));
  for(const f of fields)$(f).value=(s.exists()?s.data()[f]:'')||'';
  const snapshot=await getDocs(collection(db,...sitePath('items')));
  currentItems=snapshot.docs.map(d=>({id:d.id,...d.data()})).filter(item=>!item.archived).sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0));
  paintItems();
  
}
function paintItems(){const target=$('itemsList');target.replaceChildren();if(!currentItems.length){target.textContent='등록된 콘텐츠가 없습니다.';return;}
 for(const item of currentItems){
  const card=document.createElement('div');card.className='item';
  const media=document.createElement('div');if(safeImage(item.imageData)||safeImage(item.imageUrl)){let img=document.createElement('img');img.src=safeImage(item.imageData)||safeImage(item.imageUrl);img.alt='';media.append(img);}else media.textContent='🗂️';
  const body=document.createElement('div');let title=document.createElement('strong');title.textContent=item.title||'제목 없음';
  let meta=document.createElement('small');meta.textContent=`${item.type||'-'} · ${item.published?'공개':'비공개'} · ${item.sortOrder??100}`;
  let p=document.createElement('p');p.textContent=item.summary||'';
  const actions=document.createElement('div');actions.className='actions';
  const edit=document.createElement('button');edit.className='secondary';edit.textContent='수정';edit.onclick=()=>editItem(item);
  const del=document.createElement('button');del.className='danger';del.textContent='보관';del.onclick=()=>removeItem(item);
  actions.append(edit,del);body.append(title,meta,p,actions);card.append(media,body);target.append(card);
 }
}
function editItem(item){currentImageData=safeImage(item.imageData);showImagePreview(currentImageData||safeImage(item.imageUrl));$('itemId').value=item.id;$('type').value=item.type;$('itemTitle').value=item.title||'';$('itemSummary').value=item.summary||'';$('itemHref').value=item.href||'';$('itemImage').value=item.imageUrl||'';$('itemOrder').value=item.sortOrder??100;$('itemPublished').checked=!!item.published;$('uploadImage').value='';$('itemTitle').focus();}
function resetItem(){currentImageData='';showImagePreview('');$('itemForm').reset();$('itemId').value='';$('itemOrder').value=100;$('itemPublished').checked=true;}
async function removeItem(item){if(!confirm('이 콘텐츠를 비공개 보관할까요? 데이터는 삭제하지 않습니다.'))return;try{await updateDoc(doc(db,...sitePath('items',item.id)),{published:false,archived:true,updatedAt:serverTimestamp()});status('비공개로 보관했습니다.');await loadData();}catch(e){status('보관 실패: '+messageError(e));}}
function showImagePreview(source){if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl='';}const preview=$('imagePreview');if(source){preview.src=source;preview.hidden=false;}else{preview.removeAttribute('src');preview.hidden=true;}}
async function uploadImageIfProvided(){const file=$('uploadImage').files?.[0];if(file){status('이미지를 웹용으로 준비하고 있습니다…');const imageData=await prepareImage(file);if(!safeImage(imageData))throw Error('이미지 형식을 확인해 주세요.');return {imageData,imageUrl:''};}const imageUrl=safeImage($('itemImage').value);return imageUrl?{imageUrl,imageData:''}:{imageUrl:'',imageData:currentImageData};}
$('uploadImage').onchange=()=>{const file=$('uploadImage').files?.[0];if(!file){showImagePreview(currentImageData||safeImage($('itemImage').value));return;}try{validateImageFile(file);$('itemImage').value='';showImagePreview('');previewObjectUrl=URL.createObjectURL(file);$('imagePreview').src=previewObjectUrl;$('imagePreview').hidden=false;status('이미지를 선택했습니다. 콘텐츠 저장을 누르면 등록됩니다.');}catch(e){$('uploadImage').value='';showImagePreview(currentImageData||safeImage($('itemImage').value));status(e.message);}};
$('clearImage').onclick=()=>{currentImageData='';$('itemImage').value='';$('uploadImage').value='';showImagePreview('');status('이미지를 지웠습니다. 콘텐츠 저장을 누르면 반영됩니다.');};
$('itemImage').oninput=()=>{if($('itemImage').value.trim()){currentImageData='';$('uploadImage').value='';showImagePreview(safeImage($('itemImage').value));}};
async function verifiedLogin(user){const generation=++sessionGeneration;$('loginSubmit').hidden=true;$('logout').hidden=false;$('loginPanel').querySelector('h1').textContent='관리자 권한 확인';status('구글 로그인 완료. 관리자 권한을 확인하고 있습니다.');try{await getDoc(doc(db,...sitePath('private','admin-check')));if(generation!==sessionGeneration||auth.currentUser?.uid!==user.uid)return;await loadData();if(generation!==sessionGeneration||auth.currentUser?.uid!==user.uid)return;$('loginPanel').hidden=true;$('appPanel').hidden=false;$('logout').hidden=false;status('관리자 권한과 저장 연결을 확인했습니다.');}catch(e){if(generation!==sessionGeneration||auth.currentUser?.uid!==user.uid)return;$('appPanel').hidden=true;$('loginPanel').hidden=false;status('구글 로그인은 완료됐습니다. '+(user.email||'')+' · '+messageError(e)+' · 관리자 등록용 UID: '+user.uid);}}
if(!FIREBASE_CONFIG.enabled||FIREBASE_CONFIG.apiKey.startsWith('FIREBASE_')){status('연결 준비 중: assets/firebase-config.js에 실제 Firebase 웹 설정을 입력하고 enabled:true로 변경해야 합니다.');$('loginPanel').hidden=false;$('loginForm').querySelector('button').disabled=true;}else{
 $('loginSubmit').disabled=false;const app=getApps().find(app=>app.name==='cms-'+SITE_ID)||initializeApp(FIREBASE_CONFIG,'cms-'+SITE_ID);auth=getAuth(app);db=getFirestore(app);
 onAuthStateChanged(auth,user=>{if(user)verifiedLogin(user);else{sessionGeneration++;currentImageData='';showImagePreview('');$('itemsList').replaceChildren();currentItems=[];$('loginPanel').hidden=false;$('appPanel').hidden=true;$('logout').hidden=true;$('loginSubmit').hidden=false;$('loginPanel').querySelector('h1').textContent='관리자 로그인';status('관리자 계정으로 로그인하세요.');}});
 $('loginForm').onsubmit=async e=>{e.preventDefault();$('loginSubmit').disabled=true;try{await signInWithPopup(auth,new GoogleAuthProvider());}catch(err){status(err?.code==='auth/popup-closed-by-user'?'로그인을 취소했습니다.':'구글 로그인 실패: '+messageError(err));}finally{$('loginSubmit').disabled=false;}};
 $('logout').onclick=()=>signOut(auth);
 $('settingsForm').onsubmit=async e=>{e.preventDefault();try{const payload={updatedAt:serverTimestamp()};for(const f of fields)payload[f]=$(f).value.trim();if(payload.ctaHref&&!safeLink(payload.ctaHref))throw new Error('버튼 연결주소는 http(s) 또는 상대 HTML 경로여야 합니다.');await setDoc(doc(db,...sitePath('settings','public')),payload,{merge:true});status('기본 정보를 저장했습니다.');}catch(err){status('저장 실패: '+messageError(err));}};
 $('itemForm').onsubmit=async e=>{e.preventDefault();const button=e.submitter||$('itemForm').querySelector('[type=submit]');if(button.disabled)return;button.disabled=true;try{status('저장 중…');let payload={...itemPayload({type:$('type').value,title:$('itemTitle').value,summary:$('itemSummary').value,href:$('itemHref').value,imageUrl:$('itemImage').value,sortOrder:$('itemOrder').value,published:$('itemPublished').checked}),updatedAt:serverTimestamp()};Object.assign(payload,await uploadImageIfProvided());if(!payload.title)throw new Error('제목을 입력해 주세요.');if($('itemHref').value&&!payload.href)throw new Error('연결 주소가 올바르지 않습니다.');let id=$('itemId').value;if(id)await setDoc(doc(db,...sitePath('items',id)),payload,{merge:true});else await addDoc(collection(db,...sitePath('items')),payload);resetItem();status('콘텐츠를 저장했습니다.');await loadData();}catch(err){status('콘텐츠 저장 실패: '+messageError(err));}finally{button.disabled=false;}};
 $('resetItem').onclick=resetItem;
}
