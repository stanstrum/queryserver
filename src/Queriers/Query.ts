import { Options } from "@/Options";
import { Querier, QueryData } from ".";

const QueryQuerier: Querier = async (options: Options) => {
  const data: QueryData = {
    players: {},
    latency: 0,
    type: "Unknown"
  };

  return data;
};

export default QueryQuerier;
