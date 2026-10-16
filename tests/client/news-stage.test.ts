import {expect,it} from 'vitest';
import {newsStage} from '../../src/client/display/breaking-news.js';
it('intro_is_five_seconds_then_message_holds_until_publication',()=>{expect(newsStage(20000,5000,20000)).toBe('intro');expect(newsStage(20000,5000,15001)).toBe('intro');expect(newsStage(20000,5000,15000)).toBe('message');expect(newsStage(20000,5000,1)).toBe('message');expect(newsStage(20000,5000,0)).toBe('finished');});
