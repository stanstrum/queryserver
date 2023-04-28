import type { Options } from "@/Options";
import type{ Querier, QueryData } from ".";

import net from "net";
import varint from "varint";

import { Java } from "@/Packets";

// Only included for the JSDoc @link to render correctll.
import type PacketTool from "@/PacketTool";

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

  private dataPromise;

  constructor(private socket: net.Socket) {
    let recvHandler: (data: Buffer) => void;

    this.dataPromise = new Promise<Buffer>((resolve, reject) => {
      recvHandler = data => {
        if (this.recv(data))
          resolve(Buffer.concat(this.bufs));
      }

      socket.on("data", recvHandler);
      socket.on("end", () => reject());
    }).finally(() => {
      socket.removeListener("data", recvHandler!);
    });
  }

  public recv(data: Buffer): boolean {
    this.bufs.push(data);

    switch (this.state) {
      case JavaChunkedState.Start:
        try {
          this.size = varint.decode(data);

          /**
           * I can't rely on varint's `.decode.bytes` for varint decode
           * length as it breaks queryJava in concurrency.
           */
          let offset = 0;
          for (; data[offset] & VARINT_FLAG; offset++);

          this.size += offset;

          this.state = JavaChunkedState.WaitingForData;
        } catch {
          this.state = JavaChunkedState.IncompleteSize;
        }

        break;

      case JavaChunkedState.IncompleteSize:
        throw new Error("Not implemented");

        break;

      case JavaChunkedState.WaitingForData:
        const bufsSize = this.bufs.reduce((prev, curr) => prev + curr.length, 0);

        if (this.size! > bufsSize)
          throw new Error(
            "Received more bytes than expected:\n" +
            `Expected: ${this.size}\n` +
            `Received: ${bufsSize}`
          );

        if (this.size === bufsSize)
          this.finished = true;

        break;
    }

    return this.finished;
  }

  public getData() {
    return this.dataPromise;
  }
}

const JavaQuerier: Querier = async (
  timeout: Promise<never>,
  options: Options
) => {
  const host = options.host;
  const port = options.port || 25565;

  const socket = net.createConnection({ host, port });

  timeout.finally(() => socket.end());

  await Promise.race([
    new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
    }),
    timeout
  ]);

  socket.write(
    Java.Handshake.serialize({
      protocol: Java.PROTOCOL_NUMBER,
      serverAddress: host,
      serverPort: port,
      nextState: Java.State.Status
    })
  );

  const payload = Buffer.alloc(8);
  crypto.getRandomValues(payload);

  socket.write(
    Java.StatusRequest.serialize({ payload })
  );

  const statusResponseReader = new JavaChunkedReader(socket);
  const statusResponseBuf = await Promise.race([
    statusResponseReader.getData(),
    timeout
  ]);

  const { jsonResponse } = Java.StatusResponse.deserialize(statusResponseBuf);

  console.log(jsonResponse);

  return null as any;
};

export default JavaQuerier;
