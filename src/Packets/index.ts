import PacketTool, { DataType } from "@/PacketTool";

import { JavaPacketizer } from "./Packetizers";
import { BedrockPacketizer } from "./Packetizers";
import { QueryPacketizer } from "./Packetizers";

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
    ["protocol", DataType.VarInt],
    ["serverAddress", DataType.VarIntString],
    ["serverPort", DataType.uint16be],
    ["nextState", DataType.VarInt]
  ], JavaPacketizer, 0x00);

  export const StatusRequest = new PacketTool([
    // no fields
  ], JavaPacketizer, 0x00);

  export const StatusResponse = new PacketTool([
    ["jsonResponse", DataType.VarIntString]
  ], JavaPacketizer, 0x00);

  export const PingRequest = new PacketTool([
    ["payload", DataType.Bytes]
  ], JavaPacketizer, 0x01);

  export const PingResponse = new PacketTool([
    ["payload", DataType.Bytes]
  ], JavaPacketizer, 0x01);
}

export namespace Bedrock {
  export const unconnectedPing = new PacketTool([
    ["time", DataType.uint64be],
    ["magic", DataType.RaknetMagic],
    ["clientGUID", DataType.uint64be],
  ], BedrockPacketizer, 0x01);

  export const unconnectedPong = new PacketTool([

  ], BedrockPacketizer, 0x1c);
}

export namespace Query {

}
