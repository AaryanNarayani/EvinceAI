import { filesystemTools } from "./filesystem";
import { webTools } from "./web";
import { shellTools } from "./shell";

//TODO: Add more tools as needed
export const nativeTools = {
  ...filesystemTools,
  ...webTools,
  ...shellTools,
};
