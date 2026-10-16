import {expect,it} from 'vitest';
import {createDefaultConfiguration,validateConfiguration} from '../../src/domain/configuration.js';
import {createMarket} from '../../src/domain/market-v2.js';
import {toDisplayState} from '../../src/domain/projections-v2.js';
const rng=()=>.5;
it('news_reveal_settings_are_validated_and_sent_to_displays',()=>{
 const config=createDefaultConfiguration(undefined,rng);
 Object.assign(config.parameters,{newsTextRevealMs:6000,newsQuoteRevealMs:7500});
 expect(()=>validateConfiguration(config)).not.toThrow();
 expect(toDisplayState(createMarket(config,0,rng)).parameters).toMatchObject({newsTextRevealMs:6000,newsQuoteRevealMs:7500});
});
it('legacy_markets_receive_default_reveal_timings_and_invalid_durations_are_rejected',()=>{
 const legacy=createDefaultConfiguration(undefined,rng);
 delete legacy.parameters.newsTextRevealMs;delete legacy.parameters.newsQuoteRevealMs;
 expect(toDisplayState(createMarket(legacy,0,rng)).parameters).toMatchObject({newsTextRevealMs:3000,newsQuoteRevealMs:4500});
 for(const key of ['newsTextRevealMs','newsQuoteRevealMs']){
  for(const value of [-50,10050,123,NaN]){const config=createDefaultConfiguration(undefined,rng);Object.assign(config.parameters,{[key]:value});expect(()=>validateConfiguration(config)).toThrow();}
  for(const value of [0,50,10000]){const config=createDefaultConfiguration(undefined,rng);Object.assign(config.parameters,{[key]:value});expect(()=>validateConfiguration(config)).not.toThrow();}
 }
});
