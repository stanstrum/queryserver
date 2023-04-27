import { BasePacketizer } from "../PacketTool";

export class JavaPacketizer implements BasePacketizer {
  constructor(
    private packetID: number,
    private compressed?: boolean
  ) {}

  packetize(bufs: Buffer[]): Buffer {
    throw new Error("Not implemented");
  }

  depacketize(buf: Buffer): Buffer {
    throw new Error("Not implemented");
  }
}

export class BedrockPacketizer implements BasePacketizer {
  static RAKNET_MAGIC = Buffer.from("00ffff00fefefefefdfdfdfd12345678", "hex");
  constructor(private packetID: number) {}

  packetize(bufs: Buffer[]): Buffer {
    throw new Error("Not implemented");
  }

  depacketize(buf: Buffer): Buffer {
    throw new Error("Not implemented");
  }
}

export class QueryPacketizer implements BasePacketizer {
  static QUERY_MAGIC = Buffer.from("fefd", "hex");
  constructor(private type: number) {}

  packetize(bufs: Buffer[]): Buffer {
    throw new Error("Not implemented");
  }

  depacketize(buf: Buffer): Buffer {
    throw new Error("Not implemented");
  }
}
