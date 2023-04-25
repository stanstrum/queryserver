import PacketTool, { BasePacketizer } from "."
import { DataType } from "./DataType";

class DummyPacketizer implements BasePacketizer {
  constructor() {}

  packetize(bufs: Buffer[]): Buffer {
    return Buffer.concat(bufs);
  }

  depacketize(buf: Buffer): Buffer {
    return buf;
  }
}

const dummyPacketizer = new DummyPacketizer();

describe("PacketTool", () => {
  it("encodes Bytes correctly", () => {
    const pt = new PacketTool(
      [["bytes", DataType.Bytes]],
      dummyPacketizer
    );

    pt.serialize({ bytes: })
  });
});
