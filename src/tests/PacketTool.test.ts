import PacketTool, { BasePacketizer, DataType } from "../PacketTool";

class DummyPacketizer implements BasePacketizer {
  packetize(bufs: Buffer[]): Buffer {
    return Buffer.concat(bufs);
  }

  depacketize(buf: Buffer): Buffer {
    return buf;
  }
}

describe("PacketTool", () => {
  it("encodes Bytes correctly", () => {
    const pt = new PacketTool(
      [["bytes", DataType.Bytes]],
      DummyPacketizer
    );

    const serialized = pt.serialize({ bytes: Buffer.from([0xde, 0xad, 0xbe, 0xef]) });

    expect(serialized).toStrictEqual(Buffer.from([0xde, 0xad, 0xbe, 0xef]));
  });
});
