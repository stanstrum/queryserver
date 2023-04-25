type QueryOptions = "no" | "infer" | "yes";
export interface IOptions {
    timeout?: number;
    port?: number | null;
    queryQuery?: QueryOptions;
    queryBedrock?: QueryOptions;
    queryJava?: QueryOptions;
    returnOnFirst?: boolean;
    coalesceCrossplay?: boolean;
}
export declare class Options implements Required<IOptions> {
    static readonly DEFAULT_TIMEOUT = 10000;
    static readonly DEFAULT_PORT: null;
    static readonly DEFAULT_QUERY_QUERY = "infer";
    static readonly DEFAULT_QUERY_BEDROCK = "infer";
    static readonly DEFAULT_QUERY_JAVA = "infer";
    static readonly DEFAULT_RETURN_ON_FIRST = false;
    static readonly DEFAULT_COALESCE_CROSSPLAY = true;
    readonly timeout: number;
    readonly port: number | null;
    readonly queryQuery: QueryOptions;
    readonly queryBedrock: QueryOptions;
    readonly queryJava: QueryOptions;
    readonly returnOnFirst: boolean;
    readonly coalesceCrossplay: boolean;
    readonly host: string;
    constructor(rawHost: string, options?: IOptions);
    static processTimeout(timeout?: number): number;
    static processPort(port?: number | null): number | null;
    static processQueryQuery(queryQuery?: QueryOptions): QueryOptions;
    static processQueryBedrock(queryBedrock?: QueryOptions): QueryOptions;
    static processQueryJava(queryJava?: QueryOptions): QueryOptions;
    static processHost(host: string): readonly [string, number | null];
}
export type QuerierParameters = ConstructorParameters<typeof Options>;
export {};
