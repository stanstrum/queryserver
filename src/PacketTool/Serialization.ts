import { DataType, DeserializerOptions, TypeMap } from "./DataType";

export type PacketEntry = readonly [name: string, type: DataType];
export type PacketFormat = ReadonlyArray<PacketEntry>;

type PacketName<T extends PacketEntry> = T[0];
type PacketType<T extends PacketEntry> = T[1];

export type FormatToObject<T extends PacketFormat> = {
  [K in keyof T as T[K] extends PacketEntry
    ? PacketName<T[K]>
    : never
  ]: TypeMap[PacketType<T[K]>];
} & {};

type PruneNevers<T> = {
  [K in keyof T as [T[K]] extends [never] ? never : K]: PruneNevers<T[K]>;
}

type ToDeserializerOptions<T> = {} extends T ? [T?] : [T];

export type FormatToDeserializerOptions<T extends PacketFormat> =
  ToDeserializerOptions<
    PruneNevers<{
      [
        K in keyof T as
          T[K] extends PacketEntry
            ? PacketName<T[K]>
            : never
      ]: PacketType<T[K]> extends keyof DeserializerOptions
        ? DeserializerOptions[PacketType<T[K]>]
        : never;
    }> & {}
  >;
