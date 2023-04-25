import { QuerierParameters } from "@/Options";
import { QueryData } from "./Queriers";
type QueryServerResults = QueryData & {
    ip: string;
    type: "Java" | "Bedrock" | "Unknown" | "Crossplay";
};
declare function queryServer(...args: QuerierParameters): Promise<QueryServerResults>;
export default queryServer;
