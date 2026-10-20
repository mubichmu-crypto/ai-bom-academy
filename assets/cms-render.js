import {safeLink,safeImage,publicItems} from './cms-domain.js';
export function renderContent(root,siteId,settings={},rows=[]){
 const map=siteId==='aibom'?{title:'.intro h1',subtitle:'.intro .home-promise',cta:'header .contact'}:{title:'[data-cms-title]',subtitle:'[data-cms-subtitle]',cta:'[data-cms-cta]'};
 const sameText=(a,b)=>String(a).replace(/\s+/g,' ').trim()===String(b).replace(/\s+/g,' ').trim();
 for(const key of ['title','subtitle']){const element=root.querySelector(map[key]);if(element&&settings[key]&&!sameText(element.textContent,settings[key]))element.textContent=settings[key];}
 const cta=root.querySelector(map.cta),ctaHref=safeLink(settings.ctaHref);
 if(cta){if(settings.ctaLabel)cta.textContent=settings.ctaLabel;if(ctaHref)cta.setAttribute('href',ctaHref);}
 for(const element of root.querySelectorAll('[data-cms-hours]'))if(settings.hours)element.textContent=settings.hours;
 for(const element of root.querySelectorAll('[data-cms-phone]'))if(settings.contactPhone){element.textContent=settings.contactPhone;if(element.tagName==='A')element.setAttribute('href','tel:'+settings.contactPhone.replace(/[^+\d]/g,''));}
 for(const element of root.querySelectorAll('[data-cms-email]'))if(settings.contactEmail&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contactEmail)){element.textContent=settings.contactEmail;if(element.tagName==='A')element.setAttribute('href','mailto:'+settings.contactEmail);}
 const items=publicItems(rows);let mount=root.querySelector('[data-cms-mount]');
 if(!items.length){mount?.replaceChildren();return;}
 if(!mount){mount=root.createElement('div');mount.setAttribute('data-cms-mount','');const intro=root.querySelector(siteId==='aibom'?'.intro':'.hero');const main=root.querySelector('main');if(intro)intro.insertAdjacentElement('afterend',mount);else if(main)main.prepend(mount);else return;}
 mount.classList.add('aibom-managed');
 const section=root.createElement('section');section.className='aibom-managed-section';const heading=root.createElement('h2');heading.textContent=siteId==='aibom'?'새 소식 · 강의 · 자료':'새로운 메뉴와 소식';section.append(heading);
 const grid=root.createElement('div');grid.className='aibom-managed-grid';const labels={course:'강의',tool:'AI 도구',notice:'공지',work:'작품',menu:'메뉴',photo:'사진',link:'링크'};
 for(const item of items){const href=safeLink(item.href),card=root.createElement(href?'a':'article');card.className='aibom-managed-card';if(href){card.href=href;if(/^https?:/.test(href)){card.target='_blank';card.rel='noopener noreferrer';}}const url=safeImage(item.imageUrl);if(url){const img=root.createElement('img');img.src=url;img.alt='';img.loading='lazy';card.append(img);}const kind=root.createElement('small');kind.textContent=labels[item.type]||'소식';const title=root.createElement('h3');title.textContent=item.title||'';const summary=root.createElement('p');summary.textContent=item.summary||'';card.append(kind,title,summary);grid.append(card);}
 section.append(grid);mount.replaceChildren(section);
}
