import { Options } from "@/Options";
import { Querier, QueryData } from ".";

const JavaQuerier: Querier = async (options: Options) => {
  const data: QueryData = {
    players: {},
    latency: 0,
    type: "Java"
  };

  return data;
};

export default JavaQuerier;
