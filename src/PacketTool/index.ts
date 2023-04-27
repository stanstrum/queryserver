import { DataType, SchemaMap } from "./DataType";
import { PacketFormat, FormatToObject, FormatToDeserializerOptions } from "./Serialization";

import { z } from "zod";

import varint from "varint";

const EntrySchema = z.tuple([
  z.string(),
  z.nativeEnum(DataType)
]);

export interface BasePacketizer {
  packetize(bufs: Buffer[]): Buffer;
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

      switch (type) {
        case DataType.Bytes: {
          const parsedValue = SchemaMap[type].parse(value);

          bufs.push(parsedValue);

        } break;

        case DataType.VarInt: {
          const parsedValue = SchemaMap[type].parse(value);

          bufs.push()
        } break;

        default:
          throw new Error("Not implemented")
      }
    }

    return this.packetizer.packetize(bufs);
  }

  public deserialize(...options: FormatToDeserializerOptions<T>): FormatToObject<T> {
    throw new Error("Not implemented");
  }
}

export { DataType };
