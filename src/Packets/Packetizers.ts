import { BasePacketizer } from "../PacketTool";
import { DataType, SchemaMap } from "@/PacketTool/DataType";

import varint from "varint";

const VARINT_FLAG = 1 << 7;

export class JavaPacketizer implements BasePacketizer {

  constructor(
    private packetID: number,
    /** zlib compression */
    private compressed?: boolean
  ) {
    if (this.compressed)
      throw new Error("Not implemented");
  }

  public packetize(bufs: Buffer[]): Buffer {
    const packetID = varint.encode<Buffer>(this.packetID);
    const length = packetID.length + bufs.reduce(
      (prev, curr) => prev + curr.length,
      0
    );

    return Buffer.concat([
      varint.encode(length),
      packetID,
      ...bufs
    ]);
  }

  public depacketize(buf: Buffer): Buffer {
    let offset = 0;

    const seekVarInt = () => {
      do offset++; while (buf[offset - 1] & VARINT_FLAG);
    };

    const packetID = varint.decode(buf, offset);
    seekVarInt();
    const length = varint.decode(buf, offset);
    seekVarInt();

    if (packetID !== this.packetID)
      throw new Error(
        `Decoded packetID ${packetID} does not mach expected packetID ` +
        `${this.packetID}`
      );

    return buf.subarray(offset);
  }
}

export class BedrockPacketizer implements BasePacketizer {
  static PacketIDSchema = SchemaMap[DataType.uint8];

  private packetID: number;

  constructor(packetID: number) {
    this.packetID = BedrockPacketizer.PacketIDSchema.parse(packetID);
  }

  public packetize(bufs: Buffer[]): Buffer {
    return Buffer.concat([
      Buffer.from([this.packetID]),
      ...bufs
    ]);
  }

  public depacketize(buf: Buffer): Buffer {
    const packetID = buf.readUint8();

    if (packetID !== this.packetID)
      throw new Error(
        `Decoded packetID ${packetID} does not match expected packetID ` +
        `${this.packetID}`
      );

    return buf.subarray(1);
  }
}

export class QueryPacketizer implements BasePacketizer {
  static QUERY_MAGIC = Buffer.from("fefd", "hex");
  static TypeSchema = SchemaMap[DataType.uint8];

  private type: number;

  constructor(type: number) {
    this.type = QueryPacketizer.TypeSchema.parse(type);
  }

  public packetize(bufs: Buffer[]): Buffer {
    return Buffer.concat([
      QueryPacketizer.QUERY_MAGIC,
      Buffer.from([this.type]),
      ...bufs
    ]);
  }

  public depacketize(buf: Buffer): Buffer {
    const type = buf.readUInt8();

    if (type !== this.type)
      throw new Error(
        `Decoded packet type ${type} does not match expected ` +
        `packet type ${this.type}`
      );

     return buf.subarray(1);
  }
}
