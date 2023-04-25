import { UnionToIntersection } from "@/helpers";
import { DataType, DeserializerOptions, TypeMap } from "./DataType";

type PacketEntry = readonly [name: string, type: DataType];
type PacketFormat = readonly PacketEntry[];

type PacketName<T extends PacketEntry> = T[0];
type PacketType<T extends PacketEntry> = T[1];

type FormatToObject<T extends PacketFormat> = UnionToIntersection<{
  [Index in keyof T]:
    T[Index] extends (infer Entry extends PacketEntry)
      ? { [Name in PacketName<Entry>]: TypeMap[PacketType<Entry>] }
      : never;
}[number]>;

type FormatToDeserializerOptions<T extends PacketFormat> = UnionToIntersection<{
  [Index in keyof T]:
    T[Index] extends (infer Entry extends PacketEntry)
      ? {
        [Name in PacketName<Entry> as
          PacketType<Entry> extends keyof DeserializerOptions
            ? Name
            : never
        ]: DeserializerOptions[PacketType<Entry>];
      }
      : never;
}[number]> extends infer O
  ? (
    [keyof O] extends [never]
      ? [options?: O]
      : [options : O]
  ) : never;

export interface BasePacketizer {
  packetize(bufs: Buffer[]): Buffer;
  depacketize(buf: Buffer): Buffer;
}

export default class PacketTool<const T extends PacketFormat> {
  constructor(
    private format: T,
    private packetizer: BasePacketizer
  ) {}

  serialize(values: FormatToObject<T>): Buffer {
    throw new Error("Not implemented");
  }

  deserialize(...options: FormatToDeserializerOptions<T>): FormatToObject<T> {
    throw new Error("Not implemented");
  }
}
