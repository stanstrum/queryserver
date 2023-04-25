import { Options, QuerierParameters } from "@/Options";
import { QueryData } from "./Queriers";

type QueryServerResults = QueryData & {
  ip: string,
  type: "Java" | "Bedrock" | "Unknown" | "Crossplay"
};

async function queryServer(...args: QuerierParameters): Promise<QueryServerResults> {
  const options = new Options(...args);

  console.dir(options);

  throw new Error("Not implemented");
}

export default queryServer;
