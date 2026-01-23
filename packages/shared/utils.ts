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

export { getCurrentTime };
