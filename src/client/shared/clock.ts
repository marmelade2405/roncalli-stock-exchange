export function createClock() {
  let serverAnchor = 0; let performanceAnchor = 0;
  return {
    sync(serverNow: number, requestStart: number, responseEnd: number) { serverAnchor = serverNow; performanceAnchor = (requestStart + responseEnd) / 2; },
    now(performanceNow: number): number { return Math.floor(serverAnchor + performanceNow - performanceAnchor); },
  };
}
