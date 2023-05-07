import { Options } from "@/Options";
import { ConnectionTimeout } from "@/helpers";

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

  type: "Java" | "Bedrock" | "Unknown",

  debug: {
    java?: boolean,
    bedrock?: boolean,
    query?: boolean,

    protocol?: number,
    protocolVersion?: string,
  },
};

export type Querier = (options: Options, ct: ConnectionTimeout) => Promise<QueryData>;

export { default as JavaQuerier } from "./Java";
export { default as BedrockQuerier } from "./Bedrock";
export { default as QueryQuerier } from "./Query";
