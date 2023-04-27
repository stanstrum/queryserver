import PacketTool, { DataType } from "@/PacketTool";

import { JavaPacketizer } from "./Packetizers";
import { BedrockPacketizer } from "./Packetizers";
import { QueryPacketizer } from "./Packetizers";

export namespace Java {
  /**
   * Protocol number for Java 1.19.4
   */
  const PROTOCOL_NUMBER = 762;

  const Handshake = new PacketTool([
    ["protocol", DataType.VarInt],
    ["serverAddress", DataType.VarIntString],
    ["serverPort", DataType.uint16be],
    ["nextState", DataType.VarInt]
  ], JavaPacketizer, 0x00);
}

export namespace Bedrock {

}

export namespace Query {

}
