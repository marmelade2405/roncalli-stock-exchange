import {test,expect} from './fixtures.js';
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('market-sounds','off'));});
import type {Page} from '@playwright/test';

type NewsSource={duration:number;rate:number;offset:number;stopped:boolean;peak:number};
type AudioProbe={newsSources:NewsSource[];decodedNews:number};
const probe=(page:Page)=>page.evaluate(()=>(window as unknown as AudioProbe).newsSources);

async function observeOriginalAudio(page:Page){
  await page.addInitScript(()=>{
    const observations:NewsSource[]=[];
    Object.assign(window,{newsSources:observations,decodedNews:0});
    const originalDecode=BaseAudioContext.prototype.decodeAudioData;
    BaseAudioContext.prototype.decodeAudioData=function(...args){
      return originalDecode.apply(this,args).then(buffer=>{
        if(buffer.duration>9&&buffer.duration<9.3)(window as unknown as AudioProbe).decodedNews++;
        return buffer;
      });
    };
    const originalStart=AudioBufferSourceNode.prototype.start;
    const originalStop=AudioBufferSourceNode.prototype.stop;
    const sources=new WeakMap<AudioBufferSourceNode,NewsSource>();
    AudioBufferSourceNode.prototype.start=function(...args){
      if(this.buffer){
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
}

test('original_news_audio_decodes_real_media_and_resumes_only_the_remaining_intro',async({page,testApp})=>{
  await observeOriginalAudio(page);await testApp.barList();await page.goto('/admin');
  await page.getByLabel('Passwort').fill(testApp.password);await page.getByRole('button',{name:'Anmelden',exact:true}).click();
  await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();
  await page.getByTestId('parameter-newsMs').fill('30');await page.getByTestId('parameter-newsIntroMs').fill('10');
  await page.getByTestId('settings-save').click();await expect(page.locator('#settings-note')).toContainText('Vor dem');
  await page.getByRole('tab',{name:'Steuerung',exact:true}).click();await page.getByTestId('sound-toggle').click();
  await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed','true');
  await expect.poll(()=>page.evaluate(()=>(window as unknown as AudioProbe).decodedNews)).toBe(1);
  await testApp.externalCommand({type:'simulation',enabled:true,speed:1});
  await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'special',specialId:'bier-down'});
  await expect.poll(async()=>(await probe(page)).length).toBe(1);
  const first=(await probe(page))[0]!;expect(first.duration).toBeGreaterThan(9);expect(first.duration).toBeLessThan(9.3);
  expect(first.peak).toBeGreaterThan(.1);expect(first.rate).toBeCloseTo(first.duration/10,4);expect(first.offset).toBeCloseTo(0,1);
  await testApp.advanceTo(3000);expect((await probe(page)).length).toBe(1);
  await testApp.externalCommand({type:'pause',paused:true});await expect.poll(async()=>(await probe(page))[0]!.stopped).toBe(true);
  await testApp.advanceTo(8000);expect((await probe(page)).length).toBe(1);
  await testApp.externalCommand({type:'pause',paused:false});await expect.poll(async()=>(await probe(page)).length).toBe(2);
  expect((await probe(page))[1]!.offset).toBeCloseTo(first.duration*.3,1);
  await page.getByTestId('sound-toggle').click();await expect.poll(async()=>(await probe(page))[1]!.stopped).toBe(true);
  await page.getByTestId('sound-toggle').click();await testApp.advanceTo(9000);expect((await probe(page)).length).toBe(2);
  await testApp.advanceTo(35000);await testApp.externalCommand({type:'special',specialId:'bier-up'});
  await expect.poll(async()=>(await probe(page)).length).toBe(3);
  await testApp.advanceTo(45000);await expect.poll(async()=>(await probe(page))[2]!.stopped).toBe(true);
  await page.goto('/display');await testApp.advanceTo(66000);await testApp.externalCommand({type:'special',specialId:'wein-up'});
  expect(await probe(page)).toEqual([]);await expect(page.getByTestId('sound-toggle')).toHaveCount(0);
});

test('failed_original_news_download_keeps_other_sounds_available_without_page_errors',async({page,testApp})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/media/breaking-news-intro.m4a',route=>route.fulfill({status:404,body:'missing'}));
  await testApp.barList();await page.goto('/admin');await page.getByLabel('Passwort').fill(testApp.password);
  await page.getByRole('button',{name:'Anmelden',exact:true}).click();await page.getByRole('tab',{name:'Steuerung',exact:true}).click();
  await page.getByTestId('sound-toggle').click();await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed','true');
  await testApp.externalCommand({type:'start'});await testApp.externalCommand({type:'special',specialId:'bier-down'});
  await testApp.advanceTo(5000);await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed','true');expect(errors).toEqual([]);
});
