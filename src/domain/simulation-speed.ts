export const MIN_SIMULATION_SPEED=1;
export const MAX_SIMULATION_SPEED=120;
export function isSimulationSpeed(value:unknown):value is number{return Number.isSafeInteger(value)&&Number(value)>=MIN_SIMULATION_SPEED&&Number(value)<=MAX_SIMULATION_SPEED;}
