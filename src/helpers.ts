import { EventEmitter } from "node:events";
import dgram from "node:dgram";

// import { hexy } from "hexy";

export class AggregateError<T extends Error[]> extends Error {
  public readonly name = "AggregateError";

  public readonly errors: T;

  constructor(message: string, ...errors: T) {
    const messages = [message];

    for (const e of errors) {
      if (e.stack) {
        messages.push(
          e.stack
            .split('\n')
            .slice(0, 2)
            .map(line => `    ${line}`)
            .join('\n') + '\n'
        );
      } else {
        messages.push(
          `${e.name}: ${e.message}\n    at <unknown>`
            .split('\n')
            .map(line => `    ${line}`)
            .join('\n') + '\n'
        );
      }
    }

    super(messages.join('\n'));

    this.errors = errors;
  }
}

/** @note This is pretty sketchy... */
export function merge<U extends Record<any, any>, V extends Record<any, any>>(src: U, dst: V) {
  const result: any = {};

  for (const key of [...Object.keys(src), ...Object.keys(dst)]) {
    if (
      typeof src[key] === "object" &&
      typeof dst[key] === "object" &&
      /* Prevent clobbering arrays and other iterables,
       * as their `typeof` is "object".  Thanks, Jest!
       *
       * https://stackoverflow.com/a/32538867/6496600
       */
      typeof src[key][Symbol.iterator] !== "function"
    ) {
      result[key] = merge(src[key], dst[key]);

      continue;
    }

    if (typeof src[key] !== "undefined") {
      result[key] = src[key];

      continue;
    }

    if (typeof dst[key] !== "undefined")
      result[key] = dst[key];
  }

  return result as U & V;
}

/** @link https://stackoverflow.com/a/50375286/6496600 */
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

/** @note This is sketchy to the tenth degree */
export function variadicMerge<T extends Array<Record<any, any>>>(...objs: T) {
  let rolling = {};

  for (const obj of objs) {
    rolling = merge(rolling, obj);
  }

  return rolling as UnionToIntersection<T[any]>;
}

let ctr = 0;
/** @note Vestige from js port */
export const auto = () => ctr++;

export declare interface ConnectionTimeout {
  on(event: "timeout", listener: () => void): this;
  emit(event: "timeout", ...args: void[]): boolean;
}

export class ConnectionTimeout extends EventEmitter {
  private timedout = false;

  constructor(timeout: number) {
    super();

    setTimeout(
      () => {
        this.timedout = true;

        this.emit("timeout");
      },
      timeout
    );

    /** @fixme this is too many */
    this.setMaxListeners(21);
  }

  onTimeout(cb: () => void) {
    if (this.timedout)
      setTimeout(cb);
    else
      this.on("timeout", cb);
  }
}

// export const hp = (buf: Buffer, pfx = '>') => {
//   const trimmed = hexy(buf).trim();

//   const formatted = trimmed
//     .split('\n')
//     .map(line => `${pfx} ${line}`)
//     .join('\n');

//   console.log(formatted);

//   return buf;
// }

export class UDPResender {
  constructor(private socket: dgram.Socket, private ct: ConnectionTimeout) {}

  public async sendUntilReceive(buf: Buffer): Promise<Buffer> {
    const write = () => this.socket.send(buf);
    const interval = setInterval(() => write(), 1_000);

    const dataPromise = this.getData();

    write();

    try {
      return await dataPromise;
    } finally {
      clearInterval(interval);
    }
  }

  public getData(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.socket.once("message", data => resolve(data));
      this.socket.once("error", e => reject(new Error("Socket errored")));
      this.socket.once("close", () => reject(new Error("Socket closed")));

      this.ct.onTimeout(() => reject(new Error("Timed out")));
    });
  }
}

type Pipe<V> = {
  <J>(cb: (x: V) => J): Pipe<J>

  get(): V;
  pass(cb: (x: V) => void): Pipe<V>;
  await<J>(cb: (x: Awaited<V>) => J): Pipe<Promise<J>>;
  awaitPass(cb: (x: Awaited<V>) => void | Promise<void>): Pipe<
    Promise<Awaited<V>>
  >;
};

/**
 * @note uses <J,> instead of <J> in some places
 * due to JSX syntax ambiguity
 */
function _pipe<V>(value: V): Pipe<V> {
  const fn = <J,>(cb: (x: V) => J) => pipe<J>(cb(value));

  fn.get = () => value;
  fn.pass = (cb: (x: V) => void) => pipe(value);

  fn.await = <J,>(cb: (x: Awaited<V>) => J) =>
    pipe(
      Promise.resolve(value)
        .then(cb)
    );
  fn.awaitPass = (cb: (x: Awaited<V>) => void) =>
    pipe(
      Promise.resolve<V>(value)
        .then(v => (cb(v), v))
    );

  return fn;
}

export function pipe<V>(value?: V): Pipe<V> {
  if (typeof value === "undefined") {
    return _pipe(void 0 as V);
  } else {
    return _pipe(value);
  }
}

export function stringArrayToObject(strs: string[]): Record<string, unknown> {
  const returnObj: Record<string, unknown> = {}

  if (strs.length % 2 !== 0)
    throw new Error("Cannot create object from an odd amount of items (need pairs)");

  for (let i = 0; i < strs.length; i += 2)
    returnObj[strs[i]] = strs[i + 1];

  return returnObj;
}

export function optionalIndex<T extends object>(any: T, k: PropertyKey): T[keyof T] | void {
  if (k in any)
    return any[k as keyof T];
}
