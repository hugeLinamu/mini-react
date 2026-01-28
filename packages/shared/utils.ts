/**
 * 获取当前时间
 */
let getCurrentTime: () => number | DOMHighResTimeStamp;
const hasPerformanceNow =
  typeof performance === "object" && typeof performance.now === "function";

if (hasPerformanceNow) {
  const localPerformance = performance;
  getCurrentTime = () => localPerformance.now();
} else {
  const localDate = Date;
  const initialTime = localDate.now();
  getCurrentTime = () => localDate.now() - initialTime;
}

export function isArray(sth: any) {
  return Array.isArray(sth);
}

export function isNum(sth: any) {
  return typeof sth === "number";
}

export function isObject(sth: any) {
  return typeof sth === "object";
}

export function isFn(sth: any) {
  return typeof sth === "function";
}

export function isStr(sth: any) {
  return typeof sth === "string";
}

export { getCurrentTime };
