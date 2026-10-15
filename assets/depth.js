/* Pointer-only perspective. No network, sensors, or external libraries. */
(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
 const surfaces=[...document.querySelectorAll('.bom-stage,.practice-card')];
 for(const el of surfaces){
  let frame=0;
  const reset=()=>{cancelAnimationFrame(frame);el.style.removeProperty('--rx');el.style.removeProperty('--ry');};
  el.addEventListener('pointermove',e=>{
   if(reduce.matches||!fine.matches||document.hidden||el.classList.contains('motion-paused')){reset();return;}
   const box=el.getBoundingClientRect(),x=Math.max(-.5,Math.min(.5,(e.clientX-box.left)/box.width-.5)),y=Math.max(-.5,Math.min(.5,(e.clientY-box.top)/box.height-.5));
   cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{el.style.setProperty('--rx',`${-y*7}deg`);el.style.setProperty('--ry',`${x*9}deg`);});
  },{passive:true});
  el.addEventListener('pointerleave',reset);el.addEventListener('focusout',reset);
  reduce.addEventListener('change',reset);fine.addEventListener('change',reset);document.addEventListener('visibilitychange',reset);
  el.querySelector('.stage-motion-toggle')?.addEventListener('click',reset);
 }
})();
