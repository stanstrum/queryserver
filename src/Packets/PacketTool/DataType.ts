export enum DataType {
  Bytes
};

export type TypeMap = {
  [DataType.Bytes]: Buffer
};

export type DeserializerOptions = {
  [DataType.Bytes]: { length: number };
};
