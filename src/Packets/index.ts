import PacketTool, { DataType } from "@/PacketTool";

import {
  JavaPacketizer,
  BedrockPacketizer,
  QueryPacketizer,
  RawPacketizer,
} from "./Packetizers";

export namespace Java {
  /**
   * Protocol number for Java 1.19.4
   */
  export const PROTOCOL_NUMBER = 762;
  export enum State {
    Handshake = 0x00,
    Status = 0x01,
    Login = 0x02,
  };

  export const Handshake = new PacketTool([
    ["protocol"     , DataType.VarInt],
    ["serverAddress", DataType.VarIntString],
    ["serverPort"   , DataType.uint16be],
    ["nextState"    , DataType.VarInt]
  ], JavaPacketizer, 0x00);

  export const StatusRequest = new PacketTool([
    // no fields
  ], JavaPacketizer, 0x00);

  export const StatusResponse = new PacketTool([
    ["jsonResponse" , DataType.VarIntString]
  ], JavaPacketizer, 0x00);

  export const PingRequest = new PacketTool([
    ["payload"      , DataType.Bytes]
  ], JavaPacketizer, 0x01);

  export const PingResponse = new PacketTool([
    ["payload"      , DataType.Bytes]
  ], JavaPacketizer, 0x01);
}

export namespace Bedrock {
  export const UnconnectedPing = new PacketTool([
    ["time"         , DataType.uint64be],
    ["magic"        , DataType.RaknetMagic],
    ["clientGUID"   , DataType.Bytes],
  ], BedrockPacketizer, 0x01);

  export const UnconnectedPong = new PacketTool([
    ["time"         , DataType.uint64be],
    ["serverGUID"   , DataType.Bytes],
    ["magic"        , DataType.RaknetMagic],
    ["serverID"     , DataType.ShortString]
  ], BedrockPacketizer, 0x1c);
}

export namespace Query {
  export const HandshakeRequest = new PacketTool([
    ["sessionID"    , DataType.int32be],
    // "empty" (omitted) payload
  ], QueryPacketizer, 0x09);

  export const HandshakeResponse = new PacketTool([
    ["sessionID"    , DataType.int32be],
    ["challenge"    , DataType.NullString]
  ], QueryPacketizer, 0x09);

  export const BasicStatRequest = new PacketTool([
    ["sessionID"    , DataType.int32be],
    ["challenge"    , DataType.int32be]
  ], QueryPacketizer, 0x00);

  export const BasicStatResponse = new PacketTool([
    ["sessionID"    , DataType.int32be],
    ["motd"         , DataType.NullString],
    ["gametype"     , DataType.NullString],
    ["map"          , DataType.NullString],
    ["online"       , DataType.NullString],
    ["max"          , DataType.NullString],
    ["port"         , DataType.uint16le],
    ["ip"           , DataType.NullString]
  ], QueryPacketizer, 0x00);

  export const FullStatRequest = new PacketTool([
    ["sessionID"    , DataType.int32be],
    ["challenge"    , DataType.int32be],
    ["padding"      , DataType.int32be]
  ], QueryPacketizer, 0x00);

  export const FullStatResponse = new PacketTool([
    ["sessionID"    , DataType.int32be],
    ["padding1"     , DataType.Bytes],
    ["info"         , DataType.NullStringArray],
    ["padding2"     , DataType.Bytes],
    ["players"      , DataType.NullStringArray],
  ], QueryPacketizer, 0x00);
}
