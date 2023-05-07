import type { Querier, QueryData } from ".";

import net from "net";
import varint from "varint";

import { Java } from "@/Packets";

// Only included for the JSDoc @link to render correctlly.
import type PacketTool from "@/PacketTool";
import { ConnectionTimeout, pipe, optionalIndex } from "@/helpers";

import crypto from "node:crypto";

import z from "zod";

import JavaProtocols from "@/Protocols/java.json"

// zod has problems with infinitely recursive types and needs a type helper
type DescriptionSchema = {
  text: string,
  color?: string,
  extra?: DescriptionSchema[]
};
const DescriptionSchema: z.ZodType<DescriptionSchema> = z.object({
  text: z.string(),
  color: z.string().optional(),
  extra: z.lazy(() => z.array(DescriptionSchema).optional())
});

const JsonResponseSchema = z.object({
  version: z.object({
    name: z.string(),
    protocol: z.number().nonnegative().int(),
  }),
  enforcesSecureChat: z.optional(z.boolean()),
  description: z.union([
    DescriptionSchema,
    z.string().nonempty()
  ]),
  players: z.object({
    max: z.number().nonnegative().int(),
    online: z.number().nonnegative(),
    sample: z.array(z.object({
      name: z.string().nonempty(),
      id: z.string().nonempty()
    })).optional()
  }),
  favicon: z.string().nonempty().optional()
});

function JsonResponseToMOTD(obj: DescriptionSchema) {
  let str = "";

  for (const extraObj of obj.extra || []) {
    str += JsonResponseToMOTD(extraObj);
  }

  str += obj.text;

  return str;
}

enum JavaChunkedState {
  Start,
  IncompleteSize,
  WaitingForData,
};

const VARINT_FLAG = 1 << 7;

/** This is a helper class to accomodate for how the TCP protocol
 * splits up the packet into chunks.  Using the leading size varint
 * in the metadata of a Java packet, we are able to detect when the
 * packet is finished.  Afterwards, it is safe to decode using
 * {@link PacketTool}.
 */
class JavaChunkedReader {
  private state = JavaChunkedState.Start;

  private bufs: Buffer[] = [];
  private size?: number;

  private finished = false;

  constructor(private socket: net.Socket, private ct: ConnectionTimeout) {}

  public recv(buf: Buffer): boolean {
    this.bufs.push(buf);

    switch (this.state) {
      case JavaChunkedState.Start:
        try {
          /** length is amount of bytes + 1 */
          this.size = varint.decode(buf) + 1;

          /**
           * I can't rely on varint's `.decode.bytes` for varint decode
           * length as it breaks queryJava in concurrency.
           */
          let ctr = 0;
          for (; buf[ctr] & VARINT_FLAG; ctr++);

          this.size += ctr;

          this.state = JavaChunkedState.WaitingForData;
        } catch {
          this.state = JavaChunkedState.IncompleteSize;
        }

        break;

      case JavaChunkedState.IncompleteSize:
        throw new Error("Not implemented");

      case JavaChunkedState.WaitingForData: break;
    }

    const bufsSize = this.bufs.reduce((prev, curr) => prev + curr.length, 0);

    if (this.size! < bufsSize)
      throw new Error(
        "Received more bytes than expected:\n" +
        `Expected: ${this.size}\n` +
        `Received: ${bufsSize}`
      );

    if (this.size === bufsSize)
      this.finished = true;

    return this.finished;
  }

  public reset() {
    if (!this.finished)
      throw new Error("Cannot reset JavaChunkedReader: not finished yet");

    this.state = JavaChunkedState.Start;
    this.bufs = [];

    delete this.size;

    this.finished = false;
  }

  public getPacket(): Promise<Buffer> {
   let recvHandler: (data: Buffer) => void;

    return new Promise<Buffer>((resolve, reject) => {
      recvHandler = data => {
        if (this.recv(data))
          resolve(Buffer.concat(this.bufs));
      }

      this.socket.on("data", recvHandler);
      this.socket.on("end", () => { reject(new Error("Socket closed")) });

      this.ct.onTimeout(
        () => {
          this.finished = true;

          reject(new Error("Connection timed out"))
        }
      );
    }).finally(() => {
      this.socket.removeListener("data", recvHandler!);

      this.reset();
    });
  }
}

const ConnectionError = new Error("Connection timed out");

const JavaQuerier = <Querier>(
  async (options, ct) => {
    const host = options.host;
    const port = options.port || 25565;

    const socket = net.createConnection({ host, port });

    const jcr = new JavaChunkedReader(socket, ct);

    await new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);

      ct.onTimeout(() => {
        socket.end();

        reject(new Error("Connection timed out"));
      });
    });

    socket.write(
      Java.Handshake.serialize({
        protocol: Java.PROTOCOL_NUMBER,
        serverAddress: host,
        serverPort: port,
        nextState: Java.State.Status
      })
    );

    socket.write(
      Java.StatusRequest.serialize({})
    );

    const parsed = await pipe()
      ($ => jcr.getPacket())
      .await($ => Java.StatusResponse.deserialize($))
      .await($ => JSON.parse($.jsonResponse))
      .await($ => JsonResponseSchema.parse($))
      .get();

    const payload = crypto.randomBytes(8);

    const latencyStart = Date.now();

    socket.write(Java.PingRequest.serialize({ payload }));

    /** @fixme this is bad */
    const pingResponseBuf = await jcr.getPacket();
    const latency = Date.now() - latencyStart;

    const pingResponse = Java.PingResponse.deserialize(
      pingResponseBuf, {
        payload: { length: 8 }
      }
    );

    if (payload.compare(pingResponse.payload) !== 0)
      throw new Error("PingRequest payload does not match PongResponse payload");

    let motd: string;
    if (typeof parsed.description === "string") {
      motd = parsed.description;
    } else {
      motd = JsonResponseToMOTD(parsed.description);
    }

    return {
      /** @sponge more badness */
      latency,
      players: {
        max: parsed.players.max,
        online: parsed.players.online,
        list: parsed.players.sample?.map(player => player.name)
      },
      type: "Java",
      version: parsed.version.name,
      motd,

      favicon: parsed.favicon,

      debug: {
        java: true,

        protocol: parsed.version.protocol,

        /** @fixme clean this up */
        protocolVersion:
          optionalIndex(JavaProtocols.postNetty.regular, parsed.version.protocol) ||
          `Java ${parsed.version.name} (${parsed.version.protocol})`,
      }
    } satisfies QueryData;
  }
);

export default JavaQuerier;
