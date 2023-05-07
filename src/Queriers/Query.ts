import type { Querier, QueryData } from ".";

import dgram from "node:dgram";

import { Query } from "@/Packets";
import { Query as QueryMagic } from "@/Packets/Magic"
import { ConnectionTimeout, UDPResender, pipe, stringArrayToObject, optionalIndex } from "@/helpers";

import { z } from "zod";
import { Options } from "@/Options";

const numericSchema = z.preprocess(
  a => Number.parseInt(a as string),
  z.number().int().nonnegative()
);

const fullStatInfoSchema = z.object({
  hostname: z.string(),
  gametype: z.string(),
  map: z.string(),
  numplayers: numericSchema,
  maxplayers: numericSchema,
  hostport: z.string(),
  hostip: z.string(),
  game_id: z.string(),
  version: z.string(),
  plugins: z.string(),
  whitelist: z.string(),
});

const QueryQuerier = <Querier>(
  async (options: Options, ct: ConnectionTimeout) => {
    const returnObj: Partial<QueryData> = {
      players: {},
      debug: { query: true }
    };

    const host = options.host;
    const port = options.port || 25565;

    const socket = dgram.createSocket("udp4");

    const latencyStart = Date.now();
    await new Promise((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);

      socket.connect(port, host);

      ct.onTimeout(() => {
        socket.close();

        reject(new Error("Connection timed out"))
      });
    });
    returnObj.latency = Date.now() - latencyStart;

    const resender = new UDPResender(socket, ct);

    const sessionID = (Math.random() * 2 ** 32) & 0x0F0F0F0F;

    const challenge = await pipe()
      ($ => Query.HandshakeRequest.serialize({ sessionID }))
      ($ => resender.sendUntilReceive($))
      .await($ => Query.HandshakeResponse.deserialize($))
      /** @todo fix FormatToDeserializerOptions' brokenness */
      .await($ => Number.parseInt($.challenge as string))
      .get();

    /**
     * @todo fix FormatToObject's new issue with unionizing all member
     * types for some reason (hence need for `as string`)
     */
    const responseBuf = await pipe()
      ($ => Query.BasicStatRequest.serialize({ sessionID, challenge }))
      ($ => resender.sendUntilReceive($))
      .get();

    try {
      const basicResponse = Query.BasicStatResponse.deserialize(responseBuf);

      /** @sponge FormatToObject */
      returnObj.motd = basicResponse.motd as string;
      returnObj.players = {
        online: Number.parseInt(basicResponse.online as string),
        max: Number.parseInt(basicResponse.max as string)
      };

      returnObj.type = "Unknown";
    } catch (e) {
      const {
        padding1, padding2,
        info, players,
      } = Query.FullStatResponse.deserialize(
        responseBuf, {
          padding1: { length: QueryMagic.SPLITNUM.length },
          padding2: { length: QueryMagic.PLAYERS_.length },
        }
      );

      if (
        (padding1 as Buffer).compare(QueryMagic.SPLITNUM) !== 0 ||
        (padding2 as Buffer).compare(QueryMagic.PLAYERS_) !== 0
      ) throw new Error("Splitnum/Players_ padding doesn't match");

      /** @sponge FormatToObject */
      const stats = pipe(<string[]>info)
        ($ => stringArrayToObject($))
        ($ => fullStatInfoSchema.parse($))
        .get();

      returnObj.motd = stats.hostname;
      returnObj.players = {
        online: stats.numplayers,
        max: stats.maxplayers,
        /** @sponge FormatToObject */
        list: players as string[],
      };
      returnObj.version = stats.version;
      returnObj.type = optionalIndex({
        "MINECRAFT": "Java",
        "MINECRAFTPE": "Bedrock",
      } as const, stats.game_id) || "Unknown";
    }

    return returnObj;
  }
);

export default QueryQuerier;
