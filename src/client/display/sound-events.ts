import type {DisplayState,RoundKind} from '../shared/protocol.js';
export type SoundCue=`${RoundKind}-intro`|`${RoundKind}-published`|'quote-pop';
export function createSoundEvents(){
  let run:number|null=null,intro:string|null=null,publication:number|null=null,round:number|null=null,slot=-1,wasAllowed=false;
  return{update(state:DisplayState,kind:RoundKind|null,wallNow:number,allowed:boolean):SoundCue[]{
    const introKey=kind?`${kind}:${state.deadline}:${state.news?.id??''}`:null,pub=state.publication?.revision??null,r=state.roundPublication??(state.publication&&['normal','crash','recovery'].includes(state.publication.kind)?state.publication:undefined),rkey=r?.revision??null;
    const interval=state.parameters.priceRevealMs??500,index=r?Math.max(0,Math.min(state.drinks.length-1,interval===0?state.drinks.length-1:Math.floor((wallNow-r.wallAt)/interval))):-1;
    if(run!==state.runId||(!wasAllowed&&allowed)){run=state.runId;intro=introKey;publication=pub;round=rkey;slot=index;wasAllowed=allowed;return[];}
    const events:SoundCue[]=[];
    if(introKey&&introKey!==intro){intro=introKey;if(kind)events.push(`${kind}-intro`);}
    if(pub!==publication){publication=pub;const p=state.publication;if(p&&p.kind!=='correction')events.push(`${p.kind}-published`);}
    if(rkey!==round){round=rkey;slot=index;}else if(index>slot){slot=index;if(kind===null&&state.viewMode!=='ticker')events.push('quote-pop');}
    wasAllowed=allowed;return allowed?events:[];
  }};
}
