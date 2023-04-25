import { QuerierParameters  } from "@/Options";

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
}

export type Querier = {
  async (...args: QuerierParameters): Promise<QueryData>;
}
