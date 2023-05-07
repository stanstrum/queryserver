export namespace Bedrock {
  export const RAKNET_MAGIC = Buffer.from("00ffff00fefefefefdfdfdfd12345678", "hex");
}

export namespace Query {
  export const QUERY_MAGIC = Buffer.from("fefd", "hex");

  export const SPLITNUM = Buffer.from("73706c69746e756d008000", "hex");
  export const PLAYERS_ = Buffer.from("01706c617965725f0000", "hex");
}
