import PacketTool, { DataType } from "@/PacketTool";
import { RawPacketizer } from "@/Packets/Packetizers";

describe("PacketTool", () => {
  it("encodes Bytes correctly", () => {
    const pt = new PacketTool(
      [["bytes", DataType.Bytes]],
      RawPacketizer
    );

    const serialized = pt.serialize({ bytes: Buffer.from([0xde, 0xad, 0xbe, 0xef]) });

    expect(serialized).toStrictEqual(Buffer.from([0xde, 0xad, 0xbe, 0xef]));
  });

  test.todo("better coverage");
});
