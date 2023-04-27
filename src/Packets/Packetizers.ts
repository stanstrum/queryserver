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
  constructor(private packetID: number) {}

  packetize(bufs: Buffer[]): Buffer {
    throw new Error("Not implemented");
  }

  depacketize(buf: Buffer): Buffer {
    throw new Error("Not implemented");
  }
}

export class QueryPacketizer implements BasePacketizer {
  constructor(private packetID: number) {}

  packetize(bufs: Buffer[]): Buffer {
    throw new Error("Not implemented");
  }

  depacketize(buf: Buffer): Buffer {
    throw new Error("Not implemented");
  }
}
