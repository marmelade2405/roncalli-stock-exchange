const playing=new WeakMap<HTMLVideoElement,boolean>();
export function syncNewsIntroVideo(container:HTMLElement,elapsedMs:number,introMs:number,visible:boolean,paused:boolean):void{
  const video=container.querySelector<HTMLVideoElement>('.news-intro-video');if(!video)return;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldPlay=visible&&!paused&&!reduce&&introMs>0;
  if(!reduce&&video.readyState>=1&&Number.isFinite(video.duration)){
    const target=Math.min(Math.max(0,video.duration-.04),Math.max(0,elapsedMs)/Math.max(1,introMs)*video.duration);
    video.playbackRate=Math.max(.25,Math.min(4,video.duration*1000/Math.max(1,introMs)));
    if(Math.abs(video.currentTime-target)>.3||paused&&Math.abs(video.currentTime-target)>.05)video.currentTime=target;
  }
  if(playing.get(video)!==shouldPlay){playing.set(video,shouldPlay);if(shouldPlay)void video.play().catch(()=>{if(playing.get(video)){playing.set(video,false);container.dataset.videoFailed='true';}});else video.pause();}
}
export function pauseNewsIntroVideo(container:HTMLElement):void{for(const video of container.querySelectorAll<HTMLVideoElement>('.news-intro-video')){video.pause();playing.set(video,false);}}
