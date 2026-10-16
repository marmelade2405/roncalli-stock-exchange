export function createResetDialog(root:HTMLDialogElement,confirm:(kind:'evening'|'factory',revision:number)=>Promise<unknown>){
  root.innerHTML='<h2 id="reset-title"></h2><p id="reset-description"></p><p class="error-text" role="alert" data-testid="reset-error"></p><div class="reset-actions"><button data-testid="reset-close">Abbrechen</button><button class="danger" data-testid="reset-confirm">Zurücksetzen bestätigen</button></div>';
  let kind:'evening'|'factory'='evening',revision=0,latest=0,pending=false;
  const button=root.querySelector<HTMLButtonElement>('[data-testid="reset-confirm"]')!,error=root.querySelector('[data-testid="reset-error"]')!;
  const close=()=>{root.close();};
  root.querySelector<HTMLButtonElement>('[data-testid="reset-close"]')!.onclick=close;
  button.onclick=()=>{if(pending)return;pending=true;button.disabled=true;error.textContent='';void confirm(kind,revision).then(close).catch(e=>{error.textContent=e.message+' Bitte erneut bestätigen.';revision=latest;}).finally(()=>{pending=false;button.disabled=false;});};
  return{open(nextKind:'evening'|'factory',nextRevision:number){kind=nextKind;revision=latest=nextRevision;error.textContent='';root.querySelector('#reset-title')!.textContent=kind==='evening'?'Abend neu starten?':'Werkseinstellungen wiederherstellen?';root.querySelector('#reset-description')!.textContent=kind==='evening'?'Einstellungen bleiben erhalten. Preise, Vorgaben, Verlauf und Ereignisse werden zurückgesetzt. Simulation und laufende Timer enden.':'Getränke, Parameter, Nachrichten und Ansicht werden auf die ursprünglichen Werte gesetzt. Preise, Vorgaben, Verlauf und Timer werden zurückgesetzt.';root.showModal();},close,updateRevision(next:number){latest=next;}};
}
