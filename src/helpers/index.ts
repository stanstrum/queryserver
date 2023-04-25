export class AggregateError<T extends Error> extends Error {
  public readonly name = "AggregateError";

  public readonly errors: T[];

  constructor(message: string, ...errors: T[]) {
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
export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

export type Defamiliarize<T> = T extends infer O ? O : never;

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
