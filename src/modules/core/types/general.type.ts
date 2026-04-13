type ComputeRange<N extends number, Result extends unknown[] = []> = Result['length'] extends N
  ? Result
  : ComputeRange<N, [...Result, Result['length']]>;
type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;
type INT<From extends number, To extends number> = Exclude<Enumerate<To>, Enumerate<From>> | To;
type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnakeCase<U>}`
  : S;
type CamelToSnakeNested<T> = T extends object
  ? {
      [K in keyof T as CamelToSnakeCase<K & string>]: CamelToSnakeNested<T[K]>;
    }
  : T;

type Nullable<T> = T | null;
type UnDef<T> = T | undefined;
type NullList<T> = T | undefined | null;
type EntityId = number | string;
type Entity = number | string | symbol;
interface DictNum<T> {
  [id: number]: T;
}
interface Dict<T> extends DictNum<T> {
  [id: string]: T;
}
interface EntityState<T> {
  ids: string[];
  entities: Dict<T>;
}
type VoidFunc<T> = (value: T) => void;
type StringEnum<T> = T | (string & Record<never, never>);
type Tree = Record<Entity, any>;
type IsAny<T, True, False = never> = true | false extends (T extends never ? true : false) ? True : False;
type PreventAny<S, T> = IsAny<S, EntityState<T>, S>;
type Comparer<T> = (a: T, b: T) => number;
type MergeInsertions<T> =
  T extends Record<string, any>
    ? {
        [K in keyof T]: MergeInsertions<T[K]>;
      }
    : T;
type DeepMerge<F, S> = MergeInsertions<{
  [K in keyof F | keyof S]: K extends keyof S & keyof F
    ? DeepMerge<F[K], S[K]>
    : K extends keyof S
      ? S[K]
      : K extends keyof F
        ? F[K]
        : never;
}>;

export type {
  CamelToSnakeCase,
  CamelToSnakeNested,
  Comparer,
  ComputeRange,
  DeepMerge,
  Dict,
  DictNum,
  Entity,
  EntityId,
  EntityState,
  INT,
  IsAny,
  MergeInsertions,
  NullList,
  Nullable,
  PreventAny,
  StringEnum,
  Tree,
  UnDef,
  VoidFunc
};
