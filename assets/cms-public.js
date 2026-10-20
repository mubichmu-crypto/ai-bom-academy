import {SITE_ID,FIREBASE_CONFIG} from './firebase-config.js';
import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import {getFirestore,doc,getDoc,collection,getDocs,query,where} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import {renderContent} from './cms-render.js';
if(FIREBASE_CONFIG.enabled && !FIREBASE_CONFIG.apiKey.startsWith('FIREBASE_')){
 const app=getApps().find(app=>app.name==='cms-'+SITE_ID)||initializeApp(FIREBASE_CONFIG,'cms-'+SITE_ID),db=getFirestore(app);
 async function render(){try{
  const [settings,items]=await Promise.all([getDoc(doc(db,'sites',SITE_ID,'settings','public')),getDocs(query(collection(db,'sites',SITE_ID,'items'),where('published','==',true)))]);
  renderContent(document,SITE_ID,settings.exists()?settings.data():{},items.docs.map(d=>d.data()));
 }catch{console.warn('추가 콘텐츠를 불러오지 못했습니다. 기존 페이지는 유지됩니다.');}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
}
