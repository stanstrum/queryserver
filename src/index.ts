import { Options, QuerierParameters } from "@/Options";
import { JavaQuerier, BedrockQuerier, QueryQuerier, QueryData } from "./Queriers";

import { AggregateError, ConnectionTimeout, pipe, variadicMerge } from "./helpers";

import z from "zod";

import util from "node:util";
import dns from "node:dns";

const resolve4 = util.promisify(dns.resolve4);
const resolveSrv = util.promisify(dns.resolveSrv);

const ipSchema = z.string().ip({ version: "v4" });

type QueryInfo = {
  hostname?: string,
  ip: string,

  type: "Java" | "Bedrock" | "Unknown" | "Crossplay",

  debug: {
    srvs?: string[],

    options: Options
  }
};
/**
 * @todo refactor QueryData and QueryInfo to have clearer
 * distinctions -- data vs. info is vague.
 */
type PartialQueryServerResults = QueryInfo & Omit<QueryData, "type">;
/**
 * @todo make this pretty
 */
type QueryServerResults = QueryInfo & Omit<QueryData, "type"> & {
  debug: {
    java: boolean,
    bedrock: boolean,
    query: boolean,
  }
};

function makePromises(options: Options, ct: ConnectionTimeout) {
  const promises: Promise<QueryData>[] = [];

  /** @todo DRY this up */
  if (
    options.queryJava === "yes" || (
      options.queryJava === "infer" && options.port !== 19132
    )
  ) {
    promises.push(
      JavaQuerier({ ...options, port: options.port || 25565 }, ct)
    );
  }

  if (
    options.queryBedrock === "yes" || (
      options.queryBedrock === "infer" && options.port !== 25565
    )
  ) {
    promises.push(
      BedrockQuerier({ ...options, port: options.port || 19132 }, ct)
    );
  }

  if (["yes", "infer"].includes(options.queryQuery)) {
    if (options.port === Options.DEFAULT_PORT) {
      promises.push(
        QueryQuerier({ ...options, port: 19132 }, ct),
        QueryQuerier({ ...options, port: 25565 }, ct)
      );
    } else {
      promises.push(
        QueryQuerier(options, ct)
      );
    }
  }
  // </todo>

  return promises;
}

async function queryserver(...args: QuerierParameters): Promise<QueryServerResults> {
  const options = new Options(...args);
  const ct = new ConnectionTimeout(options.timeout);

  const promises: Promise<QueryData>[] = [];

  const info: Partial<QueryInfo> = { debug: { options } };

  if (ipSchema.safeParse(options.host).success) {
    // options.host is an IPv4 address

    info.ip = options.host;
  } else {
    // options.host is (possibly) a hostname

    const resolved = await resolve4(options.host);
    /** @sponge this is probably redundant */
    if (resolved.length === 0)
      throw new Error("Server has no IP addresses in DNS");

    info.ip = resolved[0];
    info.hostname = options.host;
  }

  srvs: if (info.hostname && options.useSRV) {
    const srvs = await resolveSrv(`_minecraft._tcp.${info.hostname}`).catch(() => {});

    if (!srvs)
      break srvs;

    info.debug!.srvs = [];
    for (const srv of srvs) {
      info.debug!.srvs.push(srv.name);

      promises.push(
        ...makePromises({
          ...options,
          host: srv.name,
          port: srv.port
        }, ct)
      );
    }
  }

  promises.push(...makePromises({ ...options, host: info.ip! }, ct));

  let results: PartialQueryServerResults;
  if (options.returnOnFirst) {
    results = variadicMerge(
      info as QueryInfo,
      await Promise.any(promises)
        .catch(e => {
          e.message = "All queriers rejected";

          throw e;
        })
    );
  } else {
    const querierResults = await Promise.allSettled(promises);

    if (querierResults.every(p => p.status === "rejected")) {
      const errors = (querierResults as PromiseRejectedResult[]).map(p => p.reason);

      throw new AggregateError("All queriers rejected", ...errors);
    }

    const settled = pipe(querierResults)
      ($ => $.filter(p => p.status === "fulfilled"))
      ($ => $ as PromiseFulfilledResult<QueryData>[])
      ($ => $.map(p => p.value))
      .get();

    results = variadicMerge(
      info as QueryInfo,
      ...settled,
    ) satisfies PartialQueryServerResults;

    if (options.coalesceCrossplay) {
      // const seen: string[] = [];

      // let crossplay = false;
      // for (const result of settled) {
      //   if (result.type !== "Unknown" && seen.includes(result.type)) {
      //     crossplay = true;

      //     continue;
      //   }

      //   seen.push(result.type);
      // }

      /**
       * @sponge This shouldn't be written like this, but
       * I thought it was interesting.
       *
       * I will probably rewrite the entire `{@link queryserver}`
       * function body and split the contents up into different
       * constituent parts for cleanliness' sake.
       */
      settled.reduce<string[]>(
        (seen, curr) => {
          work: {
            if (curr.type === "Unknown") break work;

            if (seen.includes(curr.type)) {
              results.type = "Crossplay";

              break work;
            }

            seen.push(curr.type);
          }

          return seen;
        },
        []
      );
    }

    /** @sponge this should also be rewritten */
    results.latency = settled.reduce(
      (prev, curr) => curr.latency < prev
        ? curr.latency
        : prev,
      Infinity
    );
  }

  // options
  if (options.checkBlocked)
    throw new Error("Not implemented");

  if (options.cleanMOTD)
    results.motd = results.motd
      ?.replace(/[§\uFFFD][0-9a-fk-or]/ig, "")
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length)
      .join('\n');

  results.version       ||= "Unknown";
  results.debug.java    ||= false;
  results.debug.bedrock ||= false;
  results.debug.query   ||= false;

  const debugFiller = { debug: { java: false, bedrock: false, query: false } };

  // return
  return variadicMerge(results satisfies PartialQueryServerResults, debugFiller);
}

export default queryserver;
