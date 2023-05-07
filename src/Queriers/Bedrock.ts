import { UDPResender, optionalIndex } from "@/helpers";
import { Querier } from ".";

import dgram from "node:dgram";

import { Bedrock } from "@/Packets";

import crypto from "node:crypto";

import BedrockProtocols from "@/Protocols/bedrock.json"

const BedrockQuerier = async function(options, ct) {
  const host = options.host;
  const port = options.port || 19132;

  const socket = dgram.createSocket("udp4");

  await new Promise<void>((resolve, reject) => {
    socket.once("connect", () => resolve());

    socket.connect(port, host);

    ct.onTimeout(() => reject(new Error("Connection timed out")));
  });

  ct.onTimeout(() => socket.close());

  const resender = new UDPResender(socket, ct);

  const unconnectedPingBuf = Bedrock.UnconnectedPing.serialize({
    time: BigInt(Date.now()),
    magic: true,
    clientGUID: Buffer.from(crypto.randomBytes(8))
  });

  const start = Date.now();
  const unconnectedPongBuf = await resender.sendUntilReceive(unconnectedPingBuf);
  const latency = Date.now() - start;

  const unconnectedPong = Bedrock.UnconnectedPong.deserialize(
    unconnectedPongBuf,
    { serverGUID: { length: 8 } }
  );

  const [
    edition,
    motd1,
    protocol,
    version,
    online,
    max,
    _serverUniqueID,
    motd2,
    // _gamemode,
    // _gamemodeNumeric,
    // _portIPv4,
    // _portIPv6
    /** @sponge FormatToObject */
  ] = (unconnectedPong.serverID as string).split(';');

  const motd = [motd1, motd2].join('\n');

  return {
    latency,
    players: {
      online: Number.parseInt(online),
      max: Number.parseInt(max)
    },
    type: "Bedrock",
    motd,
    version: version,

    debug: {
      bedrock: true,
      protocol: Number.parseInt(protocol),
      protocolVersion:
        optionalIndex(BedrockProtocols, protocol) ||
        `${edition} ${version} (${protocol})`
    }
  };
} satisfies Querier;

export default BedrockQuerier;
