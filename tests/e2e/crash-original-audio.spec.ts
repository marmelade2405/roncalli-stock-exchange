import {test,expect} from './fixtures.js';
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('market-sounds','off'));});

type CrashSource={duration:number;rate:number;offset:number;stopped:boolean;peak:number};
type CrashProbe={crashSources:CrashSource[];decodedCrash:number};

test('original_crash_audio_uses_real_fifteen_second_media_resumes_and_stops_on_skip',async({page,testApp})=>{
  await page.addInitScript(()=>{
    const observations:CrashSource[]=[];
    Object.assign(window,{crashSources:observations,decodedCrash:0});
    const originalDecode=BaseAudioContext.prototype.decodeAudioData;
    BaseAudioContext.prototype.decodeAudioData=function(...args){
      return originalDecode.apply(this,args).then(buffer=>{
        if(buffer.duration>14&&buffer.duration<16)(window as unknown as CrashProbe).decodedCrash++;
        return buffer;
      });
    };
    const originalStart=AudioBufferSourceNode.prototype.start,originalStop=AudioBufferSourceNode.prototype.stop;
    const sources=new WeakMap<AudioBufferSourceNode,CrashSource>();
    AudioBufferSourceNode.prototype.start=function(...args){
      if(this.buffer&&this.buffer.duration>14&&this.buffer.duration<16){
        const pcm=this.buffer.getChannelData(0);let peak=0;
        for(let i=0;i<pcm.length;i++)peak=Math.max(peak,Math.abs(pcm[i]!));
        const record={duration:this.buffer.duration,rate:this.playbackRate.value,offset:args[1]??0,stopped:false,peak};
        observations.push(record);sources.set(this,record);
      }
      return originalStart.apply(this,args);
    };
    AudioBufferSourceNode.prototype.stop=function(...args){
      const record=sources.get(this);if(record)record.stopped=true;
      return originalStop.apply(this,args);
    };
  });
  const probe=()=>page.evaluate(()=>(window as unknown as CrashProbe).crashSources);
  await testApp.barList();await page.goto('/admin');await page.getByLabel('Passwort').fill(testApp.password);
  await page.getByRole('button',{name:'Anmelden',exact:true}).click();
  await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();
  await page.getByTestId('parameter-crashIntroMs').fill('15');await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByTestId('settings-save').click();
  await expect(page.locator('#settings-note')).toContainText('Vor dem');
  await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByTestId('sound-toggle').click();
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed','true');
  await expect.poll(()=>page.evaluate(()=>(window as unknown as CrashProbe).decodedCrash)).toBe(1);
  await testApp.externalCommand({type:'simulation',enabled:true,speed:1});await testApp.externalCommand({type:'start'});
  await testApp.externalCommand({type:'crash'});await expect.poll(async()=>(await probe()).length).toBe(1);
  const first=(await probe())[0]!;expect(first.duration).toBeGreaterThan(14);expect(first.duration).toBeLessThan(16);
  expect(first.peak).toBeGreaterThan(.1);expect(first.rate).toBeCloseTo(first.duration/15,4);expect(first.offset).toBeCloseTo(0,1);
  await testApp.advanceTo(3000);expect((await probe()).length).toBe(1);
  await testApp.externalCommand({type:'pause',paused:true});await expect.poll(async()=>(await probe())[0]!.stopped).toBe(true);
  await testApp.advanceTo(8000);expect((await probe()).length).toBe(1);
  await testApp.externalCommand({type:'pause',paused:false});await expect.poll(async()=>(await probe()).length).toBe(2);
  expect((await probe())[1]!.offset).toBeCloseTo(first.duration*.2,1);
  await testApp.externalCommand({type:'skip-transition'});await expect.poll(async()=>(await probe())[1]!.stopped).toBe(true);
  await testApp.advanceTo(9000);expect((await probe()).length).toBe(2);
  await page.goto('/display');await expect(page.getByTestId('sound-toggle')).toHaveCount(0);expect(await probe()).toEqual([]);
});
