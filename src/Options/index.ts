type QueryOptions = "no" | "infer" | "yes";

export interface IOptions {
  /**
   * Timeout for connection queries in millisec.
   *
   * Default: `10_000`
   */
  timeout?: number;

  /**
   * Port number to query the target server at. If omitted or
   * `null`, the port will be automatically inferred by the
   * queriers.
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
   * The query protocol is typically available on ports
   * 25565 and 25575.
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
   * The Query protocol typically uses ports 25565 and 25575.
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

function validateInteger(
  num: any,
  min?: number, max?: number
): num is number {
  if (!Number.isInteger(num))
    return false;

  if (typeof min !== "undefined" && num < min)
    return false;

  if (typeof max !== "undefined" && num > max)
    return false;

  return true;
}

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

  static processTimeout(timeout?: number) {
    if (validateInteger(timeout, 0))
      return timeout;

    if (typeof timeout === "number")
      throw new Error("Invalid timeout length -- must be a whole number");

    return Options.DEFAULT_TIMEOUT;
  }

  static processPort(port?: number | null) {
    if (validateInteger(port, 1, 65535))
      return port;

    if (typeof port === "number")
      throw new Error("Invalid port number -- must be an integer between 0 and 65535");

    return Options.DEFAULT_PORT;
  }

  static processQueryQuery(queryQuery?: QueryOptions) {
    return queryQuery || Options.DEFAULT_QUERY_QUERY;
  }

  static processQueryBedrock(queryBedrock?: QueryOptions) {
    return queryBedrock || Options.DEFAULT_QUERY_BEDROCK;
  }

  static processQueryJava(queryJava?: QueryOptions) {
    return queryJava || Options.DEFAULT_QUERY_JAVA;
  }

  static processHost(host: string) {
    /* Deconstructing host:port format */
    const [hostname, port, ...rest] = host.split(':');

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

    if (!isValidFormat || !isValidHostname || !isValidPort || rest.length)
      throw new Error("Invalid host format");

    return [hostname, processedPort] as const;
  }
}

export type QuerierParameters = ConstructorParameters<typeof Options>;
