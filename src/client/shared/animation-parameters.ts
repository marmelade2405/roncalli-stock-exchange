import type {DisplayState} from './protocol.js';
export function animationParameters<T extends DisplayState>(state:T):T['parameters']{return{...state.parameters,...state.eventParameters};}
