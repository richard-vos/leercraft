(() => {
  const key='leercraft-world-theme';
  let value='overworld';
  try{if(localStorage.getItem(key)==='end')value='end';}catch{}
  const listeners=new Set();
  function apply(next){
    value=next==='end'?'end':'overworld';document.documentElement.dataset.worldTheme=value;
    listeners.forEach(listener=>listener(value));
  }
  window.LeerCraftTheme={get value(){return value;},set(next){apply(next);try{localStorage.setItem(key,value);}catch{}},
    subscribe(listener){listeners.add(listener);listener(value);return()=>listeners.delete(listener);}};
  window.addEventListener('storage',event=>{if(event.key===key)apply(event.newValue);});
  apply(value);
})();
