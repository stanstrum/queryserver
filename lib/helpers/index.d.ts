export declare class AggregateError<T extends Error> extends Error {
    readonly name = "AggregateError";
    readonly errors: T[];
    constructor(message: string, ...errors: T[]);
}
export declare function merge<U extends Record<any, any>, V extends Record<any, any>>(src: U, dst: V): U & V;
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
export type Defamiliarize<T> = T extends infer O ? O : never;
export declare function variadicMerge<T extends Array<Record<any, any>>>(...objs: T): UnionToIntersection<T[any]>;
export declare const auto: () => number;
