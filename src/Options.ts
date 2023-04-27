import { z } from "zod";

type QueryOptions = "no" | "infer" | "yes";

export interface IOptions {
  /**
   * Timeout for connection queries in millisec.
   *
   * Min: `0`
   *
   * Default: `10_000`
   */
  timeout?: number;

  /**
   * Port number to query the target server at. If omitted or
   * `null`, the port will be automatically inferred by the
   * queriers.
   *
   * Min: `1`, max: `65535`
   *
   * Default: `null`
   */
  port?: number | null;

  /**
   * Behavior for querying via the Query protocol.
   * `"infer"` automatically determines whether to use this
   * method and at which ports to do so based on the `port`
   * option.
   *
   * The query protocol is typically available on 25575, as
   * well as Java and Bedrock ports.
   *
   * Default: `"infer"`
   */
  queryQuery?: QueryOptions;
  /**
   * Behavior for querying via the Bedrock protocol.
   * `"infer"` automatically determines whether to use this
   * method and at which ports to do so based on the `port`
   * option.
   *
   * The Bedrock protocol typically uses ports 19132.
   *
   * Default: `"infer"`
   */
  queryBedrock?: QueryOptions;
  /**
   * Behavior for querying via the Java protocol.
   * `"infer"` automatically determines whether to use this
   * method and at which ports to do so based on the `port`
   * option.
   *
   * Java servers typically use port 25565.
   *
   * Default: `"infer"`
   */
  queryJava?: QueryOptions;

  /**
   * Whether to try all available methods, or to return data
   * on first response.
   *
   * Default: `false`
   */
  returnOnFirst?: boolean;

  /**
   * Whether to return `"Crossplay"` as the server type when
   * both Bedrock and Java responses are received (e.g. [GeyserMC](geysermc.org)).
   *
   * If `false`, the first response (based on latency) will take
   * precedence.
   *
   * Default: `true`
   */
  coalesceCrossplay?: boolean;
};

export class Options implements Required<IOptions> {
  /* Defaults */
  static readonly DEFAULT_TIMEOUT = 10_000;

  static readonly DEFAULT_PORT = null;

  static readonly DEFAULT_QUERY_QUERY   = "infer";
  static readonly DEFAULT_QUERY_BEDROCK = "infer";
  static readonly DEFAULT_QUERY_JAVA    = "infer";

  static readonly DEFAULT_RETURN_ON_FIRST = false;

  static readonly DEFAULT_COALESCE_CROSSPLAY = true;

  /* Implementations */
  public readonly timeout;

  public readonly port;

  public readonly queryQuery;
  public readonly queryBedrock;
  public readonly queryJava;

  public readonly returnOnFirst;
  public readonly coalesceCrossplay;

  public readonly host: string;

  constructor(rawHost: string, options?: IOptions) {
    this.timeout       = Options.processTimeout(options?.timeout);

    const overridePort = Options.processPort(options?.port);

    this.queryQuery    = Options.processQueryQuery(options?.queryQuery);
    this.queryBedrock  = Options.processQueryBedrock(options?.queryBedrock);
    this.queryJava     = Options.processQueryJava(options?.queryJava);

    const [host, port] = Options.processHost(rawHost);

    this.host = host;
    this.port = overridePort ?? port;

    this.returnOnFirst = options?.returnOnFirst ?? Options.DEFAULT_RETURN_ON_FIRST;

    this.coalesceCrossplay = options?.coalesceCrossplay ?? Options.DEFAULT_COALESCE_CROSSPLAY;
  }

  static #timeoutSchema = z.number().int().gte(0);
  static processTimeout(timeout?: number): number {
    const parsed = this.#timeoutSchema.safeParse(timeout);

    if (parsed.success)
      return parsed.data;

    if (typeof timeout === "undefined")
      return Options.DEFAULT_TIMEOUT;

    throw new Error("Invalid timeout length -- must be a whole number");
  }

  static #portSchema = z.number().int().gt(0).lte(65535);
  static processPort(port?: number | null): number | null {
    const parsed = this.#portSchema.safeParse(port)

    if (parsed.success)
      return parsed.data;

    if (port === null || typeof port === "undefined")
      return Options.DEFAULT_PORT;

    throw new Error("Invalid port number -- must be an integer between 1 and 65535");
  }

  static processQueryQuery(queryQuery?: QueryOptions): QueryOptions {
    return queryQuery || Options.DEFAULT_QUERY_QUERY;
  }

  static processQueryBedrock(queryBedrock?: QueryOptions): QueryOptions {
    return queryBedrock || Options.DEFAULT_QUERY_BEDROCK;
  }

  static processQueryJava(queryJava?: QueryOptions): QueryOptions {
    return queryJava || Options.DEFAULT_QUERY_JAVA;
  }

  static processHost(host: string): readonly [host: string, port: number | null] {
    /* Deconstructing host:port format */
    const [hostname, port] = host.split(':', 2);

    const labels = hostname.split('.').filter(label => label.length > 0);

    const portAsNumber = Number.parseInt(port);
    const processedPort = port
      ? Options.processPort(portAsNumber)
      : Options.DEFAULT_PORT;

    /* Tests */
    const isValidFormat = /^[a-zA-Z0-9\-_\.]{1,253}$/g.test(hostname);
    const isValidHostname =
      labels.every(label => {
        return /^[a-zA-Z0-9\-_]{1,63}$/g.test(label) &&
        !(
          label.startsWith('-') ||
          label.endsWith  ('-')
        )
      });

    const isValidPort = !port || portAsNumber === processedPort;

    if (!isValidFormat || !isValidHostname || !isValidPort)
      throw new Error("Invalid host format");

    return [hostname, processedPort] as const;
  }
}

export type QuerierParameters = ConstructorParameters<typeof Options>;
