export function createFreshness(timeoutMs=15_000) {
  let receivedAt=-Infinity;
  return {received(now:number){receivedAt=now;},isFresh(now:number){return now-receivedAt <= timeoutMs;},reset(){receivedAt=-Infinity;}};
}
