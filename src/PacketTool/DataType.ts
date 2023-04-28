import z, { ZodTypeAny } from "zod";

export enum DataType {
  uint8,
  uint16be,
  uint32be,
  uint64be,
  Bytes,
  VarInt,
  VarIntString,
  ShortString, // Uses uint16be for size pfx.
  RaknetMagic,
};

/** @todo replace these magic numbers with something more intuitive */
export const SchemaMap = {
  [DataType.uint8]: z.number()
    .nonnegative().int()
    .lte(255),
  [DataType.uint16be]: z.number()
    .nonnegative().int()
    .lte(65535),
  [DataType.uint32be]: z.number()
    .nonnegative().int()
    .lte(4294967295),
  [DataType.uint64be]: z.bigint()
    .nonnegative()
    .lte(18446744073709551615n),
  [DataType.Bytes]: z.instanceof(Buffer),
  [DataType.VarInt]: z.number()
    .int()
    .gte(-2147483648)
    .lte(2147483647),
  [DataType.VarIntString]: z.string(),
  [DataType.ShortString]: z.string(),
  [DataType.RaknetMagic]: z.literal(true),
} as const satisfies Record<DataType, ZodTypeAny>;

type SchemaMap = typeof SchemaMap;
export type TypeMap = {
  -readonly [K in keyof SchemaMap]: z.infer<SchemaMap[K]>;
};

export type DeserializerOptions = {
  [DataType.Bytes]: { length: number };
};
