export function createAdminNavigation(root:HTMLElement){
  const buttons=[...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')],panels=[...document.querySelectorAll<HTMLElement>('[data-admin-panel]')];
  function select(id:string,focus=false){
    if(id==='control')id='settings';
    if(!buttons.some(button=>button.dataset.tab===id))id='news';
    for(const button of buttons){const active=button.dataset.tab===id;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;if(active&&focus)button.focus();}
    for(const panel of panels)panel.hidden=panel.dataset.adminPanel!==id;
    try{localStorage.setItem('market-admin-tab',id);}catch{}
  }
  for(const[ index,button]of buttons.entries()){
    button.onclick=()=>select(button.dataset.tab!);
    button.onkeydown=event=>{const indexNext=event.key==='ArrowRight'?(index+1)%buttons.length:event.key==='ArrowLeft'?(index+buttons.length-1)%buttons.length:event.key==='Home'?0:event.key==='End'?buttons.length-1:null;if(indexNext!==null){event.preventDefault();select(buttons[indexNext].dataset.tab!,true);}};
  }
  let saved='news';try{saved=localStorage.getItem('market-admin-tab')??saved;}catch{}
  select(saved);
  return{select};
}
