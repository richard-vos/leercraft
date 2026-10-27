(() => {
  const empty=()=>({loggedIn:false,wallet:null,owned:[],equipped:{head:null,shirt:null},catalog:[]});
  let state=empty(),revision=0;
  const listeners=new Set();
  async function refresh(){
    const requestRevision=++revision;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch('/api/shop/state.php',{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'},signal:controller.signal});
      const data=await response.json();
      if(!response.ok||!data.ok)throw Error('Je outfit kon niet worden geladen.');
      if(requestRevision===revision){state=data;listeners.forEach(fn=>fn(state));}
      return state;
    }catch(error){
      if(requestRevision===revision){state={...empty(),error:'De winkel of je outfit kon niet worden geladen. Probeer opnieuw.'};listeners.forEach(fn=>fn(state));}
      return state;
    }finally{clearTimeout(timer);}
  }
  window.LeerCraftAvatar={get state(){return state;},refresh,
    clear(){++revision;state={...empty(),catalog:state.catalog};listeners.forEach(fn=>fn(state));},
    subscribe(fn){listeners.add(fn);fn(state);return ()=>listeners.delete(fn);}};
  window.LeerCraftAvatar.ready=refresh();
  window.addEventListener('focus',refresh);
})();
