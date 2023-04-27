import { Options } from "@/Options";
import { Querier, QueryData } from ".";

const BedrockQuerier: Querier = async (options: Options) => {
  const data: QueryData = {
    players: {},
    latency: 0,
    type: "Bedrock"
  };

  return data;
};

export default BedrockQuerier;