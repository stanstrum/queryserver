import { DataType, SchemaMap } from "./DataType";
import { PacketFormat, FormatToObject, FormatToDeserializerOptions } from "./Serialization";

import { z } from "zod";

import varint from "varint";
import { Bedrock } from "@/Packets/Magic";
import { pipe } from "@/helpers";

const VARINT_FLAG = 1 << 7;

const EntrySchema = z.tuple([
  z.string(),
  z.nativeEnum(DataType)
]);

export interface BasePacketizer {
  /**
   * "Wraps" data in protocol format with prefix-lengths, magic, etc.,
   * and returns the assembled Buffer.
   */
  packetize(bufs: Buffer[]): Buffer;
  /**
   * "Unwraps" data from protocol format and returns a
   * [subarray](https://nodejs.org/api/buffer.html#bufsubarraystart-end).
   */
  depacketize(buf: Buffer): Buffer;
}

export default class PacketTool<
  const T extends PacketFormat,
  P extends new(...args: any[]) => BasePacketizer
> {
  private packetizer: BasePacketizer;

  constructor(
    private format: T,
    packetizerCtor: P,
    ...packetizerArgs: ConstructorParameters<P>
  ) {
    this.packetizer = new packetizerCtor(...packetizerArgs);
  }

  public serialize(values: FormatToObject<T>) {
    const bufs: Buffer[] = [];

    for (const entry of this.format as ReadonlyArray<unknown>) {
      const [name, type] = EntrySchema.parse(entry);

      if (name in values === false)
        throw new Error(`Value for "${name}" is missing from values parameter`);

      /**
       * @note this isn't safely checked by typescript.
       * however, the above `name in values === false`
       * check affirms that it will be so.  there's a
       * strange issue where my implementation of
       * {@link FormatToObject<T>} does not yield a
       * proper key generic via keyof.
       */
      const value = values[name as keyof typeof values] as unknown;

      /**
       * due to the nature of some weaknesses in
       * typescript's type inference system, i'm unable
       * to DRY up the `parsedValue` type spiel.
       *
       * @todo find better typing to mitigate this?
       */
      switch (type) {
        case DataType.uint16be: {
          const parsedValue = SchemaMap[type].parse(value);
          const buf = Buffer.alloc(2);

          buf.writeUInt16BE(parsedValue);

          bufs.push(buf);
        } break;

        case DataType.int32be: {
          const parsedValue = SchemaMap[type].parse(value);
          const buf = Buffer.alloc(4);

          buf.writeInt32BE(parsedValue);

          bufs.push(buf);
        } break;

        case DataType.Bytes: {
          const parsedValue = SchemaMap[type].parse(value);

          bufs.push(parsedValue);
        } break;

        case DataType.VarInt: {
          const parsedValue = SchemaMap[type].parse(value);

          bufs.push(varint.encode(parsedValue));
        } break;

        case DataType.VarIntString: {
          const parsedValue = SchemaMap[type].parse(value);

          bufs.push(
            varint.encode(parsedValue.length),
            Buffer.from(parsedValue)
          );
        } break;

        case DataType.uint64be: {
          const parsedValue = SchemaMap[type].parse(value);

          const buf = Buffer.alloc(8);
          buf.writeBigInt64BE(parsedValue);

          bufs.push(buf);
        } break;

        case DataType.RaknetMagic:
          bufs.push(Bedrock.RAKNET_MAGIC);

          break;

        default:
          throw new Error(`Encoding DataType ${DataType[type]} is not implemented`);
      }
    }

    return this.packetizer.packetize(bufs);
  }

  public deserialize(rawBuf: Buffer, ...[options]: FormatToDeserializerOptions<T>): FormatToObject<T> {
    type Formatted = FormatToObject<T>;

    const buf = this.packetizer.depacketize(rawBuf);
    let offset = 0;

    let returnObj: Record<any, any> = {};

    for (const [name, type] of this.format) {
      if (offset >= buf.length)
        throw new Error("Ran out of bytes in buffer");

      const begin = offset;

      switch (type) {
        case DataType.VarIntString: {
          const length = varint.decode(buf, offset);

          do ++offset; while (buf[offset - 1] & VARINT_FLAG);

          returnObj[name] = buf.slice(offset, offset + length).toString("utf8");

          offset += length;
        } break;

        case DataType.Bytes: {
          /** @todo rewrite this -- ugly :( */
          const { length } = z.object({
            length: z.number().nonnegative().int(),
          }).parse(
            // @ts-ignore
            options[name]
          );

          returnObj[name] = buf.subarray(offset, offset + length);

          offset += length;
        } break;

        case DataType.uint16le:
          returnObj[name] = buf.readUInt16LE(offset);

          offset += 2;
          break;

        case DataType.uint64be:
          returnObj[name] = buf.readBigUint64BE(offset);

          offset += 8;
          break;

        case DataType.RaknetMagic: {
          const bytes = buf.subarray(offset, offset + 16);

          if (bytes.compare(Bedrock.RAKNET_MAGIC) !== 0)
            throw new Error("Decoded Raknet Magic is invalid");

          offset += 16;

          returnObj[name] = true;
        }; break

        case DataType.ShortString: {
          const length = buf.readUInt16BE(offset);

          offset += 2;

          if (offset + length > buf.length) {
            throw new Error(`Read ShortString with length greater than bytes remaining in the buffer`);
          }

          returnObj[name] = buf.subarray(offset, offset + length).toString("utf-8");

          offset += length;
        } break;

        case DataType.int32be:
          returnObj[name] = buf.readInt32BE(offset);

          offset += 4;
          break;

        case DataType.NullString: {
          const start = offset;

          do ++offset; while (buf[offset - 1] && (offset - 1) < buf.length);

          // offset - 1 to remove null-byte
          returnObj[name] = buf.subarray(start, offset - 1).toString("utf-8");
        } break;

        case DataType.NullStringArray: {
          const strs: string[] = [];

          while (
            offset < buf.length  &&
            (
              buf[offset] !== 0x00 ||
              strs.at(-1) === "plugins"
            )
          ) {
            const start = offset;

            do ++offset; while (buf[offset - 1] && (offset - 1) < buf.length);

            pipe()
              ($ => buf.subarray(start, offset - 1))
              ($ => $.toString("ascii"))
              ($ => strs.push($));
          }

          if (buf[offset] === 0x00 && offset < buf.length)
            offset++;

          returnObj[name] = strs;
        } break;

        default:
          throw new Error(`Decoding DataType ${DataType[type]} is not implemented`);
      }

      if (begin === offset)
        throw new Error(`Offset was not incremented (${DataType[type]} ${name}, begin=${begin}, end=${offset}})`);
    }

    if (offset !== buf.length)
      throw new Error("Too many bytes in buffer");

    /** @note dangerous! */
    return returnObj as unknown as Formatted;
  }
}

export { DataType };
