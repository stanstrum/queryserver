# queryserver
This package is a tool for the Minecraft server protocol that allows the user to query the status of a Minecraft server (be it Java Edition, Bedrock Edition, MCPE, and more) using wide berth of protocols and data-merging techniques.

This package is the successor to [QueryServer.js v3](https://www.github.com/stanstrum/queryServer3/) library used by the [Minecraft Server Status](https://top.gg/bot/652726107535310859?s=0b2d6fec6c0c4) Discord bot.

Todo items:
- [ ] Support for nonstandard implementations (GeyserMC, etc.)
- [ ] Legacy (beta/alpha) server support
- [ ] Fix dangling promises/event loop hogging
- [ ] Performance improvements

### NOTE: This project is still WIP
#### Function signature:
```ts
interface QueryServerResults {
  hostname?: string;
  ip: string;

  type: "Java" | "Bedrock" | "Unknown" | "Crossplay";

  motd?: string;
  version?: string;
  players: {
      online?: number;
      max?: number;
      list?: string[];
  };
  favicon?: string;
  latency: number;

  debug: {
    options: Options;
    srvs?: string[];

    protocol?: number;
    protocolVersion?: string;

    java: boolean;
    bedrock: boolean;
    query: boolean;
  };
}

declare function queryserver(host: string, options: Options): Promise<QueryServerResults>;
````

#### Install instructions:
1. Run `npm install --save queryserver`
2. Use as follows:
```js
   import queryserver from "queryserver";
   // or...
   const queryserver = require("queryserver").default;

   queryserver("mc.hypixel.net:25565")
     .then(console.dir)
     .catch(console.error);
```
