import { Options } from "@/Options";

export type QueryData = {
  motd?: string,
  version?: string,

  players: {
    online?: number,
    max?: number,
    list?: string[],
  },

  favicon?: string,
  latency: number,

  type: "Java" | "Bedrock" | "Unknown"
};

export type Querier = (timeout: Promise<never>, options: Options) => Promise<QueryData>;

export { default as JavaQuerier } from "./Java";
export { default as BedrockQuerier } from "./Bedrock";
export { default as QueryQuerier } from "./Query";
