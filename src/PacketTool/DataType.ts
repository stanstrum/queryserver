import z, { ZodTypeAny } from "zod";

export enum DataType {
  uint16be,
  Bytes,
  VarInt,
  VarIntString,
};

export const SchemaMap = {
  [DataType.uint16be]: z.number()
    .int()
    .gte(0)
    .lte(1),
  [DataType.Bytes]: z.instanceof(Buffer),
  [DataType.VarInt]: z.number()
    .int()
    .gte(-2147483648)
    .lte(2147483647),
  [DataType.VarIntString]: z.string(),
} as const;

export type TypeMap = {
  -readonly [K in keyof (typeof SchemaMap)]: z.infer<(typeof SchemaMap)[K]>;
};

export type DeserializerOptions = {
  [DataType.Bytes]: { length: number };
};
