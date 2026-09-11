
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Product
 * 
 */
export type Product = $Result.DefaultSelection<Prisma.$ProductPayload>
/**
 * Model PriceHistory
 * 
 */
export type PriceHistory = $Result.DefaultSelection<Prisma.$PriceHistoryPayload>
/**
 * Model CostPriceHistory
 * 
 */
export type CostPriceHistory = $Result.DefaultSelection<Prisma.$CostPriceHistoryPayload>
/**
 * Model Review
 * 
 */
export type Review = $Result.DefaultSelection<Prisma.$ReviewPayload>
/**
 * Model ProductLike
 * 
 */
export type ProductLike = $Result.DefaultSelection<Prisma.$ProductLikePayload>
/**
 * Model Category
 * 
 */
export type Category = $Result.DefaultSelection<Prisma.$CategoryPayload>
/**
 * Model FlashSale
 * 
 */
export type FlashSale = $Result.DefaultSelection<Prisma.$FlashSalePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Products
 * const products = await prisma.product.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Products
   * const products = await prisma.product.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.product`: Exposes CRUD operations for the **Product** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Products
    * const products = await prisma.product.findMany()
    * ```
    */
  get product(): Prisma.ProductDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.priceHistory`: Exposes CRUD operations for the **PriceHistory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PriceHistories
    * const priceHistories = await prisma.priceHistory.findMany()
    * ```
    */
  get priceHistory(): Prisma.PriceHistoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.costPriceHistory`: Exposes CRUD operations for the **CostPriceHistory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CostPriceHistories
    * const costPriceHistories = await prisma.costPriceHistory.findMany()
    * ```
    */
  get costPriceHistory(): Prisma.CostPriceHistoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.review`: Exposes CRUD operations for the **Review** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Reviews
    * const reviews = await prisma.review.findMany()
    * ```
    */
  get review(): Prisma.ReviewDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.productLike`: Exposes CRUD operations for the **ProductLike** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ProductLikes
    * const productLikes = await prisma.productLike.findMany()
    * ```
    */
  get productLike(): Prisma.ProductLikeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.category`: Exposes CRUD operations for the **Category** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Categories
    * const categories = await prisma.category.findMany()
    * ```
    */
  get category(): Prisma.CategoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.flashSale`: Exposes CRUD operations for the **FlashSale** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more FlashSales
    * const flashSales = await prisma.flashSale.findMany()
    * ```
    */
  get flashSale(): Prisma.FlashSaleDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Product: 'Product',
    PriceHistory: 'PriceHistory',
    CostPriceHistory: 'CostPriceHistory',
    Review: 'Review',
    ProductLike: 'ProductLike',
    Category: 'Category',
    FlashSale: 'FlashSale'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "product" | "priceHistory" | "costPriceHistory" | "review" | "productLike" | "category" | "flashSale"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Product: {
        payload: Prisma.$ProductPayload<ExtArgs>
        fields: Prisma.ProductFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProductFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProductFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          findFirst: {
            args: Prisma.ProductFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProductFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          findMany: {
            args: Prisma.ProductFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          create: {
            args: Prisma.ProductCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          createMany: {
            args: Prisma.ProductCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProductCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          delete: {
            args: Prisma.ProductDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          update: {
            args: Prisma.ProductUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          deleteMany: {
            args: Prisma.ProductDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProductUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProductUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>[]
          }
          upsert: {
            args: Prisma.ProductUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductPayload>
          }
          aggregate: {
            args: Prisma.ProductAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProduct>
          }
          groupBy: {
            args: Prisma.ProductGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProductGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProductCountArgs<ExtArgs>
            result: $Utils.Optional<ProductCountAggregateOutputType> | number
          }
        }
      }
      PriceHistory: {
        payload: Prisma.$PriceHistoryPayload<ExtArgs>
        fields: Prisma.PriceHistoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PriceHistoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceHistoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PriceHistoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceHistoryPayload>
          }
          findFirst: {
            args: Prisma.PriceHistoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceHistoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PriceHistoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceHistoryPayload>
          }
          findMany: {
            args: Prisma.PriceHistoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceHistoryPayload>[]
          }
          create: {
            args: Prisma.PriceHistoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceHistoryPayload>
          }
          createMany: {
            args: Prisma.PriceHistoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PriceHistoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceHistoryPayload>[]
          }
          delete: {
            args: Prisma.PriceHistoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceHistoryPayload>
          }
          update: {
            args: Prisma.PriceHistoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceHistoryPayload>
          }
          deleteMany: {
            args: Prisma.PriceHistoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PriceHistoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PriceHistoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceHistoryPayload>[]
          }
          upsert: {
            args: Prisma.PriceHistoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PriceHistoryPayload>
          }
          aggregate: {
            args: Prisma.PriceHistoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePriceHistory>
          }
          groupBy: {
            args: Prisma.PriceHistoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<PriceHistoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.PriceHistoryCountArgs<ExtArgs>
            result: $Utils.Optional<PriceHistoryCountAggregateOutputType> | number
          }
        }
      }
      CostPriceHistory: {
        payload: Prisma.$CostPriceHistoryPayload<ExtArgs>
        fields: Prisma.CostPriceHistoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CostPriceHistoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CostPriceHistoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CostPriceHistoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CostPriceHistoryPayload>
          }
          findFirst: {
            args: Prisma.CostPriceHistoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CostPriceHistoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CostPriceHistoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CostPriceHistoryPayload>
          }
          findMany: {
            args: Prisma.CostPriceHistoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CostPriceHistoryPayload>[]
          }
          create: {
            args: Prisma.CostPriceHistoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CostPriceHistoryPayload>
          }
          createMany: {
            args: Prisma.CostPriceHistoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CostPriceHistoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CostPriceHistoryPayload>[]
          }
          delete: {
            args: Prisma.CostPriceHistoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CostPriceHistoryPayload>
          }
          update: {
            args: Prisma.CostPriceHistoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CostPriceHistoryPayload>
          }
          deleteMany: {
            args: Prisma.CostPriceHistoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CostPriceHistoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CostPriceHistoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CostPriceHistoryPayload>[]
          }
          upsert: {
            args: Prisma.CostPriceHistoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CostPriceHistoryPayload>
          }
          aggregate: {
            args: Prisma.CostPriceHistoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCostPriceHistory>
          }
          groupBy: {
            args: Prisma.CostPriceHistoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<CostPriceHistoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.CostPriceHistoryCountArgs<ExtArgs>
            result: $Utils.Optional<CostPriceHistoryCountAggregateOutputType> | number
          }
        }
      }
      Review: {
        payload: Prisma.$ReviewPayload<ExtArgs>
        fields: Prisma.ReviewFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ReviewFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ReviewFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          findFirst: {
            args: Prisma.ReviewFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ReviewFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          findMany: {
            args: Prisma.ReviewFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>[]
          }
          create: {
            args: Prisma.ReviewCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          createMany: {
            args: Prisma.ReviewCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ReviewCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>[]
          }
          delete: {
            args: Prisma.ReviewDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          update: {
            args: Prisma.ReviewUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          deleteMany: {
            args: Prisma.ReviewDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ReviewUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ReviewUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>[]
          }
          upsert: {
            args: Prisma.ReviewUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          aggregate: {
            args: Prisma.ReviewAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReview>
          }
          groupBy: {
            args: Prisma.ReviewGroupByArgs<ExtArgs>
            result: $Utils.Optional<ReviewGroupByOutputType>[]
          }
          count: {
            args: Prisma.ReviewCountArgs<ExtArgs>
            result: $Utils.Optional<ReviewCountAggregateOutputType> | number
          }
        }
      }
      ProductLike: {
        payload: Prisma.$ProductLikePayload<ExtArgs>
        fields: Prisma.ProductLikeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProductLikeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductLikePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProductLikeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductLikePayload>
          }
          findFirst: {
            args: Prisma.ProductLikeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductLikePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProductLikeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductLikePayload>
          }
          findMany: {
            args: Prisma.ProductLikeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductLikePayload>[]
          }
          create: {
            args: Prisma.ProductLikeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductLikePayload>
          }
          createMany: {
            args: Prisma.ProductLikeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProductLikeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductLikePayload>[]
          }
          delete: {
            args: Prisma.ProductLikeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductLikePayload>
          }
          update: {
            args: Prisma.ProductLikeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductLikePayload>
          }
          deleteMany: {
            args: Prisma.ProductLikeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProductLikeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProductLikeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductLikePayload>[]
          }
          upsert: {
            args: Prisma.ProductLikeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProductLikePayload>
          }
          aggregate: {
            args: Prisma.ProductLikeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProductLike>
          }
          groupBy: {
            args: Prisma.ProductLikeGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProductLikeGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProductLikeCountArgs<ExtArgs>
            result: $Utils.Optional<ProductLikeCountAggregateOutputType> | number
          }
        }
      }
      Category: {
        payload: Prisma.$CategoryPayload<ExtArgs>
        fields: Prisma.CategoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CategoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CategoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findFirst: {
            args: Prisma.CategoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CategoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findMany: {
            args: Prisma.CategoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          create: {
            args: Prisma.CategoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          createMany: {
            args: Prisma.CategoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CategoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          delete: {
            args: Prisma.CategoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          update: {
            args: Prisma.CategoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          deleteMany: {
            args: Prisma.CategoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CategoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CategoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          upsert: {
            args: Prisma.CategoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          aggregate: {
            args: Prisma.CategoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCategory>
          }
          groupBy: {
            args: Prisma.CategoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<CategoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.CategoryCountArgs<ExtArgs>
            result: $Utils.Optional<CategoryCountAggregateOutputType> | number
          }
        }
      }
      FlashSale: {
        payload: Prisma.$FlashSalePayload<ExtArgs>
        fields: Prisma.FlashSaleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FlashSaleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlashSalePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FlashSaleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlashSalePayload>
          }
          findFirst: {
            args: Prisma.FlashSaleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlashSalePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FlashSaleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlashSalePayload>
          }
          findMany: {
            args: Prisma.FlashSaleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlashSalePayload>[]
          }
          create: {
            args: Prisma.FlashSaleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlashSalePayload>
          }
          createMany: {
            args: Prisma.FlashSaleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FlashSaleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlashSalePayload>[]
          }
          delete: {
            args: Prisma.FlashSaleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlashSalePayload>
          }
          update: {
            args: Prisma.FlashSaleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlashSalePayload>
          }
          deleteMany: {
            args: Prisma.FlashSaleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FlashSaleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.FlashSaleUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlashSalePayload>[]
          }
          upsert: {
            args: Prisma.FlashSaleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FlashSalePayload>
          }
          aggregate: {
            args: Prisma.FlashSaleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFlashSale>
          }
          groupBy: {
            args: Prisma.FlashSaleGroupByArgs<ExtArgs>
            result: $Utils.Optional<FlashSaleGroupByOutputType>[]
          }
          count: {
            args: Prisma.FlashSaleCountArgs<ExtArgs>
            result: $Utils.Optional<FlashSaleCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    product?: ProductOmit
    priceHistory?: PriceHistoryOmit
    costPriceHistory?: CostPriceHistoryOmit
    review?: ReviewOmit
    productLike?: ProductLikeOmit
    category?: CategoryOmit
    flashSale?: FlashSaleOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ProductCountOutputType
   */

  export type ProductCountOutputType = {
    priceHistories: number
    costHistories: number
  }

  export type ProductCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    priceHistories?: boolean | ProductCountOutputTypeCountPriceHistoriesArgs
    costHistories?: boolean | ProductCountOutputTypeCountCostHistoriesArgs
  }

  // Custom InputTypes
  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductCountOutputType
     */
    select?: ProductCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeCountPriceHistoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PriceHistoryWhereInput
  }

  /**
   * ProductCountOutputType without action
   */
  export type ProductCountOutputTypeCountCostHistoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CostPriceHistoryWhereInput
  }


  /**
   * Count Type CategoryCountOutputType
   */

  export type CategoryCountOutputType = {
    products: number
  }

  export type CategoryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    products?: boolean | CategoryCountOutputTypeCountProductsArgs
  }

  // Custom InputTypes
  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryCountOutputType
     */
    select?: CategoryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeCountProductsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProductWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Product
   */

  export type AggregateProduct = {
    _count: ProductCountAggregateOutputType | null
    _avg: ProductAvgAggregateOutputType | null
    _sum: ProductSumAggregateOutputType | null
    _min: ProductMinAggregateOutputType | null
    _max: ProductMaxAggregateOutputType | null
  }

  export type ProductAvgAggregateOutputType = {
    costPrice: number | null
    stock: number | null
    sales: number | null
    reportsCount: number | null
  }

  export type ProductSumAggregateOutputType = {
    costPrice: number | null
    stock: number | null
    sales: number | null
    reportsCount: number | null
  }

  export type ProductMinAggregateOutputType = {
    id: string | null
    shopId: string | null
    name: string | null
    image: string | null
    images: string | null
    video: string | null
    category: string | null
    categoryId: string | null
    brand: string | null
    description: string | null
    price: string | null
    originalPrice: string | null
    costPrice: number | null
    stock: number | null
    sales: number | null
    status: string | null
    sku: string | null
    variationsText: string | null
    hasVariations: boolean | null
    variationGroups: string | null
    variationRows: string | null
    weight: string | null
    length: string | null
    width: string | null
    height: string | null
    condition: string | null
    isPreOrder: boolean | null
    preOrderDays: string | null
    isViolated: boolean | null
    violationReason: string | null
    reportsCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProductMaxAggregateOutputType = {
    id: string | null
    shopId: string | null
    name: string | null
    image: string | null
    images: string | null
    video: string | null
    category: string | null
    categoryId: string | null
    brand: string | null
    description: string | null
    price: string | null
    originalPrice: string | null
    costPrice: number | null
    stock: number | null
    sales: number | null
    status: string | null
    sku: string | null
    variationsText: string | null
    hasVariations: boolean | null
    variationGroups: string | null
    variationRows: string | null
    weight: string | null
    length: string | null
    width: string | null
    height: string | null
    condition: string | null
    isPreOrder: boolean | null
    preOrderDays: string | null
    isViolated: boolean | null
    violationReason: string | null
    reportsCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProductCountAggregateOutputType = {
    id: number
    shopId: number
    name: number
    image: number
    images: number
    video: number
    category: number
    categoryId: number
    brand: number
    description: number
    price: number
    originalPrice: number
    costPrice: number
    stock: number
    sales: number
    status: number
    sku: number
    variationsText: number
    hasVariations: number
    variationGroups: number
    variationRows: number
    weight: number
    length: number
    width: number
    height: number
    condition: number
    isPreOrder: number
    preOrderDays: number
    isViolated: number
    violationReason: number
    reportsCount: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ProductAvgAggregateInputType = {
    costPrice?: true
    stock?: true
    sales?: true
    reportsCount?: true
  }

  export type ProductSumAggregateInputType = {
    costPrice?: true
    stock?: true
    sales?: true
    reportsCount?: true
  }

  export type ProductMinAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    image?: true
    images?: true
    video?: true
    category?: true
    categoryId?: true
    brand?: true
    description?: true
    price?: true
    originalPrice?: true
    costPrice?: true
    stock?: true
    sales?: true
    status?: true
    sku?: true
    variationsText?: true
    hasVariations?: true
    variationGroups?: true
    variationRows?: true
    weight?: true
    length?: true
    width?: true
    height?: true
    condition?: true
    isPreOrder?: true
    preOrderDays?: true
    isViolated?: true
    violationReason?: true
    reportsCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProductMaxAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    image?: true
    images?: true
    video?: true
    category?: true
    categoryId?: true
    brand?: true
    description?: true
    price?: true
    originalPrice?: true
    costPrice?: true
    stock?: true
    sales?: true
    status?: true
    sku?: true
    variationsText?: true
    hasVariations?: true
    variationGroups?: true
    variationRows?: true
    weight?: true
    length?: true
    width?: true
    height?: true
    condition?: true
    isPreOrder?: true
    preOrderDays?: true
    isViolated?: true
    violationReason?: true
    reportsCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProductCountAggregateInputType = {
    id?: true
    shopId?: true
    name?: true
    image?: true
    images?: true
    video?: true
    category?: true
    categoryId?: true
    brand?: true
    description?: true
    price?: true
    originalPrice?: true
    costPrice?: true
    stock?: true
    sales?: true
    status?: true
    sku?: true
    variationsText?: true
    hasVariations?: true
    variationGroups?: true
    variationRows?: true
    weight?: true
    length?: true
    width?: true
    height?: true
    condition?: true
    isPreOrder?: true
    preOrderDays?: true
    isViolated?: true
    violationReason?: true
    reportsCount?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ProductAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Product to aggregate.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Products
    **/
    _count?: true | ProductCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProductAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProductSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProductMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProductMaxAggregateInputType
  }

  export type GetProductAggregateType<T extends ProductAggregateArgs> = {
        [P in keyof T & keyof AggregateProduct]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProduct[P]>
      : GetScalarType<T[P], AggregateProduct[P]>
  }




  export type ProductGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProductWhereInput
    orderBy?: ProductOrderByWithAggregationInput | ProductOrderByWithAggregationInput[]
    by: ProductScalarFieldEnum[] | ProductScalarFieldEnum
    having?: ProductScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProductCountAggregateInputType | true
    _avg?: ProductAvgAggregateInputType
    _sum?: ProductSumAggregateInputType
    _min?: ProductMinAggregateInputType
    _max?: ProductMaxAggregateInputType
  }

  export type ProductGroupByOutputType = {
    id: string
    shopId: string
    name: string
    image: string | null
    images: string | null
    video: string | null
    category: string
    categoryId: string | null
    brand: string
    description: string
    price: string
    originalPrice: string | null
    costPrice: number | null
    stock: number
    sales: number
    status: string
    sku: string | null
    variationsText: string | null
    hasVariations: boolean
    variationGroups: string | null
    variationRows: string | null
    weight: string | null
    length: string | null
    width: string | null
    height: string | null
    condition: string
    isPreOrder: boolean
    preOrderDays: string | null
    isViolated: boolean
    violationReason: string | null
    reportsCount: number
    createdAt: Date
    updatedAt: Date
    _count: ProductCountAggregateOutputType | null
    _avg: ProductAvgAggregateOutputType | null
    _sum: ProductSumAggregateOutputType | null
    _min: ProductMinAggregateOutputType | null
    _max: ProductMaxAggregateOutputType | null
  }

  type GetProductGroupByPayload<T extends ProductGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProductGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProductGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProductGroupByOutputType[P]>
            : GetScalarType<T[P], ProductGroupByOutputType[P]>
        }
      >
    >


  export type ProductSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    image?: boolean
    images?: boolean
    video?: boolean
    category?: boolean
    categoryId?: boolean
    brand?: boolean
    description?: boolean
    price?: boolean
    originalPrice?: boolean
    costPrice?: boolean
    stock?: boolean
    sales?: boolean
    status?: boolean
    sku?: boolean
    variationsText?: boolean
    hasVariations?: boolean
    variationGroups?: boolean
    variationRows?: boolean
    weight?: boolean
    length?: boolean
    width?: boolean
    height?: boolean
    condition?: boolean
    isPreOrder?: boolean
    preOrderDays?: boolean
    isViolated?: boolean
    violationReason?: boolean
    reportsCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    categoryRef?: boolean | Product$categoryRefArgs<ExtArgs>
    priceHistories?: boolean | Product$priceHistoriesArgs<ExtArgs>
    costHistories?: boolean | Product$costHistoriesArgs<ExtArgs>
    _count?: boolean | ProductCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["product"]>

  export type ProductSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    image?: boolean
    images?: boolean
    video?: boolean
    category?: boolean
    categoryId?: boolean
    brand?: boolean
    description?: boolean
    price?: boolean
    originalPrice?: boolean
    costPrice?: boolean
    stock?: boolean
    sales?: boolean
    status?: boolean
    sku?: boolean
    variationsText?: boolean
    hasVariations?: boolean
    variationGroups?: boolean
    variationRows?: boolean
    weight?: boolean
    length?: boolean
    width?: boolean
    height?: boolean
    condition?: boolean
    isPreOrder?: boolean
    preOrderDays?: boolean
    isViolated?: boolean
    violationReason?: boolean
    reportsCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    categoryRef?: boolean | Product$categoryRefArgs<ExtArgs>
  }, ExtArgs["result"]["product"]>

  export type ProductSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    shopId?: boolean
    name?: boolean
    image?: boolean
    images?: boolean
    video?: boolean
    category?: boolean
    categoryId?: boolean
    brand?: boolean
    description?: boolean
    price?: boolean
    originalPrice?: boolean
    costPrice?: boolean
    stock?: boolean
    sales?: boolean
    status?: boolean
    sku?: boolean
    variationsText?: boolean
    hasVariations?: boolean
    variationGroups?: boolean
    variationRows?: boolean
    weight?: boolean
    length?: boolean
    width?: boolean
    height?: boolean
    condition?: boolean
    isPreOrder?: boolean
    preOrderDays?: boolean
    isViolated?: boolean
    violationReason?: boolean
    reportsCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    categoryRef?: boolean | Product$categoryRefArgs<ExtArgs>
  }, ExtArgs["result"]["product"]>

  export type ProductSelectScalar = {
    id?: boolean
    shopId?: boolean
    name?: boolean
    image?: boolean
    images?: boolean
    video?: boolean
    category?: boolean
    categoryId?: boolean
    brand?: boolean
    description?: boolean
    price?: boolean
    originalPrice?: boolean
    costPrice?: boolean
    stock?: boolean
    sales?: boolean
    status?: boolean
    sku?: boolean
    variationsText?: boolean
    hasVariations?: boolean
    variationGroups?: boolean
    variationRows?: boolean
    weight?: boolean
    length?: boolean
    width?: boolean
    height?: boolean
    condition?: boolean
    isPreOrder?: boolean
    preOrderDays?: boolean
    isViolated?: boolean
    violationReason?: boolean
    reportsCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ProductOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "shopId" | "name" | "image" | "images" | "video" | "category" | "categoryId" | "brand" | "description" | "price" | "originalPrice" | "costPrice" | "stock" | "sales" | "status" | "sku" | "variationsText" | "hasVariations" | "variationGroups" | "variationRows" | "weight" | "length" | "width" | "height" | "condition" | "isPreOrder" | "preOrderDays" | "isViolated" | "violationReason" | "reportsCount" | "createdAt" | "updatedAt", ExtArgs["result"]["product"]>
  export type ProductInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    categoryRef?: boolean | Product$categoryRefArgs<ExtArgs>
    priceHistories?: boolean | Product$priceHistoriesArgs<ExtArgs>
    costHistories?: boolean | Product$costHistoriesArgs<ExtArgs>
    _count?: boolean | ProductCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ProductIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    categoryRef?: boolean | Product$categoryRefArgs<ExtArgs>
  }
  export type ProductIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    categoryRef?: boolean | Product$categoryRefArgs<ExtArgs>
  }

  export type $ProductPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Product"
    objects: {
      categoryRef: Prisma.$CategoryPayload<ExtArgs> | null
      priceHistories: Prisma.$PriceHistoryPayload<ExtArgs>[]
      costHistories: Prisma.$CostPriceHistoryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      shopId: string
      name: string
      image: string | null
      images: string | null
      video: string | null
      category: string
      categoryId: string | null
      brand: string
      description: string
      price: string
      originalPrice: string | null
      costPrice: number | null
      stock: number
      sales: number
      status: string
      sku: string | null
      variationsText: string | null
      hasVariations: boolean
      variationGroups: string | null
      variationRows: string | null
      weight: string | null
      length: string | null
      width: string | null
      height: string | null
      condition: string
      isPreOrder: boolean
      preOrderDays: string | null
      isViolated: boolean
      violationReason: string | null
      reportsCount: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["product"]>
    composites: {}
  }

  type ProductGetPayload<S extends boolean | null | undefined | ProductDefaultArgs> = $Result.GetResult<Prisma.$ProductPayload, S>

  type ProductCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProductFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProductCountAggregateInputType | true
    }

  export interface ProductDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Product'], meta: { name: 'Product' } }
    /**
     * Find zero or one Product that matches the filter.
     * @param {ProductFindUniqueArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProductFindUniqueArgs>(args: SelectSubset<T, ProductFindUniqueArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Product that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProductFindUniqueOrThrowArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProductFindUniqueOrThrowArgs>(args: SelectSubset<T, ProductFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Product that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindFirstArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProductFindFirstArgs>(args?: SelectSubset<T, ProductFindFirstArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Product that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindFirstOrThrowArgs} args - Arguments to find a Product
     * @example
     * // Get one Product
     * const product = await prisma.product.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProductFindFirstOrThrowArgs>(args?: SelectSubset<T, ProductFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Products that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Products
     * const products = await prisma.product.findMany()
     * 
     * // Get first 10 Products
     * const products = await prisma.product.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const productWithIdOnly = await prisma.product.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProductFindManyArgs>(args?: SelectSubset<T, ProductFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Product.
     * @param {ProductCreateArgs} args - Arguments to create a Product.
     * @example
     * // Create one Product
     * const Product = await prisma.product.create({
     *   data: {
     *     // ... data to create a Product
     *   }
     * })
     * 
     */
    create<T extends ProductCreateArgs>(args: SelectSubset<T, ProductCreateArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Products.
     * @param {ProductCreateManyArgs} args - Arguments to create many Products.
     * @example
     * // Create many Products
     * const product = await prisma.product.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProductCreateManyArgs>(args?: SelectSubset<T, ProductCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Products and returns the data saved in the database.
     * @param {ProductCreateManyAndReturnArgs} args - Arguments to create many Products.
     * @example
     * // Create many Products
     * const product = await prisma.product.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Products and only return the `id`
     * const productWithIdOnly = await prisma.product.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProductCreateManyAndReturnArgs>(args?: SelectSubset<T, ProductCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Product.
     * @param {ProductDeleteArgs} args - Arguments to delete one Product.
     * @example
     * // Delete one Product
     * const Product = await prisma.product.delete({
     *   where: {
     *     // ... filter to delete one Product
     *   }
     * })
     * 
     */
    delete<T extends ProductDeleteArgs>(args: SelectSubset<T, ProductDeleteArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Product.
     * @param {ProductUpdateArgs} args - Arguments to update one Product.
     * @example
     * // Update one Product
     * const product = await prisma.product.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProductUpdateArgs>(args: SelectSubset<T, ProductUpdateArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Products.
     * @param {ProductDeleteManyArgs} args - Arguments to filter Products to delete.
     * @example
     * // Delete a few Products
     * const { count } = await prisma.product.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProductDeleteManyArgs>(args?: SelectSubset<T, ProductDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Products.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Products
     * const product = await prisma.product.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProductUpdateManyArgs>(args: SelectSubset<T, ProductUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Products and returns the data updated in the database.
     * @param {ProductUpdateManyAndReturnArgs} args - Arguments to update many Products.
     * @example
     * // Update many Products
     * const product = await prisma.product.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Products and only return the `id`
     * const productWithIdOnly = await prisma.product.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProductUpdateManyAndReturnArgs>(args: SelectSubset<T, ProductUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Product.
     * @param {ProductUpsertArgs} args - Arguments to update or create a Product.
     * @example
     * // Update or create a Product
     * const product = await prisma.product.upsert({
     *   create: {
     *     // ... data to create a Product
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Product we want to update
     *   }
     * })
     */
    upsert<T extends ProductUpsertArgs>(args: SelectSubset<T, ProductUpsertArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Products.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductCountArgs} args - Arguments to filter Products to count.
     * @example
     * // Count the number of Products
     * const count = await prisma.product.count({
     *   where: {
     *     // ... the filter for the Products we want to count
     *   }
     * })
    **/
    count<T extends ProductCountArgs>(
      args?: Subset<T, ProductCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProductCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Product.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProductAggregateArgs>(args: Subset<T, ProductAggregateArgs>): Prisma.PrismaPromise<GetProductAggregateType<T>>

    /**
     * Group by Product.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProductGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProductGroupByArgs['orderBy'] }
        : { orderBy?: ProductGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProductGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProductGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Product model
   */
  readonly fields: ProductFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Product.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProductClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    categoryRef<T extends Product$categoryRefArgs<ExtArgs> = {}>(args?: Subset<T, Product$categoryRefArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    priceHistories<T extends Product$priceHistoriesArgs<ExtArgs> = {}>(args?: Subset<T, Product$priceHistoriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PriceHistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    costHistories<T extends Product$costHistoriesArgs<ExtArgs> = {}>(args?: Subset<T, Product$costHistoriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CostPriceHistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Product model
   */
  interface ProductFieldRefs {
    readonly id: FieldRef<"Product", 'String'>
    readonly shopId: FieldRef<"Product", 'String'>
    readonly name: FieldRef<"Product", 'String'>
    readonly image: FieldRef<"Product", 'String'>
    readonly images: FieldRef<"Product", 'String'>
    readonly video: FieldRef<"Product", 'String'>
    readonly category: FieldRef<"Product", 'String'>
    readonly categoryId: FieldRef<"Product", 'String'>
    readonly brand: FieldRef<"Product", 'String'>
    readonly description: FieldRef<"Product", 'String'>
    readonly price: FieldRef<"Product", 'String'>
    readonly originalPrice: FieldRef<"Product", 'String'>
    readonly costPrice: FieldRef<"Product", 'Float'>
    readonly stock: FieldRef<"Product", 'Int'>
    readonly sales: FieldRef<"Product", 'Int'>
    readonly status: FieldRef<"Product", 'String'>
    readonly sku: FieldRef<"Product", 'String'>
    readonly variationsText: FieldRef<"Product", 'String'>
    readonly hasVariations: FieldRef<"Product", 'Boolean'>
    readonly variationGroups: FieldRef<"Product", 'String'>
    readonly variationRows: FieldRef<"Product", 'String'>
    readonly weight: FieldRef<"Product", 'String'>
    readonly length: FieldRef<"Product", 'String'>
    readonly width: FieldRef<"Product", 'String'>
    readonly height: FieldRef<"Product", 'String'>
    readonly condition: FieldRef<"Product", 'String'>
    readonly isPreOrder: FieldRef<"Product", 'Boolean'>
    readonly preOrderDays: FieldRef<"Product", 'String'>
    readonly isViolated: FieldRef<"Product", 'Boolean'>
    readonly violationReason: FieldRef<"Product", 'String'>
    readonly reportsCount: FieldRef<"Product", 'Int'>
    readonly createdAt: FieldRef<"Product", 'DateTime'>
    readonly updatedAt: FieldRef<"Product", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Product findUnique
   */
  export type ProductFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product findUniqueOrThrow
   */
  export type ProductFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product findFirst
   */
  export type ProductFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Products.
     */
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product findFirstOrThrow
   */
  export type ProductFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Product to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Products.
     */
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product findMany
   */
  export type ProductFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter, which Products to fetch.
     */
    where?: ProductWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Products to fetch.
     */
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Products.
     */
    cursor?: ProductWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Products from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Products.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Products.
     */
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Product create
   */
  export type ProductCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * The data needed to create a Product.
     */
    data: XOR<ProductCreateInput, ProductUncheckedCreateInput>
  }

  /**
   * Product createMany
   */
  export type ProductCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Products.
     */
    data: ProductCreateManyInput | ProductCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Product createManyAndReturn
   */
  export type ProductCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * The data used to create many Products.
     */
    data: ProductCreateManyInput | ProductCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Product update
   */
  export type ProductUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * The data needed to update a Product.
     */
    data: XOR<ProductUpdateInput, ProductUncheckedUpdateInput>
    /**
     * Choose, which Product to update.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product updateMany
   */
  export type ProductUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Products.
     */
    data: XOR<ProductUpdateManyMutationInput, ProductUncheckedUpdateManyInput>
    /**
     * Filter which Products to update
     */
    where?: ProductWhereInput
    /**
     * Limit how many Products to update.
     */
    limit?: number
  }

  /**
   * Product updateManyAndReturn
   */
  export type ProductUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * The data used to update Products.
     */
    data: XOR<ProductUpdateManyMutationInput, ProductUncheckedUpdateManyInput>
    /**
     * Filter which Products to update
     */
    where?: ProductWhereInput
    /**
     * Limit how many Products to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Product upsert
   */
  export type ProductUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * The filter to search for the Product to update in case it exists.
     */
    where: ProductWhereUniqueInput
    /**
     * In case the Product found by the `where` argument doesn't exist, create a new Product with this data.
     */
    create: XOR<ProductCreateInput, ProductUncheckedCreateInput>
    /**
     * In case the Product was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProductUpdateInput, ProductUncheckedUpdateInput>
  }

  /**
   * Product delete
   */
  export type ProductDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    /**
     * Filter which Product to delete.
     */
    where: ProductWhereUniqueInput
  }

  /**
   * Product deleteMany
   */
  export type ProductDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Products to delete
     */
    where?: ProductWhereInput
    /**
     * Limit how many Products to delete.
     */
    limit?: number
  }

  /**
   * Product.categoryRef
   */
  export type Product$categoryRefArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    where?: CategoryWhereInput
  }

  /**
   * Product.priceHistories
   */
  export type Product$priceHistoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceHistory
     */
    select?: PriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PriceHistory
     */
    omit?: PriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceHistoryInclude<ExtArgs> | null
    where?: PriceHistoryWhereInput
    orderBy?: PriceHistoryOrderByWithRelationInput | PriceHistoryOrderByWithRelationInput[]
    cursor?: PriceHistoryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PriceHistoryScalarFieldEnum | PriceHistoryScalarFieldEnum[]
  }

  /**
   * Product.costHistories
   */
  export type Product$costHistoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CostPriceHistory
     */
    select?: CostPriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CostPriceHistory
     */
    omit?: CostPriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CostPriceHistoryInclude<ExtArgs> | null
    where?: CostPriceHistoryWhereInput
    orderBy?: CostPriceHistoryOrderByWithRelationInput | CostPriceHistoryOrderByWithRelationInput[]
    cursor?: CostPriceHistoryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CostPriceHistoryScalarFieldEnum | CostPriceHistoryScalarFieldEnum[]
  }

  /**
   * Product without action
   */
  export type ProductDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
  }


  /**
   * Model PriceHistory
   */

  export type AggregatePriceHistory = {
    _count: PriceHistoryCountAggregateOutputType | null
    _avg: PriceHistoryAvgAggregateOutputType | null
    _sum: PriceHistorySumAggregateOutputType | null
    _min: PriceHistoryMinAggregateOutputType | null
    _max: PriceHistoryMaxAggregateOutputType | null
  }

  export type PriceHistoryAvgAggregateOutputType = {
    oldPrice: number | null
    newPrice: number | null
  }

  export type PriceHistorySumAggregateOutputType = {
    oldPrice: number | null
    newPrice: number | null
  }

  export type PriceHistoryMinAggregateOutputType = {
    id: string | null
    productId: string | null
    shopId: string | null
    oldPrice: number | null
    newPrice: number | null
    changeType: string | null
    changedBy: string | null
    changedByRole: string | null
    reason: string | null
    createdAt: Date | null
  }

  export type PriceHistoryMaxAggregateOutputType = {
    id: string | null
    productId: string | null
    shopId: string | null
    oldPrice: number | null
    newPrice: number | null
    changeType: string | null
    changedBy: string | null
    changedByRole: string | null
    reason: string | null
    createdAt: Date | null
  }

  export type PriceHistoryCountAggregateOutputType = {
    id: number
    productId: number
    shopId: number
    oldPrice: number
    newPrice: number
    changeType: number
    changedBy: number
    changedByRole: number
    reason: number
    createdAt: number
    _all: number
  }


  export type PriceHistoryAvgAggregateInputType = {
    oldPrice?: true
    newPrice?: true
  }

  export type PriceHistorySumAggregateInputType = {
    oldPrice?: true
    newPrice?: true
  }

  export type PriceHistoryMinAggregateInputType = {
    id?: true
    productId?: true
    shopId?: true
    oldPrice?: true
    newPrice?: true
    changeType?: true
    changedBy?: true
    changedByRole?: true
    reason?: true
    createdAt?: true
  }

  export type PriceHistoryMaxAggregateInputType = {
    id?: true
    productId?: true
    shopId?: true
    oldPrice?: true
    newPrice?: true
    changeType?: true
    changedBy?: true
    changedByRole?: true
    reason?: true
    createdAt?: true
  }

  export type PriceHistoryCountAggregateInputType = {
    id?: true
    productId?: true
    shopId?: true
    oldPrice?: true
    newPrice?: true
    changeType?: true
    changedBy?: true
    changedByRole?: true
    reason?: true
    createdAt?: true
    _all?: true
  }

  export type PriceHistoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PriceHistory to aggregate.
     */
    where?: PriceHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PriceHistories to fetch.
     */
    orderBy?: PriceHistoryOrderByWithRelationInput | PriceHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PriceHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PriceHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PriceHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PriceHistories
    **/
    _count?: true | PriceHistoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PriceHistoryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PriceHistorySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PriceHistoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PriceHistoryMaxAggregateInputType
  }

  export type GetPriceHistoryAggregateType<T extends PriceHistoryAggregateArgs> = {
        [P in keyof T & keyof AggregatePriceHistory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePriceHistory[P]>
      : GetScalarType<T[P], AggregatePriceHistory[P]>
  }




  export type PriceHistoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PriceHistoryWhereInput
    orderBy?: PriceHistoryOrderByWithAggregationInput | PriceHistoryOrderByWithAggregationInput[]
    by: PriceHistoryScalarFieldEnum[] | PriceHistoryScalarFieldEnum
    having?: PriceHistoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PriceHistoryCountAggregateInputType | true
    _avg?: PriceHistoryAvgAggregateInputType
    _sum?: PriceHistorySumAggregateInputType
    _min?: PriceHistoryMinAggregateInputType
    _max?: PriceHistoryMaxAggregateInputType
  }

  export type PriceHistoryGroupByOutputType = {
    id: string
    productId: string
    shopId: string
    oldPrice: number
    newPrice: number
    changeType: string
    changedBy: string
    changedByRole: string
    reason: string | null
    createdAt: Date
    _count: PriceHistoryCountAggregateOutputType | null
    _avg: PriceHistoryAvgAggregateOutputType | null
    _sum: PriceHistorySumAggregateOutputType | null
    _min: PriceHistoryMinAggregateOutputType | null
    _max: PriceHistoryMaxAggregateOutputType | null
  }

  type GetPriceHistoryGroupByPayload<T extends PriceHistoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PriceHistoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PriceHistoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PriceHistoryGroupByOutputType[P]>
            : GetScalarType<T[P], PriceHistoryGroupByOutputType[P]>
        }
      >
    >


  export type PriceHistorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    shopId?: boolean
    oldPrice?: boolean
    newPrice?: boolean
    changeType?: boolean
    changedBy?: boolean
    changedByRole?: boolean
    reason?: boolean
    createdAt?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["priceHistory"]>

  export type PriceHistorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    shopId?: boolean
    oldPrice?: boolean
    newPrice?: boolean
    changeType?: boolean
    changedBy?: boolean
    changedByRole?: boolean
    reason?: boolean
    createdAt?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["priceHistory"]>

  export type PriceHistorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    shopId?: boolean
    oldPrice?: boolean
    newPrice?: boolean
    changeType?: boolean
    changedBy?: boolean
    changedByRole?: boolean
    reason?: boolean
    createdAt?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["priceHistory"]>

  export type PriceHistorySelectScalar = {
    id?: boolean
    productId?: boolean
    shopId?: boolean
    oldPrice?: boolean
    newPrice?: boolean
    changeType?: boolean
    changedBy?: boolean
    changedByRole?: boolean
    reason?: boolean
    createdAt?: boolean
  }

  export type PriceHistoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "productId" | "shopId" | "oldPrice" | "newPrice" | "changeType" | "changedBy" | "changedByRole" | "reason" | "createdAt", ExtArgs["result"]["priceHistory"]>
  export type PriceHistoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }
  export type PriceHistoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }
  export type PriceHistoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }

  export type $PriceHistoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PriceHistory"
    objects: {
      product: Prisma.$ProductPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      productId: string
      shopId: string
      oldPrice: number
      newPrice: number
      changeType: string
      changedBy: string
      changedByRole: string
      reason: string | null
      createdAt: Date
    }, ExtArgs["result"]["priceHistory"]>
    composites: {}
  }

  type PriceHistoryGetPayload<S extends boolean | null | undefined | PriceHistoryDefaultArgs> = $Result.GetResult<Prisma.$PriceHistoryPayload, S>

  type PriceHistoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PriceHistoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PriceHistoryCountAggregateInputType | true
    }

  export interface PriceHistoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PriceHistory'], meta: { name: 'PriceHistory' } }
    /**
     * Find zero or one PriceHistory that matches the filter.
     * @param {PriceHistoryFindUniqueArgs} args - Arguments to find a PriceHistory
     * @example
     * // Get one PriceHistory
     * const priceHistory = await prisma.priceHistory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PriceHistoryFindUniqueArgs>(args: SelectSubset<T, PriceHistoryFindUniqueArgs<ExtArgs>>): Prisma__PriceHistoryClient<$Result.GetResult<Prisma.$PriceHistoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PriceHistory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PriceHistoryFindUniqueOrThrowArgs} args - Arguments to find a PriceHistory
     * @example
     * // Get one PriceHistory
     * const priceHistory = await prisma.priceHistory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PriceHistoryFindUniqueOrThrowArgs>(args: SelectSubset<T, PriceHistoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PriceHistoryClient<$Result.GetResult<Prisma.$PriceHistoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PriceHistory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceHistoryFindFirstArgs} args - Arguments to find a PriceHistory
     * @example
     * // Get one PriceHistory
     * const priceHistory = await prisma.priceHistory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PriceHistoryFindFirstArgs>(args?: SelectSubset<T, PriceHistoryFindFirstArgs<ExtArgs>>): Prisma__PriceHistoryClient<$Result.GetResult<Prisma.$PriceHistoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PriceHistory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceHistoryFindFirstOrThrowArgs} args - Arguments to find a PriceHistory
     * @example
     * // Get one PriceHistory
     * const priceHistory = await prisma.priceHistory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PriceHistoryFindFirstOrThrowArgs>(args?: SelectSubset<T, PriceHistoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__PriceHistoryClient<$Result.GetResult<Prisma.$PriceHistoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PriceHistories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceHistoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PriceHistories
     * const priceHistories = await prisma.priceHistory.findMany()
     * 
     * // Get first 10 PriceHistories
     * const priceHistories = await prisma.priceHistory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const priceHistoryWithIdOnly = await prisma.priceHistory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PriceHistoryFindManyArgs>(args?: SelectSubset<T, PriceHistoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PriceHistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PriceHistory.
     * @param {PriceHistoryCreateArgs} args - Arguments to create a PriceHistory.
     * @example
     * // Create one PriceHistory
     * const PriceHistory = await prisma.priceHistory.create({
     *   data: {
     *     // ... data to create a PriceHistory
     *   }
     * })
     * 
     */
    create<T extends PriceHistoryCreateArgs>(args: SelectSubset<T, PriceHistoryCreateArgs<ExtArgs>>): Prisma__PriceHistoryClient<$Result.GetResult<Prisma.$PriceHistoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PriceHistories.
     * @param {PriceHistoryCreateManyArgs} args - Arguments to create many PriceHistories.
     * @example
     * // Create many PriceHistories
     * const priceHistory = await prisma.priceHistory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PriceHistoryCreateManyArgs>(args?: SelectSubset<T, PriceHistoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PriceHistories and returns the data saved in the database.
     * @param {PriceHistoryCreateManyAndReturnArgs} args - Arguments to create many PriceHistories.
     * @example
     * // Create many PriceHistories
     * const priceHistory = await prisma.priceHistory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PriceHistories and only return the `id`
     * const priceHistoryWithIdOnly = await prisma.priceHistory.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PriceHistoryCreateManyAndReturnArgs>(args?: SelectSubset<T, PriceHistoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PriceHistoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PriceHistory.
     * @param {PriceHistoryDeleteArgs} args - Arguments to delete one PriceHistory.
     * @example
     * // Delete one PriceHistory
     * const PriceHistory = await prisma.priceHistory.delete({
     *   where: {
     *     // ... filter to delete one PriceHistory
     *   }
     * })
     * 
     */
    delete<T extends PriceHistoryDeleteArgs>(args: SelectSubset<T, PriceHistoryDeleteArgs<ExtArgs>>): Prisma__PriceHistoryClient<$Result.GetResult<Prisma.$PriceHistoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PriceHistory.
     * @param {PriceHistoryUpdateArgs} args - Arguments to update one PriceHistory.
     * @example
     * // Update one PriceHistory
     * const priceHistory = await prisma.priceHistory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PriceHistoryUpdateArgs>(args: SelectSubset<T, PriceHistoryUpdateArgs<ExtArgs>>): Prisma__PriceHistoryClient<$Result.GetResult<Prisma.$PriceHistoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PriceHistories.
     * @param {PriceHistoryDeleteManyArgs} args - Arguments to filter PriceHistories to delete.
     * @example
     * // Delete a few PriceHistories
     * const { count } = await prisma.priceHistory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PriceHistoryDeleteManyArgs>(args?: SelectSubset<T, PriceHistoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PriceHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceHistoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PriceHistories
     * const priceHistory = await prisma.priceHistory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PriceHistoryUpdateManyArgs>(args: SelectSubset<T, PriceHistoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PriceHistories and returns the data updated in the database.
     * @param {PriceHistoryUpdateManyAndReturnArgs} args - Arguments to update many PriceHistories.
     * @example
     * // Update many PriceHistories
     * const priceHistory = await prisma.priceHistory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PriceHistories and only return the `id`
     * const priceHistoryWithIdOnly = await prisma.priceHistory.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PriceHistoryUpdateManyAndReturnArgs>(args: SelectSubset<T, PriceHistoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PriceHistoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PriceHistory.
     * @param {PriceHistoryUpsertArgs} args - Arguments to update or create a PriceHistory.
     * @example
     * // Update or create a PriceHistory
     * const priceHistory = await prisma.priceHistory.upsert({
     *   create: {
     *     // ... data to create a PriceHistory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PriceHistory we want to update
     *   }
     * })
     */
    upsert<T extends PriceHistoryUpsertArgs>(args: SelectSubset<T, PriceHistoryUpsertArgs<ExtArgs>>): Prisma__PriceHistoryClient<$Result.GetResult<Prisma.$PriceHistoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PriceHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceHistoryCountArgs} args - Arguments to filter PriceHistories to count.
     * @example
     * // Count the number of PriceHistories
     * const count = await prisma.priceHistory.count({
     *   where: {
     *     // ... the filter for the PriceHistories we want to count
     *   }
     * })
    **/
    count<T extends PriceHistoryCountArgs>(
      args?: Subset<T, PriceHistoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PriceHistoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PriceHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceHistoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PriceHistoryAggregateArgs>(args: Subset<T, PriceHistoryAggregateArgs>): Prisma.PrismaPromise<GetPriceHistoryAggregateType<T>>

    /**
     * Group by PriceHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PriceHistoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PriceHistoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PriceHistoryGroupByArgs['orderBy'] }
        : { orderBy?: PriceHistoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PriceHistoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPriceHistoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PriceHistory model
   */
  readonly fields: PriceHistoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PriceHistory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PriceHistoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    product<T extends ProductDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProductDefaultArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PriceHistory model
   */
  interface PriceHistoryFieldRefs {
    readonly id: FieldRef<"PriceHistory", 'String'>
    readonly productId: FieldRef<"PriceHistory", 'String'>
    readonly shopId: FieldRef<"PriceHistory", 'String'>
    readonly oldPrice: FieldRef<"PriceHistory", 'Float'>
    readonly newPrice: FieldRef<"PriceHistory", 'Float'>
    readonly changeType: FieldRef<"PriceHistory", 'String'>
    readonly changedBy: FieldRef<"PriceHistory", 'String'>
    readonly changedByRole: FieldRef<"PriceHistory", 'String'>
    readonly reason: FieldRef<"PriceHistory", 'String'>
    readonly createdAt: FieldRef<"PriceHistory", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PriceHistory findUnique
   */
  export type PriceHistoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceHistory
     */
    select?: PriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PriceHistory
     */
    omit?: PriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceHistoryInclude<ExtArgs> | null
    /**
     * Filter, which PriceHistory to fetch.
     */
    where: PriceHistoryWhereUniqueInput
  }

  /**
   * PriceHistory findUniqueOrThrow
   */
  export type PriceHistoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceHistory
     */
    select?: PriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PriceHistory
     */
    omit?: PriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceHistoryInclude<ExtArgs> | null
    /**
     * Filter, which PriceHistory to fetch.
     */
    where: PriceHistoryWhereUniqueInput
  }

  /**
   * PriceHistory findFirst
   */
  export type PriceHistoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceHistory
     */
    select?: PriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PriceHistory
     */
    omit?: PriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceHistoryInclude<ExtArgs> | null
    /**
     * Filter, which PriceHistory to fetch.
     */
    where?: PriceHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PriceHistories to fetch.
     */
    orderBy?: PriceHistoryOrderByWithRelationInput | PriceHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PriceHistories.
     */
    cursor?: PriceHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PriceHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PriceHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PriceHistories.
     */
    distinct?: PriceHistoryScalarFieldEnum | PriceHistoryScalarFieldEnum[]
  }

  /**
   * PriceHistory findFirstOrThrow
   */
  export type PriceHistoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceHistory
     */
    select?: PriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PriceHistory
     */
    omit?: PriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceHistoryInclude<ExtArgs> | null
    /**
     * Filter, which PriceHistory to fetch.
     */
    where?: PriceHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PriceHistories to fetch.
     */
    orderBy?: PriceHistoryOrderByWithRelationInput | PriceHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PriceHistories.
     */
    cursor?: PriceHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PriceHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PriceHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PriceHistories.
     */
    distinct?: PriceHistoryScalarFieldEnum | PriceHistoryScalarFieldEnum[]
  }

  /**
   * PriceHistory findMany
   */
  export type PriceHistoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceHistory
     */
    select?: PriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PriceHistory
     */
    omit?: PriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceHistoryInclude<ExtArgs> | null
    /**
     * Filter, which PriceHistories to fetch.
     */
    where?: PriceHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PriceHistories to fetch.
     */
    orderBy?: PriceHistoryOrderByWithRelationInput | PriceHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PriceHistories.
     */
    cursor?: PriceHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PriceHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PriceHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PriceHistories.
     */
    distinct?: PriceHistoryScalarFieldEnum | PriceHistoryScalarFieldEnum[]
  }

  /**
   * PriceHistory create
   */
  export type PriceHistoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceHistory
     */
    select?: PriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PriceHistory
     */
    omit?: PriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceHistoryInclude<ExtArgs> | null
    /**
     * The data needed to create a PriceHistory.
     */
    data: XOR<PriceHistoryCreateInput, PriceHistoryUncheckedCreateInput>
  }

  /**
   * PriceHistory createMany
   */
  export type PriceHistoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PriceHistories.
     */
    data: PriceHistoryCreateManyInput | PriceHistoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PriceHistory createManyAndReturn
   */
  export type PriceHistoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceHistory
     */
    select?: PriceHistorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PriceHistory
     */
    omit?: PriceHistoryOmit<ExtArgs> | null
    /**
     * The data used to create many PriceHistories.
     */
    data: PriceHistoryCreateManyInput | PriceHistoryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceHistoryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PriceHistory update
   */
  export type PriceHistoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceHistory
     */
    select?: PriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PriceHistory
     */
    omit?: PriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceHistoryInclude<ExtArgs> | null
    /**
     * The data needed to update a PriceHistory.
     */
    data: XOR<PriceHistoryUpdateInput, PriceHistoryUncheckedUpdateInput>
    /**
     * Choose, which PriceHistory to update.
     */
    where: PriceHistoryWhereUniqueInput
  }

  /**
   * PriceHistory updateMany
   */
  export type PriceHistoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PriceHistories.
     */
    data: XOR<PriceHistoryUpdateManyMutationInput, PriceHistoryUncheckedUpdateManyInput>
    /**
     * Filter which PriceHistories to update
     */
    where?: PriceHistoryWhereInput
    /**
     * Limit how many PriceHistories to update.
     */
    limit?: number
  }

  /**
   * PriceHistory updateManyAndReturn
   */
  export type PriceHistoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceHistory
     */
    select?: PriceHistorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PriceHistory
     */
    omit?: PriceHistoryOmit<ExtArgs> | null
    /**
     * The data used to update PriceHistories.
     */
    data: XOR<PriceHistoryUpdateManyMutationInput, PriceHistoryUncheckedUpdateManyInput>
    /**
     * Filter which PriceHistories to update
     */
    where?: PriceHistoryWhereInput
    /**
     * Limit how many PriceHistories to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceHistoryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PriceHistory upsert
   */
  export type PriceHistoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceHistory
     */
    select?: PriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PriceHistory
     */
    omit?: PriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceHistoryInclude<ExtArgs> | null
    /**
     * The filter to search for the PriceHistory to update in case it exists.
     */
    where: PriceHistoryWhereUniqueInput
    /**
     * In case the PriceHistory found by the `where` argument doesn't exist, create a new PriceHistory with this data.
     */
    create: XOR<PriceHistoryCreateInput, PriceHistoryUncheckedCreateInput>
    /**
     * In case the PriceHistory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PriceHistoryUpdateInput, PriceHistoryUncheckedUpdateInput>
  }

  /**
   * PriceHistory delete
   */
  export type PriceHistoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceHistory
     */
    select?: PriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PriceHistory
     */
    omit?: PriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceHistoryInclude<ExtArgs> | null
    /**
     * Filter which PriceHistory to delete.
     */
    where: PriceHistoryWhereUniqueInput
  }

  /**
   * PriceHistory deleteMany
   */
  export type PriceHistoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PriceHistories to delete
     */
    where?: PriceHistoryWhereInput
    /**
     * Limit how many PriceHistories to delete.
     */
    limit?: number
  }

  /**
   * PriceHistory without action
   */
  export type PriceHistoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PriceHistory
     */
    select?: PriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PriceHistory
     */
    omit?: PriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PriceHistoryInclude<ExtArgs> | null
  }


  /**
   * Model CostPriceHistory
   */

  export type AggregateCostPriceHistory = {
    _count: CostPriceHistoryCountAggregateOutputType | null
    _avg: CostPriceHistoryAvgAggregateOutputType | null
    _sum: CostPriceHistorySumAggregateOutputType | null
    _min: CostPriceHistoryMinAggregateOutputType | null
    _max: CostPriceHistoryMaxAggregateOutputType | null
  }

  export type CostPriceHistoryAvgAggregateOutputType = {
    costPrice: number | null
    quantity: number | null
  }

  export type CostPriceHistorySumAggregateOutputType = {
    costPrice: number | null
    quantity: number | null
  }

  export type CostPriceHistoryMinAggregateOutputType = {
    id: string | null
    productId: string | null
    shopId: string | null
    costPrice: number | null
    quantity: number | null
    invoiceCode: string | null
    supplier: string | null
    note: string | null
    importedBy: string | null
    importDate: Date | null
    createdAt: Date | null
  }

  export type CostPriceHistoryMaxAggregateOutputType = {
    id: string | null
    productId: string | null
    shopId: string | null
    costPrice: number | null
    quantity: number | null
    invoiceCode: string | null
    supplier: string | null
    note: string | null
    importedBy: string | null
    importDate: Date | null
    createdAt: Date | null
  }

  export type CostPriceHistoryCountAggregateOutputType = {
    id: number
    productId: number
    shopId: number
    costPrice: number
    quantity: number
    invoiceCode: number
    supplier: number
    note: number
    importedBy: number
    importDate: number
    createdAt: number
    _all: number
  }


  export type CostPriceHistoryAvgAggregateInputType = {
    costPrice?: true
    quantity?: true
  }

  export type CostPriceHistorySumAggregateInputType = {
    costPrice?: true
    quantity?: true
  }

  export type CostPriceHistoryMinAggregateInputType = {
    id?: true
    productId?: true
    shopId?: true
    costPrice?: true
    quantity?: true
    invoiceCode?: true
    supplier?: true
    note?: true
    importedBy?: true
    importDate?: true
    createdAt?: true
  }

  export type CostPriceHistoryMaxAggregateInputType = {
    id?: true
    productId?: true
    shopId?: true
    costPrice?: true
    quantity?: true
    invoiceCode?: true
    supplier?: true
    note?: true
    importedBy?: true
    importDate?: true
    createdAt?: true
  }

  export type CostPriceHistoryCountAggregateInputType = {
    id?: true
    productId?: true
    shopId?: true
    costPrice?: true
    quantity?: true
    invoiceCode?: true
    supplier?: true
    note?: true
    importedBy?: true
    importDate?: true
    createdAt?: true
    _all?: true
  }

  export type CostPriceHistoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CostPriceHistory to aggregate.
     */
    where?: CostPriceHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CostPriceHistories to fetch.
     */
    orderBy?: CostPriceHistoryOrderByWithRelationInput | CostPriceHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CostPriceHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CostPriceHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CostPriceHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CostPriceHistories
    **/
    _count?: true | CostPriceHistoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CostPriceHistoryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CostPriceHistorySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CostPriceHistoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CostPriceHistoryMaxAggregateInputType
  }

  export type GetCostPriceHistoryAggregateType<T extends CostPriceHistoryAggregateArgs> = {
        [P in keyof T & keyof AggregateCostPriceHistory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCostPriceHistory[P]>
      : GetScalarType<T[P], AggregateCostPriceHistory[P]>
  }




  export type CostPriceHistoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CostPriceHistoryWhereInput
    orderBy?: CostPriceHistoryOrderByWithAggregationInput | CostPriceHistoryOrderByWithAggregationInput[]
    by: CostPriceHistoryScalarFieldEnum[] | CostPriceHistoryScalarFieldEnum
    having?: CostPriceHistoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CostPriceHistoryCountAggregateInputType | true
    _avg?: CostPriceHistoryAvgAggregateInputType
    _sum?: CostPriceHistorySumAggregateInputType
    _min?: CostPriceHistoryMinAggregateInputType
    _max?: CostPriceHistoryMaxAggregateInputType
  }

  export type CostPriceHistoryGroupByOutputType = {
    id: string
    productId: string
    shopId: string
    costPrice: number
    quantity: number
    invoiceCode: string | null
    supplier: string | null
    note: string | null
    importedBy: string
    importDate: Date
    createdAt: Date
    _count: CostPriceHistoryCountAggregateOutputType | null
    _avg: CostPriceHistoryAvgAggregateOutputType | null
    _sum: CostPriceHistorySumAggregateOutputType | null
    _min: CostPriceHistoryMinAggregateOutputType | null
    _max: CostPriceHistoryMaxAggregateOutputType | null
  }

  type GetCostPriceHistoryGroupByPayload<T extends CostPriceHistoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CostPriceHistoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CostPriceHistoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CostPriceHistoryGroupByOutputType[P]>
            : GetScalarType<T[P], CostPriceHistoryGroupByOutputType[P]>
        }
      >
    >


  export type CostPriceHistorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    shopId?: boolean
    costPrice?: boolean
    quantity?: boolean
    invoiceCode?: boolean
    supplier?: boolean
    note?: boolean
    importedBy?: boolean
    importDate?: boolean
    createdAt?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["costPriceHistory"]>

  export type CostPriceHistorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    shopId?: boolean
    costPrice?: boolean
    quantity?: boolean
    invoiceCode?: boolean
    supplier?: boolean
    note?: boolean
    importedBy?: boolean
    importDate?: boolean
    createdAt?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["costPriceHistory"]>

  export type CostPriceHistorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    shopId?: boolean
    costPrice?: boolean
    quantity?: boolean
    invoiceCode?: boolean
    supplier?: boolean
    note?: boolean
    importedBy?: boolean
    importDate?: boolean
    createdAt?: boolean
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["costPriceHistory"]>

  export type CostPriceHistorySelectScalar = {
    id?: boolean
    productId?: boolean
    shopId?: boolean
    costPrice?: boolean
    quantity?: boolean
    invoiceCode?: boolean
    supplier?: boolean
    note?: boolean
    importedBy?: boolean
    importDate?: boolean
    createdAt?: boolean
  }

  export type CostPriceHistoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "productId" | "shopId" | "costPrice" | "quantity" | "invoiceCode" | "supplier" | "note" | "importedBy" | "importDate" | "createdAt", ExtArgs["result"]["costPriceHistory"]>
  export type CostPriceHistoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }
  export type CostPriceHistoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }
  export type CostPriceHistoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    product?: boolean | ProductDefaultArgs<ExtArgs>
  }

  export type $CostPriceHistoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CostPriceHistory"
    objects: {
      product: Prisma.$ProductPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      productId: string
      shopId: string
      costPrice: number
      quantity: number
      invoiceCode: string | null
      supplier: string | null
      note: string | null
      importedBy: string
      importDate: Date
      createdAt: Date
    }, ExtArgs["result"]["costPriceHistory"]>
    composites: {}
  }

  type CostPriceHistoryGetPayload<S extends boolean | null | undefined | CostPriceHistoryDefaultArgs> = $Result.GetResult<Prisma.$CostPriceHistoryPayload, S>

  type CostPriceHistoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CostPriceHistoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CostPriceHistoryCountAggregateInputType | true
    }

  export interface CostPriceHistoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CostPriceHistory'], meta: { name: 'CostPriceHistory' } }
    /**
     * Find zero or one CostPriceHistory that matches the filter.
     * @param {CostPriceHistoryFindUniqueArgs} args - Arguments to find a CostPriceHistory
     * @example
     * // Get one CostPriceHistory
     * const costPriceHistory = await prisma.costPriceHistory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CostPriceHistoryFindUniqueArgs>(args: SelectSubset<T, CostPriceHistoryFindUniqueArgs<ExtArgs>>): Prisma__CostPriceHistoryClient<$Result.GetResult<Prisma.$CostPriceHistoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CostPriceHistory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CostPriceHistoryFindUniqueOrThrowArgs} args - Arguments to find a CostPriceHistory
     * @example
     * // Get one CostPriceHistory
     * const costPriceHistory = await prisma.costPriceHistory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CostPriceHistoryFindUniqueOrThrowArgs>(args: SelectSubset<T, CostPriceHistoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CostPriceHistoryClient<$Result.GetResult<Prisma.$CostPriceHistoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CostPriceHistory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CostPriceHistoryFindFirstArgs} args - Arguments to find a CostPriceHistory
     * @example
     * // Get one CostPriceHistory
     * const costPriceHistory = await prisma.costPriceHistory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CostPriceHistoryFindFirstArgs>(args?: SelectSubset<T, CostPriceHistoryFindFirstArgs<ExtArgs>>): Prisma__CostPriceHistoryClient<$Result.GetResult<Prisma.$CostPriceHistoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CostPriceHistory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CostPriceHistoryFindFirstOrThrowArgs} args - Arguments to find a CostPriceHistory
     * @example
     * // Get one CostPriceHistory
     * const costPriceHistory = await prisma.costPriceHistory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CostPriceHistoryFindFirstOrThrowArgs>(args?: SelectSubset<T, CostPriceHistoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__CostPriceHistoryClient<$Result.GetResult<Prisma.$CostPriceHistoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CostPriceHistories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CostPriceHistoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CostPriceHistories
     * const costPriceHistories = await prisma.costPriceHistory.findMany()
     * 
     * // Get first 10 CostPriceHistories
     * const costPriceHistories = await prisma.costPriceHistory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const costPriceHistoryWithIdOnly = await prisma.costPriceHistory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CostPriceHistoryFindManyArgs>(args?: SelectSubset<T, CostPriceHistoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CostPriceHistoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CostPriceHistory.
     * @param {CostPriceHistoryCreateArgs} args - Arguments to create a CostPriceHistory.
     * @example
     * // Create one CostPriceHistory
     * const CostPriceHistory = await prisma.costPriceHistory.create({
     *   data: {
     *     // ... data to create a CostPriceHistory
     *   }
     * })
     * 
     */
    create<T extends CostPriceHistoryCreateArgs>(args: SelectSubset<T, CostPriceHistoryCreateArgs<ExtArgs>>): Prisma__CostPriceHistoryClient<$Result.GetResult<Prisma.$CostPriceHistoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CostPriceHistories.
     * @param {CostPriceHistoryCreateManyArgs} args - Arguments to create many CostPriceHistories.
     * @example
     * // Create many CostPriceHistories
     * const costPriceHistory = await prisma.costPriceHistory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CostPriceHistoryCreateManyArgs>(args?: SelectSubset<T, CostPriceHistoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CostPriceHistories and returns the data saved in the database.
     * @param {CostPriceHistoryCreateManyAndReturnArgs} args - Arguments to create many CostPriceHistories.
     * @example
     * // Create many CostPriceHistories
     * const costPriceHistory = await prisma.costPriceHistory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CostPriceHistories and only return the `id`
     * const costPriceHistoryWithIdOnly = await prisma.costPriceHistory.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CostPriceHistoryCreateManyAndReturnArgs>(args?: SelectSubset<T, CostPriceHistoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CostPriceHistoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CostPriceHistory.
     * @param {CostPriceHistoryDeleteArgs} args - Arguments to delete one CostPriceHistory.
     * @example
     * // Delete one CostPriceHistory
     * const CostPriceHistory = await prisma.costPriceHistory.delete({
     *   where: {
     *     // ... filter to delete one CostPriceHistory
     *   }
     * })
     * 
     */
    delete<T extends CostPriceHistoryDeleteArgs>(args: SelectSubset<T, CostPriceHistoryDeleteArgs<ExtArgs>>): Prisma__CostPriceHistoryClient<$Result.GetResult<Prisma.$CostPriceHistoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CostPriceHistory.
     * @param {CostPriceHistoryUpdateArgs} args - Arguments to update one CostPriceHistory.
     * @example
     * // Update one CostPriceHistory
     * const costPriceHistory = await prisma.costPriceHistory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CostPriceHistoryUpdateArgs>(args: SelectSubset<T, CostPriceHistoryUpdateArgs<ExtArgs>>): Prisma__CostPriceHistoryClient<$Result.GetResult<Prisma.$CostPriceHistoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CostPriceHistories.
     * @param {CostPriceHistoryDeleteManyArgs} args - Arguments to filter CostPriceHistories to delete.
     * @example
     * // Delete a few CostPriceHistories
     * const { count } = await prisma.costPriceHistory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CostPriceHistoryDeleteManyArgs>(args?: SelectSubset<T, CostPriceHistoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CostPriceHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CostPriceHistoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CostPriceHistories
     * const costPriceHistory = await prisma.costPriceHistory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CostPriceHistoryUpdateManyArgs>(args: SelectSubset<T, CostPriceHistoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CostPriceHistories and returns the data updated in the database.
     * @param {CostPriceHistoryUpdateManyAndReturnArgs} args - Arguments to update many CostPriceHistories.
     * @example
     * // Update many CostPriceHistories
     * const costPriceHistory = await prisma.costPriceHistory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CostPriceHistories and only return the `id`
     * const costPriceHistoryWithIdOnly = await prisma.costPriceHistory.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CostPriceHistoryUpdateManyAndReturnArgs>(args: SelectSubset<T, CostPriceHistoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CostPriceHistoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CostPriceHistory.
     * @param {CostPriceHistoryUpsertArgs} args - Arguments to update or create a CostPriceHistory.
     * @example
     * // Update or create a CostPriceHistory
     * const costPriceHistory = await prisma.costPriceHistory.upsert({
     *   create: {
     *     // ... data to create a CostPriceHistory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CostPriceHistory we want to update
     *   }
     * })
     */
    upsert<T extends CostPriceHistoryUpsertArgs>(args: SelectSubset<T, CostPriceHistoryUpsertArgs<ExtArgs>>): Prisma__CostPriceHistoryClient<$Result.GetResult<Prisma.$CostPriceHistoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CostPriceHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CostPriceHistoryCountArgs} args - Arguments to filter CostPriceHistories to count.
     * @example
     * // Count the number of CostPriceHistories
     * const count = await prisma.costPriceHistory.count({
     *   where: {
     *     // ... the filter for the CostPriceHistories we want to count
     *   }
     * })
    **/
    count<T extends CostPriceHistoryCountArgs>(
      args?: Subset<T, CostPriceHistoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CostPriceHistoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CostPriceHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CostPriceHistoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CostPriceHistoryAggregateArgs>(args: Subset<T, CostPriceHistoryAggregateArgs>): Prisma.PrismaPromise<GetCostPriceHistoryAggregateType<T>>

    /**
     * Group by CostPriceHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CostPriceHistoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CostPriceHistoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CostPriceHistoryGroupByArgs['orderBy'] }
        : { orderBy?: CostPriceHistoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CostPriceHistoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCostPriceHistoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CostPriceHistory model
   */
  readonly fields: CostPriceHistoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CostPriceHistory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CostPriceHistoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    product<T extends ProductDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProductDefaultArgs<ExtArgs>>): Prisma__ProductClient<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CostPriceHistory model
   */
  interface CostPriceHistoryFieldRefs {
    readonly id: FieldRef<"CostPriceHistory", 'String'>
    readonly productId: FieldRef<"CostPriceHistory", 'String'>
    readonly shopId: FieldRef<"CostPriceHistory", 'String'>
    readonly costPrice: FieldRef<"CostPriceHistory", 'Float'>
    readonly quantity: FieldRef<"CostPriceHistory", 'Int'>
    readonly invoiceCode: FieldRef<"CostPriceHistory", 'String'>
    readonly supplier: FieldRef<"CostPriceHistory", 'String'>
    readonly note: FieldRef<"CostPriceHistory", 'String'>
    readonly importedBy: FieldRef<"CostPriceHistory", 'String'>
    readonly importDate: FieldRef<"CostPriceHistory", 'DateTime'>
    readonly createdAt: FieldRef<"CostPriceHistory", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CostPriceHistory findUnique
   */
  export type CostPriceHistoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CostPriceHistory
     */
    select?: CostPriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CostPriceHistory
     */
    omit?: CostPriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CostPriceHistoryInclude<ExtArgs> | null
    /**
     * Filter, which CostPriceHistory to fetch.
     */
    where: CostPriceHistoryWhereUniqueInput
  }

  /**
   * CostPriceHistory findUniqueOrThrow
   */
  export type CostPriceHistoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CostPriceHistory
     */
    select?: CostPriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CostPriceHistory
     */
    omit?: CostPriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CostPriceHistoryInclude<ExtArgs> | null
    /**
     * Filter, which CostPriceHistory to fetch.
     */
    where: CostPriceHistoryWhereUniqueInput
  }

  /**
   * CostPriceHistory findFirst
   */
  export type CostPriceHistoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CostPriceHistory
     */
    select?: CostPriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CostPriceHistory
     */
    omit?: CostPriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CostPriceHistoryInclude<ExtArgs> | null
    /**
     * Filter, which CostPriceHistory to fetch.
     */
    where?: CostPriceHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CostPriceHistories to fetch.
     */
    orderBy?: CostPriceHistoryOrderByWithRelationInput | CostPriceHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CostPriceHistories.
     */
    cursor?: CostPriceHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CostPriceHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CostPriceHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CostPriceHistories.
     */
    distinct?: CostPriceHistoryScalarFieldEnum | CostPriceHistoryScalarFieldEnum[]
  }

  /**
   * CostPriceHistory findFirstOrThrow
   */
  export type CostPriceHistoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CostPriceHistory
     */
    select?: CostPriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CostPriceHistory
     */
    omit?: CostPriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CostPriceHistoryInclude<ExtArgs> | null
    /**
     * Filter, which CostPriceHistory to fetch.
     */
    where?: CostPriceHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CostPriceHistories to fetch.
     */
    orderBy?: CostPriceHistoryOrderByWithRelationInput | CostPriceHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CostPriceHistories.
     */
    cursor?: CostPriceHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CostPriceHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CostPriceHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CostPriceHistories.
     */
    distinct?: CostPriceHistoryScalarFieldEnum | CostPriceHistoryScalarFieldEnum[]
  }

  /**
   * CostPriceHistory findMany
   */
  export type CostPriceHistoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CostPriceHistory
     */
    select?: CostPriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CostPriceHistory
     */
    omit?: CostPriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CostPriceHistoryInclude<ExtArgs> | null
    /**
     * Filter, which CostPriceHistories to fetch.
     */
    where?: CostPriceHistoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CostPriceHistories to fetch.
     */
    orderBy?: CostPriceHistoryOrderByWithRelationInput | CostPriceHistoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CostPriceHistories.
     */
    cursor?: CostPriceHistoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CostPriceHistories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CostPriceHistories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CostPriceHistories.
     */
    distinct?: CostPriceHistoryScalarFieldEnum | CostPriceHistoryScalarFieldEnum[]
  }

  /**
   * CostPriceHistory create
   */
  export type CostPriceHistoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CostPriceHistory
     */
    select?: CostPriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CostPriceHistory
     */
    omit?: CostPriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CostPriceHistoryInclude<ExtArgs> | null
    /**
     * The data needed to create a CostPriceHistory.
     */
    data: XOR<CostPriceHistoryCreateInput, CostPriceHistoryUncheckedCreateInput>
  }

  /**
   * CostPriceHistory createMany
   */
  export type CostPriceHistoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CostPriceHistories.
     */
    data: CostPriceHistoryCreateManyInput | CostPriceHistoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CostPriceHistory createManyAndReturn
   */
  export type CostPriceHistoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CostPriceHistory
     */
    select?: CostPriceHistorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CostPriceHistory
     */
    omit?: CostPriceHistoryOmit<ExtArgs> | null
    /**
     * The data used to create many CostPriceHistories.
     */
    data: CostPriceHistoryCreateManyInput | CostPriceHistoryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CostPriceHistoryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CostPriceHistory update
   */
  export type CostPriceHistoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CostPriceHistory
     */
    select?: CostPriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CostPriceHistory
     */
    omit?: CostPriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CostPriceHistoryInclude<ExtArgs> | null
    /**
     * The data needed to update a CostPriceHistory.
     */
    data: XOR<CostPriceHistoryUpdateInput, CostPriceHistoryUncheckedUpdateInput>
    /**
     * Choose, which CostPriceHistory to update.
     */
    where: CostPriceHistoryWhereUniqueInput
  }

  /**
   * CostPriceHistory updateMany
   */
  export type CostPriceHistoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CostPriceHistories.
     */
    data: XOR<CostPriceHistoryUpdateManyMutationInput, CostPriceHistoryUncheckedUpdateManyInput>
    /**
     * Filter which CostPriceHistories to update
     */
    where?: CostPriceHistoryWhereInput
    /**
     * Limit how many CostPriceHistories to update.
     */
    limit?: number
  }

  /**
   * CostPriceHistory updateManyAndReturn
   */
  export type CostPriceHistoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CostPriceHistory
     */
    select?: CostPriceHistorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CostPriceHistory
     */
    omit?: CostPriceHistoryOmit<ExtArgs> | null
    /**
     * The data used to update CostPriceHistories.
     */
    data: XOR<CostPriceHistoryUpdateManyMutationInput, CostPriceHistoryUncheckedUpdateManyInput>
    /**
     * Filter which CostPriceHistories to update
     */
    where?: CostPriceHistoryWhereInput
    /**
     * Limit how many CostPriceHistories to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CostPriceHistoryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CostPriceHistory upsert
   */
  export type CostPriceHistoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CostPriceHistory
     */
    select?: CostPriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CostPriceHistory
     */
    omit?: CostPriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CostPriceHistoryInclude<ExtArgs> | null
    /**
     * The filter to search for the CostPriceHistory to update in case it exists.
     */
    where: CostPriceHistoryWhereUniqueInput
    /**
     * In case the CostPriceHistory found by the `where` argument doesn't exist, create a new CostPriceHistory with this data.
     */
    create: XOR<CostPriceHistoryCreateInput, CostPriceHistoryUncheckedCreateInput>
    /**
     * In case the CostPriceHistory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CostPriceHistoryUpdateInput, CostPriceHistoryUncheckedUpdateInput>
  }

  /**
   * CostPriceHistory delete
   */
  export type CostPriceHistoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CostPriceHistory
     */
    select?: CostPriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CostPriceHistory
     */
    omit?: CostPriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CostPriceHistoryInclude<ExtArgs> | null
    /**
     * Filter which CostPriceHistory to delete.
     */
    where: CostPriceHistoryWhereUniqueInput
  }

  /**
   * CostPriceHistory deleteMany
   */
  export type CostPriceHistoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CostPriceHistories to delete
     */
    where?: CostPriceHistoryWhereInput
    /**
     * Limit how many CostPriceHistories to delete.
     */
    limit?: number
  }

  /**
   * CostPriceHistory without action
   */
  export type CostPriceHistoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CostPriceHistory
     */
    select?: CostPriceHistorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CostPriceHistory
     */
    omit?: CostPriceHistoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CostPriceHistoryInclude<ExtArgs> | null
  }


  /**
   * Model Review
   */

  export type AggregateReview = {
    _count: ReviewCountAggregateOutputType | null
    _avg: ReviewAvgAggregateOutputType | null
    _sum: ReviewSumAggregateOutputType | null
    _min: ReviewMinAggregateOutputType | null
    _max: ReviewMaxAggregateOutputType | null
  }

  export type ReviewAvgAggregateOutputType = {
    rating: number | null
  }

  export type ReviewSumAggregateOutputType = {
    rating: number | null
  }

  export type ReviewMinAggregateOutputType = {
    id: string | null
    productId: string | null
    orderId: string | null
    username: string | null
    rating: number | null
    comment: string | null
    variant: string | null
    images: string | null
    reply: string | null
    createdAt: Date | null
  }

  export type ReviewMaxAggregateOutputType = {
    id: string | null
    productId: string | null
    orderId: string | null
    username: string | null
    rating: number | null
    comment: string | null
    variant: string | null
    images: string | null
    reply: string | null
    createdAt: Date | null
  }

  export type ReviewCountAggregateOutputType = {
    id: number
    productId: number
    orderId: number
    username: number
    rating: number
    comment: number
    variant: number
    images: number
    reply: number
    createdAt: number
    _all: number
  }


  export type ReviewAvgAggregateInputType = {
    rating?: true
  }

  export type ReviewSumAggregateInputType = {
    rating?: true
  }

  export type ReviewMinAggregateInputType = {
    id?: true
    productId?: true
    orderId?: true
    username?: true
    rating?: true
    comment?: true
    variant?: true
    images?: true
    reply?: true
    createdAt?: true
  }

  export type ReviewMaxAggregateInputType = {
    id?: true
    productId?: true
    orderId?: true
    username?: true
    rating?: true
    comment?: true
    variant?: true
    images?: true
    reply?: true
    createdAt?: true
  }

  export type ReviewCountAggregateInputType = {
    id?: true
    productId?: true
    orderId?: true
    username?: true
    rating?: true
    comment?: true
    variant?: true
    images?: true
    reply?: true
    createdAt?: true
    _all?: true
  }

  export type ReviewAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Review to aggregate.
     */
    where?: ReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reviews to fetch.
     */
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Reviews
    **/
    _count?: true | ReviewCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ReviewAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ReviewSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ReviewMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ReviewMaxAggregateInputType
  }

  export type GetReviewAggregateType<T extends ReviewAggregateArgs> = {
        [P in keyof T & keyof AggregateReview]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReview[P]>
      : GetScalarType<T[P], AggregateReview[P]>
  }




  export type ReviewGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReviewWhereInput
    orderBy?: ReviewOrderByWithAggregationInput | ReviewOrderByWithAggregationInput[]
    by: ReviewScalarFieldEnum[] | ReviewScalarFieldEnum
    having?: ReviewScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ReviewCountAggregateInputType | true
    _avg?: ReviewAvgAggregateInputType
    _sum?: ReviewSumAggregateInputType
    _min?: ReviewMinAggregateInputType
    _max?: ReviewMaxAggregateInputType
  }

  export type ReviewGroupByOutputType = {
    id: string
    productId: string
    orderId: string | null
    username: string
    rating: number
    comment: string
    variant: string
    images: string | null
    reply: string | null
    createdAt: Date
    _count: ReviewCountAggregateOutputType | null
    _avg: ReviewAvgAggregateOutputType | null
    _sum: ReviewSumAggregateOutputType | null
    _min: ReviewMinAggregateOutputType | null
    _max: ReviewMaxAggregateOutputType | null
  }

  type GetReviewGroupByPayload<T extends ReviewGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ReviewGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ReviewGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ReviewGroupByOutputType[P]>
            : GetScalarType<T[P], ReviewGroupByOutputType[P]>
        }
      >
    >


  export type ReviewSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    orderId?: boolean
    username?: boolean
    rating?: boolean
    comment?: boolean
    variant?: boolean
    images?: boolean
    reply?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["review"]>

  export type ReviewSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    orderId?: boolean
    username?: boolean
    rating?: boolean
    comment?: boolean
    variant?: boolean
    images?: boolean
    reply?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["review"]>

  export type ReviewSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    orderId?: boolean
    username?: boolean
    rating?: boolean
    comment?: boolean
    variant?: boolean
    images?: boolean
    reply?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["review"]>

  export type ReviewSelectScalar = {
    id?: boolean
    productId?: boolean
    orderId?: boolean
    username?: boolean
    rating?: boolean
    comment?: boolean
    variant?: boolean
    images?: boolean
    reply?: boolean
    createdAt?: boolean
  }

  export type ReviewOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "productId" | "orderId" | "username" | "rating" | "comment" | "variant" | "images" | "reply" | "createdAt", ExtArgs["result"]["review"]>

  export type $ReviewPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Review"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      productId: string
      orderId: string | null
      username: string
      rating: number
      comment: string
      variant: string
      images: string | null
      reply: string | null
      createdAt: Date
    }, ExtArgs["result"]["review"]>
    composites: {}
  }

  type ReviewGetPayload<S extends boolean | null | undefined | ReviewDefaultArgs> = $Result.GetResult<Prisma.$ReviewPayload, S>

  type ReviewCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ReviewFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ReviewCountAggregateInputType | true
    }

  export interface ReviewDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Review'], meta: { name: 'Review' } }
    /**
     * Find zero or one Review that matches the filter.
     * @param {ReviewFindUniqueArgs} args - Arguments to find a Review
     * @example
     * // Get one Review
     * const review = await prisma.review.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ReviewFindUniqueArgs>(args: SelectSubset<T, ReviewFindUniqueArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Review that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ReviewFindUniqueOrThrowArgs} args - Arguments to find a Review
     * @example
     * // Get one Review
     * const review = await prisma.review.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ReviewFindUniqueOrThrowArgs>(args: SelectSubset<T, ReviewFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Review that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewFindFirstArgs} args - Arguments to find a Review
     * @example
     * // Get one Review
     * const review = await prisma.review.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ReviewFindFirstArgs>(args?: SelectSubset<T, ReviewFindFirstArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Review that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewFindFirstOrThrowArgs} args - Arguments to find a Review
     * @example
     * // Get one Review
     * const review = await prisma.review.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ReviewFindFirstOrThrowArgs>(args?: SelectSubset<T, ReviewFindFirstOrThrowArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Reviews that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Reviews
     * const reviews = await prisma.review.findMany()
     * 
     * // Get first 10 Reviews
     * const reviews = await prisma.review.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const reviewWithIdOnly = await prisma.review.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ReviewFindManyArgs>(args?: SelectSubset<T, ReviewFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Review.
     * @param {ReviewCreateArgs} args - Arguments to create a Review.
     * @example
     * // Create one Review
     * const Review = await prisma.review.create({
     *   data: {
     *     // ... data to create a Review
     *   }
     * })
     * 
     */
    create<T extends ReviewCreateArgs>(args: SelectSubset<T, ReviewCreateArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Reviews.
     * @param {ReviewCreateManyArgs} args - Arguments to create many Reviews.
     * @example
     * // Create many Reviews
     * const review = await prisma.review.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ReviewCreateManyArgs>(args?: SelectSubset<T, ReviewCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Reviews and returns the data saved in the database.
     * @param {ReviewCreateManyAndReturnArgs} args - Arguments to create many Reviews.
     * @example
     * // Create many Reviews
     * const review = await prisma.review.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Reviews and only return the `id`
     * const reviewWithIdOnly = await prisma.review.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ReviewCreateManyAndReturnArgs>(args?: SelectSubset<T, ReviewCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Review.
     * @param {ReviewDeleteArgs} args - Arguments to delete one Review.
     * @example
     * // Delete one Review
     * const Review = await prisma.review.delete({
     *   where: {
     *     // ... filter to delete one Review
     *   }
     * })
     * 
     */
    delete<T extends ReviewDeleteArgs>(args: SelectSubset<T, ReviewDeleteArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Review.
     * @param {ReviewUpdateArgs} args - Arguments to update one Review.
     * @example
     * // Update one Review
     * const review = await prisma.review.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ReviewUpdateArgs>(args: SelectSubset<T, ReviewUpdateArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Reviews.
     * @param {ReviewDeleteManyArgs} args - Arguments to filter Reviews to delete.
     * @example
     * // Delete a few Reviews
     * const { count } = await prisma.review.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ReviewDeleteManyArgs>(args?: SelectSubset<T, ReviewDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Reviews.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Reviews
     * const review = await prisma.review.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ReviewUpdateManyArgs>(args: SelectSubset<T, ReviewUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Reviews and returns the data updated in the database.
     * @param {ReviewUpdateManyAndReturnArgs} args - Arguments to update many Reviews.
     * @example
     * // Update many Reviews
     * const review = await prisma.review.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Reviews and only return the `id`
     * const reviewWithIdOnly = await prisma.review.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ReviewUpdateManyAndReturnArgs>(args: SelectSubset<T, ReviewUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Review.
     * @param {ReviewUpsertArgs} args - Arguments to update or create a Review.
     * @example
     * // Update or create a Review
     * const review = await prisma.review.upsert({
     *   create: {
     *     // ... data to create a Review
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Review we want to update
     *   }
     * })
     */
    upsert<T extends ReviewUpsertArgs>(args: SelectSubset<T, ReviewUpsertArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Reviews.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewCountArgs} args - Arguments to filter Reviews to count.
     * @example
     * // Count the number of Reviews
     * const count = await prisma.review.count({
     *   where: {
     *     // ... the filter for the Reviews we want to count
     *   }
     * })
    **/
    count<T extends ReviewCountArgs>(
      args?: Subset<T, ReviewCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ReviewCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Review.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ReviewAggregateArgs>(args: Subset<T, ReviewAggregateArgs>): Prisma.PrismaPromise<GetReviewAggregateType<T>>

    /**
     * Group by Review.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ReviewGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ReviewGroupByArgs['orderBy'] }
        : { orderBy?: ReviewGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ReviewGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetReviewGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Review model
   */
  readonly fields: ReviewFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Review.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ReviewClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Review model
   */
  interface ReviewFieldRefs {
    readonly id: FieldRef<"Review", 'String'>
    readonly productId: FieldRef<"Review", 'String'>
    readonly orderId: FieldRef<"Review", 'String'>
    readonly username: FieldRef<"Review", 'String'>
    readonly rating: FieldRef<"Review", 'Int'>
    readonly comment: FieldRef<"Review", 'String'>
    readonly variant: FieldRef<"Review", 'String'>
    readonly images: FieldRef<"Review", 'String'>
    readonly reply: FieldRef<"Review", 'String'>
    readonly createdAt: FieldRef<"Review", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Review findUnique
   */
  export type ReviewFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Filter, which Review to fetch.
     */
    where: ReviewWhereUniqueInput
  }

  /**
   * Review findUniqueOrThrow
   */
  export type ReviewFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Filter, which Review to fetch.
     */
    where: ReviewWhereUniqueInput
  }

  /**
   * Review findFirst
   */
  export type ReviewFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Filter, which Review to fetch.
     */
    where?: ReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reviews to fetch.
     */
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Reviews.
     */
    cursor?: ReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Reviews.
     */
    distinct?: ReviewScalarFieldEnum | ReviewScalarFieldEnum[]
  }

  /**
   * Review findFirstOrThrow
   */
  export type ReviewFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Filter, which Review to fetch.
     */
    where?: ReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reviews to fetch.
     */
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Reviews.
     */
    cursor?: ReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Reviews.
     */
    distinct?: ReviewScalarFieldEnum | ReviewScalarFieldEnum[]
  }

  /**
   * Review findMany
   */
  export type ReviewFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Filter, which Reviews to fetch.
     */
    where?: ReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reviews to fetch.
     */
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Reviews.
     */
    cursor?: ReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Reviews.
     */
    distinct?: ReviewScalarFieldEnum | ReviewScalarFieldEnum[]
  }

  /**
   * Review create
   */
  export type ReviewCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * The data needed to create a Review.
     */
    data: XOR<ReviewCreateInput, ReviewUncheckedCreateInput>
  }

  /**
   * Review createMany
   */
  export type ReviewCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Reviews.
     */
    data: ReviewCreateManyInput | ReviewCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Review createManyAndReturn
   */
  export type ReviewCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * The data used to create many Reviews.
     */
    data: ReviewCreateManyInput | ReviewCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Review update
   */
  export type ReviewUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * The data needed to update a Review.
     */
    data: XOR<ReviewUpdateInput, ReviewUncheckedUpdateInput>
    /**
     * Choose, which Review to update.
     */
    where: ReviewWhereUniqueInput
  }

  /**
   * Review updateMany
   */
  export type ReviewUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Reviews.
     */
    data: XOR<ReviewUpdateManyMutationInput, ReviewUncheckedUpdateManyInput>
    /**
     * Filter which Reviews to update
     */
    where?: ReviewWhereInput
    /**
     * Limit how many Reviews to update.
     */
    limit?: number
  }

  /**
   * Review updateManyAndReturn
   */
  export type ReviewUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * The data used to update Reviews.
     */
    data: XOR<ReviewUpdateManyMutationInput, ReviewUncheckedUpdateManyInput>
    /**
     * Filter which Reviews to update
     */
    where?: ReviewWhereInput
    /**
     * Limit how many Reviews to update.
     */
    limit?: number
  }

  /**
   * Review upsert
   */
  export type ReviewUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * The filter to search for the Review to update in case it exists.
     */
    where: ReviewWhereUniqueInput
    /**
     * In case the Review found by the `where` argument doesn't exist, create a new Review with this data.
     */
    create: XOR<ReviewCreateInput, ReviewUncheckedCreateInput>
    /**
     * In case the Review was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ReviewUpdateInput, ReviewUncheckedUpdateInput>
  }

  /**
   * Review delete
   */
  export type ReviewDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Filter which Review to delete.
     */
    where: ReviewWhereUniqueInput
  }

  /**
   * Review deleteMany
   */
  export type ReviewDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Reviews to delete
     */
    where?: ReviewWhereInput
    /**
     * Limit how many Reviews to delete.
     */
    limit?: number
  }

  /**
   * Review without action
   */
  export type ReviewDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
  }


  /**
   * Model ProductLike
   */

  export type AggregateProductLike = {
    _count: ProductLikeCountAggregateOutputType | null
    _min: ProductLikeMinAggregateOutputType | null
    _max: ProductLikeMaxAggregateOutputType | null
  }

  export type ProductLikeMinAggregateOutputType = {
    id: string | null
    productId: string | null
    userId: string | null
    createdAt: Date | null
  }

  export type ProductLikeMaxAggregateOutputType = {
    id: string | null
    productId: string | null
    userId: string | null
    createdAt: Date | null
  }

  export type ProductLikeCountAggregateOutputType = {
    id: number
    productId: number
    userId: number
    createdAt: number
    _all: number
  }


  export type ProductLikeMinAggregateInputType = {
    id?: true
    productId?: true
    userId?: true
    createdAt?: true
  }

  export type ProductLikeMaxAggregateInputType = {
    id?: true
    productId?: true
    userId?: true
    createdAt?: true
  }

  export type ProductLikeCountAggregateInputType = {
    id?: true
    productId?: true
    userId?: true
    createdAt?: true
    _all?: true
  }

  export type ProductLikeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProductLike to aggregate.
     */
    where?: ProductLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProductLikes to fetch.
     */
    orderBy?: ProductLikeOrderByWithRelationInput | ProductLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProductLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProductLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProductLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ProductLikes
    **/
    _count?: true | ProductLikeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProductLikeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProductLikeMaxAggregateInputType
  }

  export type GetProductLikeAggregateType<T extends ProductLikeAggregateArgs> = {
        [P in keyof T & keyof AggregateProductLike]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProductLike[P]>
      : GetScalarType<T[P], AggregateProductLike[P]>
  }




  export type ProductLikeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProductLikeWhereInput
    orderBy?: ProductLikeOrderByWithAggregationInput | ProductLikeOrderByWithAggregationInput[]
    by: ProductLikeScalarFieldEnum[] | ProductLikeScalarFieldEnum
    having?: ProductLikeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProductLikeCountAggregateInputType | true
    _min?: ProductLikeMinAggregateInputType
    _max?: ProductLikeMaxAggregateInputType
  }

  export type ProductLikeGroupByOutputType = {
    id: string
    productId: string
    userId: string
    createdAt: Date
    _count: ProductLikeCountAggregateOutputType | null
    _min: ProductLikeMinAggregateOutputType | null
    _max: ProductLikeMaxAggregateOutputType | null
  }

  type GetProductLikeGroupByPayload<T extends ProductLikeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProductLikeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProductLikeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProductLikeGroupByOutputType[P]>
            : GetScalarType<T[P], ProductLikeGroupByOutputType[P]>
        }
      >
    >


  export type ProductLikeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    userId?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["productLike"]>

  export type ProductLikeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    userId?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["productLike"]>

  export type ProductLikeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    userId?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["productLike"]>

  export type ProductLikeSelectScalar = {
    id?: boolean
    productId?: boolean
    userId?: boolean
    createdAt?: boolean
  }

  export type ProductLikeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "productId" | "userId" | "createdAt", ExtArgs["result"]["productLike"]>

  export type $ProductLikePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ProductLike"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      productId: string
      userId: string
      createdAt: Date
    }, ExtArgs["result"]["productLike"]>
    composites: {}
  }

  type ProductLikeGetPayload<S extends boolean | null | undefined | ProductLikeDefaultArgs> = $Result.GetResult<Prisma.$ProductLikePayload, S>

  type ProductLikeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProductLikeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProductLikeCountAggregateInputType | true
    }

  export interface ProductLikeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ProductLike'], meta: { name: 'ProductLike' } }
    /**
     * Find zero or one ProductLike that matches the filter.
     * @param {ProductLikeFindUniqueArgs} args - Arguments to find a ProductLike
     * @example
     * // Get one ProductLike
     * const productLike = await prisma.productLike.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProductLikeFindUniqueArgs>(args: SelectSubset<T, ProductLikeFindUniqueArgs<ExtArgs>>): Prisma__ProductLikeClient<$Result.GetResult<Prisma.$ProductLikePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ProductLike that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProductLikeFindUniqueOrThrowArgs} args - Arguments to find a ProductLike
     * @example
     * // Get one ProductLike
     * const productLike = await prisma.productLike.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProductLikeFindUniqueOrThrowArgs>(args: SelectSubset<T, ProductLikeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProductLikeClient<$Result.GetResult<Prisma.$ProductLikePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProductLike that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductLikeFindFirstArgs} args - Arguments to find a ProductLike
     * @example
     * // Get one ProductLike
     * const productLike = await prisma.productLike.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProductLikeFindFirstArgs>(args?: SelectSubset<T, ProductLikeFindFirstArgs<ExtArgs>>): Prisma__ProductLikeClient<$Result.GetResult<Prisma.$ProductLikePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ProductLike that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductLikeFindFirstOrThrowArgs} args - Arguments to find a ProductLike
     * @example
     * // Get one ProductLike
     * const productLike = await prisma.productLike.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProductLikeFindFirstOrThrowArgs>(args?: SelectSubset<T, ProductLikeFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProductLikeClient<$Result.GetResult<Prisma.$ProductLikePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ProductLikes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductLikeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ProductLikes
     * const productLikes = await prisma.productLike.findMany()
     * 
     * // Get first 10 ProductLikes
     * const productLikes = await prisma.productLike.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const productLikeWithIdOnly = await prisma.productLike.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProductLikeFindManyArgs>(args?: SelectSubset<T, ProductLikeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductLikePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ProductLike.
     * @param {ProductLikeCreateArgs} args - Arguments to create a ProductLike.
     * @example
     * // Create one ProductLike
     * const ProductLike = await prisma.productLike.create({
     *   data: {
     *     // ... data to create a ProductLike
     *   }
     * })
     * 
     */
    create<T extends ProductLikeCreateArgs>(args: SelectSubset<T, ProductLikeCreateArgs<ExtArgs>>): Prisma__ProductLikeClient<$Result.GetResult<Prisma.$ProductLikePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ProductLikes.
     * @param {ProductLikeCreateManyArgs} args - Arguments to create many ProductLikes.
     * @example
     * // Create many ProductLikes
     * const productLike = await prisma.productLike.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProductLikeCreateManyArgs>(args?: SelectSubset<T, ProductLikeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ProductLikes and returns the data saved in the database.
     * @param {ProductLikeCreateManyAndReturnArgs} args - Arguments to create many ProductLikes.
     * @example
     * // Create many ProductLikes
     * const productLike = await prisma.productLike.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ProductLikes and only return the `id`
     * const productLikeWithIdOnly = await prisma.productLike.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProductLikeCreateManyAndReturnArgs>(args?: SelectSubset<T, ProductLikeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductLikePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ProductLike.
     * @param {ProductLikeDeleteArgs} args - Arguments to delete one ProductLike.
     * @example
     * // Delete one ProductLike
     * const ProductLike = await prisma.productLike.delete({
     *   where: {
     *     // ... filter to delete one ProductLike
     *   }
     * })
     * 
     */
    delete<T extends ProductLikeDeleteArgs>(args: SelectSubset<T, ProductLikeDeleteArgs<ExtArgs>>): Prisma__ProductLikeClient<$Result.GetResult<Prisma.$ProductLikePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ProductLike.
     * @param {ProductLikeUpdateArgs} args - Arguments to update one ProductLike.
     * @example
     * // Update one ProductLike
     * const productLike = await prisma.productLike.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProductLikeUpdateArgs>(args: SelectSubset<T, ProductLikeUpdateArgs<ExtArgs>>): Prisma__ProductLikeClient<$Result.GetResult<Prisma.$ProductLikePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ProductLikes.
     * @param {ProductLikeDeleteManyArgs} args - Arguments to filter ProductLikes to delete.
     * @example
     * // Delete a few ProductLikes
     * const { count } = await prisma.productLike.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProductLikeDeleteManyArgs>(args?: SelectSubset<T, ProductLikeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProductLikes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductLikeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ProductLikes
     * const productLike = await prisma.productLike.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProductLikeUpdateManyArgs>(args: SelectSubset<T, ProductLikeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProductLikes and returns the data updated in the database.
     * @param {ProductLikeUpdateManyAndReturnArgs} args - Arguments to update many ProductLikes.
     * @example
     * // Update many ProductLikes
     * const productLike = await prisma.productLike.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ProductLikes and only return the `id`
     * const productLikeWithIdOnly = await prisma.productLike.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProductLikeUpdateManyAndReturnArgs>(args: SelectSubset<T, ProductLikeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductLikePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ProductLike.
     * @param {ProductLikeUpsertArgs} args - Arguments to update or create a ProductLike.
     * @example
     * // Update or create a ProductLike
     * const productLike = await prisma.productLike.upsert({
     *   create: {
     *     // ... data to create a ProductLike
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ProductLike we want to update
     *   }
     * })
     */
    upsert<T extends ProductLikeUpsertArgs>(args: SelectSubset<T, ProductLikeUpsertArgs<ExtArgs>>): Prisma__ProductLikeClient<$Result.GetResult<Prisma.$ProductLikePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ProductLikes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductLikeCountArgs} args - Arguments to filter ProductLikes to count.
     * @example
     * // Count the number of ProductLikes
     * const count = await prisma.productLike.count({
     *   where: {
     *     // ... the filter for the ProductLikes we want to count
     *   }
     * })
    **/
    count<T extends ProductLikeCountArgs>(
      args?: Subset<T, ProductLikeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProductLikeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ProductLike.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductLikeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProductLikeAggregateArgs>(args: Subset<T, ProductLikeAggregateArgs>): Prisma.PrismaPromise<GetProductLikeAggregateType<T>>

    /**
     * Group by ProductLike.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProductLikeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProductLikeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProductLikeGroupByArgs['orderBy'] }
        : { orderBy?: ProductLikeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProductLikeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProductLikeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ProductLike model
   */
  readonly fields: ProductLikeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ProductLike.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProductLikeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ProductLike model
   */
  interface ProductLikeFieldRefs {
    readonly id: FieldRef<"ProductLike", 'String'>
    readonly productId: FieldRef<"ProductLike", 'String'>
    readonly userId: FieldRef<"ProductLike", 'String'>
    readonly createdAt: FieldRef<"ProductLike", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ProductLike findUnique
   */
  export type ProductLikeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductLike
     */
    select?: ProductLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductLike
     */
    omit?: ProductLikeOmit<ExtArgs> | null
    /**
     * Filter, which ProductLike to fetch.
     */
    where: ProductLikeWhereUniqueInput
  }

  /**
   * ProductLike findUniqueOrThrow
   */
  export type ProductLikeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductLike
     */
    select?: ProductLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductLike
     */
    omit?: ProductLikeOmit<ExtArgs> | null
    /**
     * Filter, which ProductLike to fetch.
     */
    where: ProductLikeWhereUniqueInput
  }

  /**
   * ProductLike findFirst
   */
  export type ProductLikeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductLike
     */
    select?: ProductLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductLike
     */
    omit?: ProductLikeOmit<ExtArgs> | null
    /**
     * Filter, which ProductLike to fetch.
     */
    where?: ProductLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProductLikes to fetch.
     */
    orderBy?: ProductLikeOrderByWithRelationInput | ProductLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProductLikes.
     */
    cursor?: ProductLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProductLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProductLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProductLikes.
     */
    distinct?: ProductLikeScalarFieldEnum | ProductLikeScalarFieldEnum[]
  }

  /**
   * ProductLike findFirstOrThrow
   */
  export type ProductLikeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductLike
     */
    select?: ProductLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductLike
     */
    omit?: ProductLikeOmit<ExtArgs> | null
    /**
     * Filter, which ProductLike to fetch.
     */
    where?: ProductLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProductLikes to fetch.
     */
    orderBy?: ProductLikeOrderByWithRelationInput | ProductLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProductLikes.
     */
    cursor?: ProductLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProductLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProductLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProductLikes.
     */
    distinct?: ProductLikeScalarFieldEnum | ProductLikeScalarFieldEnum[]
  }

  /**
   * ProductLike findMany
   */
  export type ProductLikeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductLike
     */
    select?: ProductLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductLike
     */
    omit?: ProductLikeOmit<ExtArgs> | null
    /**
     * Filter, which ProductLikes to fetch.
     */
    where?: ProductLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProductLikes to fetch.
     */
    orderBy?: ProductLikeOrderByWithRelationInput | ProductLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ProductLikes.
     */
    cursor?: ProductLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProductLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProductLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProductLikes.
     */
    distinct?: ProductLikeScalarFieldEnum | ProductLikeScalarFieldEnum[]
  }

  /**
   * ProductLike create
   */
  export type ProductLikeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductLike
     */
    select?: ProductLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductLike
     */
    omit?: ProductLikeOmit<ExtArgs> | null
    /**
     * The data needed to create a ProductLike.
     */
    data: XOR<ProductLikeCreateInput, ProductLikeUncheckedCreateInput>
  }

  /**
   * ProductLike createMany
   */
  export type ProductLikeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ProductLikes.
     */
    data: ProductLikeCreateManyInput | ProductLikeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProductLike createManyAndReturn
   */
  export type ProductLikeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductLike
     */
    select?: ProductLikeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProductLike
     */
    omit?: ProductLikeOmit<ExtArgs> | null
    /**
     * The data used to create many ProductLikes.
     */
    data: ProductLikeCreateManyInput | ProductLikeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProductLike update
   */
  export type ProductLikeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductLike
     */
    select?: ProductLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductLike
     */
    omit?: ProductLikeOmit<ExtArgs> | null
    /**
     * The data needed to update a ProductLike.
     */
    data: XOR<ProductLikeUpdateInput, ProductLikeUncheckedUpdateInput>
    /**
     * Choose, which ProductLike to update.
     */
    where: ProductLikeWhereUniqueInput
  }

  /**
   * ProductLike updateMany
   */
  export type ProductLikeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ProductLikes.
     */
    data: XOR<ProductLikeUpdateManyMutationInput, ProductLikeUncheckedUpdateManyInput>
    /**
     * Filter which ProductLikes to update
     */
    where?: ProductLikeWhereInput
    /**
     * Limit how many ProductLikes to update.
     */
    limit?: number
  }

  /**
   * ProductLike updateManyAndReturn
   */
  export type ProductLikeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductLike
     */
    select?: ProductLikeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProductLike
     */
    omit?: ProductLikeOmit<ExtArgs> | null
    /**
     * The data used to update ProductLikes.
     */
    data: XOR<ProductLikeUpdateManyMutationInput, ProductLikeUncheckedUpdateManyInput>
    /**
     * Filter which ProductLikes to update
     */
    where?: ProductLikeWhereInput
    /**
     * Limit how many ProductLikes to update.
     */
    limit?: number
  }

  /**
   * ProductLike upsert
   */
  export type ProductLikeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductLike
     */
    select?: ProductLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductLike
     */
    omit?: ProductLikeOmit<ExtArgs> | null
    /**
     * The filter to search for the ProductLike to update in case it exists.
     */
    where: ProductLikeWhereUniqueInput
    /**
     * In case the ProductLike found by the `where` argument doesn't exist, create a new ProductLike with this data.
     */
    create: XOR<ProductLikeCreateInput, ProductLikeUncheckedCreateInput>
    /**
     * In case the ProductLike was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProductLikeUpdateInput, ProductLikeUncheckedUpdateInput>
  }

  /**
   * ProductLike delete
   */
  export type ProductLikeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductLike
     */
    select?: ProductLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductLike
     */
    omit?: ProductLikeOmit<ExtArgs> | null
    /**
     * Filter which ProductLike to delete.
     */
    where: ProductLikeWhereUniqueInput
  }

  /**
   * ProductLike deleteMany
   */
  export type ProductLikeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProductLikes to delete
     */
    where?: ProductLikeWhereInput
    /**
     * Limit how many ProductLikes to delete.
     */
    limit?: number
  }

  /**
   * ProductLike without action
   */
  export type ProductLikeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProductLike
     */
    select?: ProductLikeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProductLike
     */
    omit?: ProductLikeOmit<ExtArgs> | null
  }


  /**
   * Model Category
   */

  export type AggregateCategory = {
    _count: CategoryCountAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  export type CategoryMinAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    createdAt: Date | null
  }

  export type CategoryMaxAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    createdAt: Date | null
  }

  export type CategoryCountAggregateOutputType = {
    id: number
    name: number
    slug: number
    createdAt: number
    _all: number
  }


  export type CategoryMinAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    createdAt?: true
  }

  export type CategoryMaxAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    createdAt?: true
  }

  export type CategoryCountAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    createdAt?: true
    _all?: true
  }

  export type CategoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Category to aggregate.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Categories
    **/
    _count?: true | CategoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CategoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CategoryMaxAggregateInputType
  }

  export type GetCategoryAggregateType<T extends CategoryAggregateArgs> = {
        [P in keyof T & keyof AggregateCategory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCategory[P]>
      : GetScalarType<T[P], AggregateCategory[P]>
  }




  export type CategoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategoryWhereInput
    orderBy?: CategoryOrderByWithAggregationInput | CategoryOrderByWithAggregationInput[]
    by: CategoryScalarFieldEnum[] | CategoryScalarFieldEnum
    having?: CategoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CategoryCountAggregateInputType | true
    _min?: CategoryMinAggregateInputType
    _max?: CategoryMaxAggregateInputType
  }

  export type CategoryGroupByOutputType = {
    id: string
    name: string
    slug: string
    createdAt: Date
    _count: CategoryCountAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  type GetCategoryGroupByPayload<T extends CategoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CategoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CategoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CategoryGroupByOutputType[P]>
            : GetScalarType<T[P], CategoryGroupByOutputType[P]>
        }
      >
    >


  export type CategorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    createdAt?: boolean
    products?: boolean | Category$productsArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["category"]>

  export type CategorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["category"]>

  export type CategorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["category"]>

  export type CategorySelectScalar = {
    id?: boolean
    name?: boolean
    slug?: boolean
    createdAt?: boolean
  }

  export type CategoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "slug" | "createdAt", ExtArgs["result"]["category"]>
  export type CategoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    products?: boolean | Category$productsArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CategoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type CategoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CategoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Category"
    objects: {
      products: Prisma.$ProductPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      slug: string
      createdAt: Date
    }, ExtArgs["result"]["category"]>
    composites: {}
  }

  type CategoryGetPayload<S extends boolean | null | undefined | CategoryDefaultArgs> = $Result.GetResult<Prisma.$CategoryPayload, S>

  type CategoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CategoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CategoryCountAggregateInputType | true
    }

  export interface CategoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Category'], meta: { name: 'Category' } }
    /**
     * Find zero or one Category that matches the filter.
     * @param {CategoryFindUniqueArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CategoryFindUniqueArgs>(args: SelectSubset<T, CategoryFindUniqueArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Category that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CategoryFindUniqueOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CategoryFindUniqueOrThrowArgs>(args: SelectSubset<T, CategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Category that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CategoryFindFirstArgs>(args?: SelectSubset<T, CategoryFindFirstArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Category that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CategoryFindFirstOrThrowArgs>(args?: SelectSubset<T, CategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Categories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Categories
     * const categories = await prisma.category.findMany()
     * 
     * // Get first 10 Categories
     * const categories = await prisma.category.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const categoryWithIdOnly = await prisma.category.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CategoryFindManyArgs>(args?: SelectSubset<T, CategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Category.
     * @param {CategoryCreateArgs} args - Arguments to create a Category.
     * @example
     * // Create one Category
     * const Category = await prisma.category.create({
     *   data: {
     *     // ... data to create a Category
     *   }
     * })
     * 
     */
    create<T extends CategoryCreateArgs>(args: SelectSubset<T, CategoryCreateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Categories.
     * @param {CategoryCreateManyArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CategoryCreateManyArgs>(args?: SelectSubset<T, CategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Categories and returns the data saved in the database.
     * @param {CategoryCreateManyAndReturnArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Categories and only return the `id`
     * const categoryWithIdOnly = await prisma.category.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CategoryCreateManyAndReturnArgs>(args?: SelectSubset<T, CategoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Category.
     * @param {CategoryDeleteArgs} args - Arguments to delete one Category.
     * @example
     * // Delete one Category
     * const Category = await prisma.category.delete({
     *   where: {
     *     // ... filter to delete one Category
     *   }
     * })
     * 
     */
    delete<T extends CategoryDeleteArgs>(args: SelectSubset<T, CategoryDeleteArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Category.
     * @param {CategoryUpdateArgs} args - Arguments to update one Category.
     * @example
     * // Update one Category
     * const category = await prisma.category.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CategoryUpdateArgs>(args: SelectSubset<T, CategoryUpdateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Categories.
     * @param {CategoryDeleteManyArgs} args - Arguments to filter Categories to delete.
     * @example
     * // Delete a few Categories
     * const { count } = await prisma.category.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CategoryDeleteManyArgs>(args?: SelectSubset<T, CategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Categories
     * const category = await prisma.category.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CategoryUpdateManyArgs>(args: SelectSubset<T, CategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Categories and returns the data updated in the database.
     * @param {CategoryUpdateManyAndReturnArgs} args - Arguments to update many Categories.
     * @example
     * // Update many Categories
     * const category = await prisma.category.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Categories and only return the `id`
     * const categoryWithIdOnly = await prisma.category.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CategoryUpdateManyAndReturnArgs>(args: SelectSubset<T, CategoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Category.
     * @param {CategoryUpsertArgs} args - Arguments to update or create a Category.
     * @example
     * // Update or create a Category
     * const category = await prisma.category.upsert({
     *   create: {
     *     // ... data to create a Category
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Category we want to update
     *   }
     * })
     */
    upsert<T extends CategoryUpsertArgs>(args: SelectSubset<T, CategoryUpsertArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryCountArgs} args - Arguments to filter Categories to count.
     * @example
     * // Count the number of Categories
     * const count = await prisma.category.count({
     *   where: {
     *     // ... the filter for the Categories we want to count
     *   }
     * })
    **/
    count<T extends CategoryCountArgs>(
      args?: Subset<T, CategoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CategoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CategoryAggregateArgs>(args: Subset<T, CategoryAggregateArgs>): Prisma.PrismaPromise<GetCategoryAggregateType<T>>

    /**
     * Group by Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CategoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CategoryGroupByArgs['orderBy'] }
        : { orderBy?: CategoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Category model
   */
  readonly fields: CategoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Category.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CategoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    products<T extends Category$productsArgs<ExtArgs> = {}>(args?: Subset<T, Category$productsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Category model
   */
  interface CategoryFieldRefs {
    readonly id: FieldRef<"Category", 'String'>
    readonly name: FieldRef<"Category", 'String'>
    readonly slug: FieldRef<"Category", 'String'>
    readonly createdAt: FieldRef<"Category", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Category findUnique
   */
  export type CategoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findUniqueOrThrow
   */
  export type CategoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findFirst
   */
  export type CategoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findFirstOrThrow
   */
  export type CategoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findMany
   */
  export type CategoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Categories to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category create
   */
  export type CategoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to create a Category.
     */
    data: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
  }

  /**
   * Category createMany
   */
  export type CategoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Category createManyAndReturn
   */
  export type CategoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Category update
   */
  export type CategoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to update a Category.
     */
    data: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
    /**
     * Choose, which Category to update.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category updateMany
   */
  export type CategoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Categories.
     */
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyInput>
    /**
     * Filter which Categories to update
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to update.
     */
    limit?: number
  }

  /**
   * Category updateManyAndReturn
   */
  export type CategoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * The data used to update Categories.
     */
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyInput>
    /**
     * Filter which Categories to update
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to update.
     */
    limit?: number
  }

  /**
   * Category upsert
   */
  export type CategoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The filter to search for the Category to update in case it exists.
     */
    where: CategoryWhereUniqueInput
    /**
     * In case the Category found by the `where` argument doesn't exist, create a new Category with this data.
     */
    create: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
    /**
     * In case the Category was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
  }

  /**
   * Category delete
   */
  export type CategoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter which Category to delete.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category deleteMany
   */
  export type CategoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Categories to delete
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to delete.
     */
    limit?: number
  }

  /**
   * Category.products
   */
  export type Category$productsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Product
     */
    select?: ProductSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Product
     */
    omit?: ProductOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProductInclude<ExtArgs> | null
    where?: ProductWhereInput
    orderBy?: ProductOrderByWithRelationInput | ProductOrderByWithRelationInput[]
    cursor?: ProductWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ProductScalarFieldEnum | ProductScalarFieldEnum[]
  }

  /**
   * Category without action
   */
  export type CategoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
  }


  /**
   * Model FlashSale
   */

  export type AggregateFlashSale = {
    _count: FlashSaleCountAggregateOutputType | null
    _avg: FlashSaleAvgAggregateOutputType | null
    _sum: FlashSaleSumAggregateOutputType | null
    _min: FlashSaleMinAggregateOutputType | null
    _max: FlashSaleMaxAggregateOutputType | null
  }

  export type FlashSaleAvgAggregateOutputType = {
    productsCount: number | null
  }

  export type FlashSaleSumAggregateOutputType = {
    productsCount: number | null
  }

  export type FlashSaleMinAggregateOutputType = {
    id: string | null
    timeSlot: string | null
    productsCount: number | null
    status: string | null
    createdAt: Date | null
  }

  export type FlashSaleMaxAggregateOutputType = {
    id: string | null
    timeSlot: string | null
    productsCount: number | null
    status: string | null
    createdAt: Date | null
  }

  export type FlashSaleCountAggregateOutputType = {
    id: number
    timeSlot: number
    productsCount: number
    status: number
    createdAt: number
    _all: number
  }


  export type FlashSaleAvgAggregateInputType = {
    productsCount?: true
  }

  export type FlashSaleSumAggregateInputType = {
    productsCount?: true
  }

  export type FlashSaleMinAggregateInputType = {
    id?: true
    timeSlot?: true
    productsCount?: true
    status?: true
    createdAt?: true
  }

  export type FlashSaleMaxAggregateInputType = {
    id?: true
    timeSlot?: true
    productsCount?: true
    status?: true
    createdAt?: true
  }

  export type FlashSaleCountAggregateInputType = {
    id?: true
    timeSlot?: true
    productsCount?: true
    status?: true
    createdAt?: true
    _all?: true
  }

  export type FlashSaleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FlashSale to aggregate.
     */
    where?: FlashSaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FlashSales to fetch.
     */
    orderBy?: FlashSaleOrderByWithRelationInput | FlashSaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FlashSaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FlashSales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FlashSales.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned FlashSales
    **/
    _count?: true | FlashSaleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: FlashSaleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: FlashSaleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FlashSaleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FlashSaleMaxAggregateInputType
  }

  export type GetFlashSaleAggregateType<T extends FlashSaleAggregateArgs> = {
        [P in keyof T & keyof AggregateFlashSale]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFlashSale[P]>
      : GetScalarType<T[P], AggregateFlashSale[P]>
  }




  export type FlashSaleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FlashSaleWhereInput
    orderBy?: FlashSaleOrderByWithAggregationInput | FlashSaleOrderByWithAggregationInput[]
    by: FlashSaleScalarFieldEnum[] | FlashSaleScalarFieldEnum
    having?: FlashSaleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FlashSaleCountAggregateInputType | true
    _avg?: FlashSaleAvgAggregateInputType
    _sum?: FlashSaleSumAggregateInputType
    _min?: FlashSaleMinAggregateInputType
    _max?: FlashSaleMaxAggregateInputType
  }

  export type FlashSaleGroupByOutputType = {
    id: string
    timeSlot: string
    productsCount: number
    status: string
    createdAt: Date
    _count: FlashSaleCountAggregateOutputType | null
    _avg: FlashSaleAvgAggregateOutputType | null
    _sum: FlashSaleSumAggregateOutputType | null
    _min: FlashSaleMinAggregateOutputType | null
    _max: FlashSaleMaxAggregateOutputType | null
  }

  type GetFlashSaleGroupByPayload<T extends FlashSaleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FlashSaleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FlashSaleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FlashSaleGroupByOutputType[P]>
            : GetScalarType<T[P], FlashSaleGroupByOutputType[P]>
        }
      >
    >


  export type FlashSaleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    timeSlot?: boolean
    productsCount?: boolean
    status?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["flashSale"]>

  export type FlashSaleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    timeSlot?: boolean
    productsCount?: boolean
    status?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["flashSale"]>

  export type FlashSaleSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    timeSlot?: boolean
    productsCount?: boolean
    status?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["flashSale"]>

  export type FlashSaleSelectScalar = {
    id?: boolean
    timeSlot?: boolean
    productsCount?: boolean
    status?: boolean
    createdAt?: boolean
  }

  export type FlashSaleOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "timeSlot" | "productsCount" | "status" | "createdAt", ExtArgs["result"]["flashSale"]>

  export type $FlashSalePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "FlashSale"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      timeSlot: string
      productsCount: number
      status: string
      createdAt: Date
    }, ExtArgs["result"]["flashSale"]>
    composites: {}
  }

  type FlashSaleGetPayload<S extends boolean | null | undefined | FlashSaleDefaultArgs> = $Result.GetResult<Prisma.$FlashSalePayload, S>

  type FlashSaleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FlashSaleFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FlashSaleCountAggregateInputType | true
    }

  export interface FlashSaleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['FlashSale'], meta: { name: 'FlashSale' } }
    /**
     * Find zero or one FlashSale that matches the filter.
     * @param {FlashSaleFindUniqueArgs} args - Arguments to find a FlashSale
     * @example
     * // Get one FlashSale
     * const flashSale = await prisma.flashSale.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FlashSaleFindUniqueArgs>(args: SelectSubset<T, FlashSaleFindUniqueArgs<ExtArgs>>): Prisma__FlashSaleClient<$Result.GetResult<Prisma.$FlashSalePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one FlashSale that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FlashSaleFindUniqueOrThrowArgs} args - Arguments to find a FlashSale
     * @example
     * // Get one FlashSale
     * const flashSale = await prisma.flashSale.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FlashSaleFindUniqueOrThrowArgs>(args: SelectSubset<T, FlashSaleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FlashSaleClient<$Result.GetResult<Prisma.$FlashSalePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FlashSale that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FlashSaleFindFirstArgs} args - Arguments to find a FlashSale
     * @example
     * // Get one FlashSale
     * const flashSale = await prisma.flashSale.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FlashSaleFindFirstArgs>(args?: SelectSubset<T, FlashSaleFindFirstArgs<ExtArgs>>): Prisma__FlashSaleClient<$Result.GetResult<Prisma.$FlashSalePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FlashSale that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FlashSaleFindFirstOrThrowArgs} args - Arguments to find a FlashSale
     * @example
     * // Get one FlashSale
     * const flashSale = await prisma.flashSale.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FlashSaleFindFirstOrThrowArgs>(args?: SelectSubset<T, FlashSaleFindFirstOrThrowArgs<ExtArgs>>): Prisma__FlashSaleClient<$Result.GetResult<Prisma.$FlashSalePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more FlashSales that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FlashSaleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all FlashSales
     * const flashSales = await prisma.flashSale.findMany()
     * 
     * // Get first 10 FlashSales
     * const flashSales = await prisma.flashSale.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const flashSaleWithIdOnly = await prisma.flashSale.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FlashSaleFindManyArgs>(args?: SelectSubset<T, FlashSaleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FlashSalePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a FlashSale.
     * @param {FlashSaleCreateArgs} args - Arguments to create a FlashSale.
     * @example
     * // Create one FlashSale
     * const FlashSale = await prisma.flashSale.create({
     *   data: {
     *     // ... data to create a FlashSale
     *   }
     * })
     * 
     */
    create<T extends FlashSaleCreateArgs>(args: SelectSubset<T, FlashSaleCreateArgs<ExtArgs>>): Prisma__FlashSaleClient<$Result.GetResult<Prisma.$FlashSalePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many FlashSales.
     * @param {FlashSaleCreateManyArgs} args - Arguments to create many FlashSales.
     * @example
     * // Create many FlashSales
     * const flashSale = await prisma.flashSale.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FlashSaleCreateManyArgs>(args?: SelectSubset<T, FlashSaleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many FlashSales and returns the data saved in the database.
     * @param {FlashSaleCreateManyAndReturnArgs} args - Arguments to create many FlashSales.
     * @example
     * // Create many FlashSales
     * const flashSale = await prisma.flashSale.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many FlashSales and only return the `id`
     * const flashSaleWithIdOnly = await prisma.flashSale.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FlashSaleCreateManyAndReturnArgs>(args?: SelectSubset<T, FlashSaleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FlashSalePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a FlashSale.
     * @param {FlashSaleDeleteArgs} args - Arguments to delete one FlashSale.
     * @example
     * // Delete one FlashSale
     * const FlashSale = await prisma.flashSale.delete({
     *   where: {
     *     // ... filter to delete one FlashSale
     *   }
     * })
     * 
     */
    delete<T extends FlashSaleDeleteArgs>(args: SelectSubset<T, FlashSaleDeleteArgs<ExtArgs>>): Prisma__FlashSaleClient<$Result.GetResult<Prisma.$FlashSalePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one FlashSale.
     * @param {FlashSaleUpdateArgs} args - Arguments to update one FlashSale.
     * @example
     * // Update one FlashSale
     * const flashSale = await prisma.flashSale.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FlashSaleUpdateArgs>(args: SelectSubset<T, FlashSaleUpdateArgs<ExtArgs>>): Prisma__FlashSaleClient<$Result.GetResult<Prisma.$FlashSalePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more FlashSales.
     * @param {FlashSaleDeleteManyArgs} args - Arguments to filter FlashSales to delete.
     * @example
     * // Delete a few FlashSales
     * const { count } = await prisma.flashSale.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FlashSaleDeleteManyArgs>(args?: SelectSubset<T, FlashSaleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FlashSales.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FlashSaleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many FlashSales
     * const flashSale = await prisma.flashSale.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FlashSaleUpdateManyArgs>(args: SelectSubset<T, FlashSaleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FlashSales and returns the data updated in the database.
     * @param {FlashSaleUpdateManyAndReturnArgs} args - Arguments to update many FlashSales.
     * @example
     * // Update many FlashSales
     * const flashSale = await prisma.flashSale.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more FlashSales and only return the `id`
     * const flashSaleWithIdOnly = await prisma.flashSale.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends FlashSaleUpdateManyAndReturnArgs>(args: SelectSubset<T, FlashSaleUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FlashSalePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one FlashSale.
     * @param {FlashSaleUpsertArgs} args - Arguments to update or create a FlashSale.
     * @example
     * // Update or create a FlashSale
     * const flashSale = await prisma.flashSale.upsert({
     *   create: {
     *     // ... data to create a FlashSale
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the FlashSale we want to update
     *   }
     * })
     */
    upsert<T extends FlashSaleUpsertArgs>(args: SelectSubset<T, FlashSaleUpsertArgs<ExtArgs>>): Prisma__FlashSaleClient<$Result.GetResult<Prisma.$FlashSalePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of FlashSales.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FlashSaleCountArgs} args - Arguments to filter FlashSales to count.
     * @example
     * // Count the number of FlashSales
     * const count = await prisma.flashSale.count({
     *   where: {
     *     // ... the filter for the FlashSales we want to count
     *   }
     * })
    **/
    count<T extends FlashSaleCountArgs>(
      args?: Subset<T, FlashSaleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FlashSaleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a FlashSale.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FlashSaleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FlashSaleAggregateArgs>(args: Subset<T, FlashSaleAggregateArgs>): Prisma.PrismaPromise<GetFlashSaleAggregateType<T>>

    /**
     * Group by FlashSale.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FlashSaleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FlashSaleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FlashSaleGroupByArgs['orderBy'] }
        : { orderBy?: FlashSaleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FlashSaleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFlashSaleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the FlashSale model
   */
  readonly fields: FlashSaleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for FlashSale.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FlashSaleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the FlashSale model
   */
  interface FlashSaleFieldRefs {
    readonly id: FieldRef<"FlashSale", 'String'>
    readonly timeSlot: FieldRef<"FlashSale", 'String'>
    readonly productsCount: FieldRef<"FlashSale", 'Int'>
    readonly status: FieldRef<"FlashSale", 'String'>
    readonly createdAt: FieldRef<"FlashSale", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * FlashSale findUnique
   */
  export type FlashSaleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FlashSale
     */
    select?: FlashSaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FlashSale
     */
    omit?: FlashSaleOmit<ExtArgs> | null
    /**
     * Filter, which FlashSale to fetch.
     */
    where: FlashSaleWhereUniqueInput
  }

  /**
   * FlashSale findUniqueOrThrow
   */
  export type FlashSaleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FlashSale
     */
    select?: FlashSaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FlashSale
     */
    omit?: FlashSaleOmit<ExtArgs> | null
    /**
     * Filter, which FlashSale to fetch.
     */
    where: FlashSaleWhereUniqueInput
  }

  /**
   * FlashSale findFirst
   */
  export type FlashSaleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FlashSale
     */
    select?: FlashSaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FlashSale
     */
    omit?: FlashSaleOmit<ExtArgs> | null
    /**
     * Filter, which FlashSale to fetch.
     */
    where?: FlashSaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FlashSales to fetch.
     */
    orderBy?: FlashSaleOrderByWithRelationInput | FlashSaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FlashSales.
     */
    cursor?: FlashSaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FlashSales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FlashSales.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FlashSales.
     */
    distinct?: FlashSaleScalarFieldEnum | FlashSaleScalarFieldEnum[]
  }

  /**
   * FlashSale findFirstOrThrow
   */
  export type FlashSaleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FlashSale
     */
    select?: FlashSaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FlashSale
     */
    omit?: FlashSaleOmit<ExtArgs> | null
    /**
     * Filter, which FlashSale to fetch.
     */
    where?: FlashSaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FlashSales to fetch.
     */
    orderBy?: FlashSaleOrderByWithRelationInput | FlashSaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FlashSales.
     */
    cursor?: FlashSaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FlashSales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FlashSales.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FlashSales.
     */
    distinct?: FlashSaleScalarFieldEnum | FlashSaleScalarFieldEnum[]
  }

  /**
   * FlashSale findMany
   */
  export type FlashSaleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FlashSale
     */
    select?: FlashSaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FlashSale
     */
    omit?: FlashSaleOmit<ExtArgs> | null
    /**
     * Filter, which FlashSales to fetch.
     */
    where?: FlashSaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FlashSales to fetch.
     */
    orderBy?: FlashSaleOrderByWithRelationInput | FlashSaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing FlashSales.
     */
    cursor?: FlashSaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FlashSales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FlashSales.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FlashSales.
     */
    distinct?: FlashSaleScalarFieldEnum | FlashSaleScalarFieldEnum[]
  }

  /**
   * FlashSale create
   */
  export type FlashSaleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FlashSale
     */
    select?: FlashSaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FlashSale
     */
    omit?: FlashSaleOmit<ExtArgs> | null
    /**
     * The data needed to create a FlashSale.
     */
    data: XOR<FlashSaleCreateInput, FlashSaleUncheckedCreateInput>
  }

  /**
   * FlashSale createMany
   */
  export type FlashSaleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many FlashSales.
     */
    data: FlashSaleCreateManyInput | FlashSaleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * FlashSale createManyAndReturn
   */
  export type FlashSaleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FlashSale
     */
    select?: FlashSaleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the FlashSale
     */
    omit?: FlashSaleOmit<ExtArgs> | null
    /**
     * The data used to create many FlashSales.
     */
    data: FlashSaleCreateManyInput | FlashSaleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * FlashSale update
   */
  export type FlashSaleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FlashSale
     */
    select?: FlashSaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FlashSale
     */
    omit?: FlashSaleOmit<ExtArgs> | null
    /**
     * The data needed to update a FlashSale.
     */
    data: XOR<FlashSaleUpdateInput, FlashSaleUncheckedUpdateInput>
    /**
     * Choose, which FlashSale to update.
     */
    where: FlashSaleWhereUniqueInput
  }

  /**
   * FlashSale updateMany
   */
  export type FlashSaleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update FlashSales.
     */
    data: XOR<FlashSaleUpdateManyMutationInput, FlashSaleUncheckedUpdateManyInput>
    /**
     * Filter which FlashSales to update
     */
    where?: FlashSaleWhereInput
    /**
     * Limit how many FlashSales to update.
     */
    limit?: number
  }

  /**
   * FlashSale updateManyAndReturn
   */
  export type FlashSaleUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FlashSale
     */
    select?: FlashSaleSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the FlashSale
     */
    omit?: FlashSaleOmit<ExtArgs> | null
    /**
     * The data used to update FlashSales.
     */
    data: XOR<FlashSaleUpdateManyMutationInput, FlashSaleUncheckedUpdateManyInput>
    /**
     * Filter which FlashSales to update
     */
    where?: FlashSaleWhereInput
    /**
     * Limit how many FlashSales to update.
     */
    limit?: number
  }

  /**
   * FlashSale upsert
   */
  export type FlashSaleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FlashSale
     */
    select?: FlashSaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FlashSale
     */
    omit?: FlashSaleOmit<ExtArgs> | null
    /**
     * The filter to search for the FlashSale to update in case it exists.
     */
    where: FlashSaleWhereUniqueInput
    /**
     * In case the FlashSale found by the `where` argument doesn't exist, create a new FlashSale with this data.
     */
    create: XOR<FlashSaleCreateInput, FlashSaleUncheckedCreateInput>
    /**
     * In case the FlashSale was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FlashSaleUpdateInput, FlashSaleUncheckedUpdateInput>
  }

  /**
   * FlashSale delete
   */
  export type FlashSaleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FlashSale
     */
    select?: FlashSaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FlashSale
     */
    omit?: FlashSaleOmit<ExtArgs> | null
    /**
     * Filter which FlashSale to delete.
     */
    where: FlashSaleWhereUniqueInput
  }

  /**
   * FlashSale deleteMany
   */
  export type FlashSaleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FlashSales to delete
     */
    where?: FlashSaleWhereInput
    /**
     * Limit how many FlashSales to delete.
     */
    limit?: number
  }

  /**
   * FlashSale without action
   */
  export type FlashSaleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FlashSale
     */
    select?: FlashSaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FlashSale
     */
    omit?: FlashSaleOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ProductScalarFieldEnum: {
    id: 'id',
    shopId: 'shopId',
    name: 'name',
    image: 'image',
    images: 'images',
    video: 'video',
    category: 'category',
    categoryId: 'categoryId',
    brand: 'brand',
    description: 'description',
    price: 'price',
    originalPrice: 'originalPrice',
    costPrice: 'costPrice',
    stock: 'stock',
    sales: 'sales',
    status: 'status',
    sku: 'sku',
    variationsText: 'variationsText',
    hasVariations: 'hasVariations',
    variationGroups: 'variationGroups',
    variationRows: 'variationRows',
    weight: 'weight',
    length: 'length',
    width: 'width',
    height: 'height',
    condition: 'condition',
    isPreOrder: 'isPreOrder',
    preOrderDays: 'preOrderDays',
    isViolated: 'isViolated',
    violationReason: 'violationReason',
    reportsCount: 'reportsCount',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ProductScalarFieldEnum = (typeof ProductScalarFieldEnum)[keyof typeof ProductScalarFieldEnum]


  export const PriceHistoryScalarFieldEnum: {
    id: 'id',
    productId: 'productId',
    shopId: 'shopId',
    oldPrice: 'oldPrice',
    newPrice: 'newPrice',
    changeType: 'changeType',
    changedBy: 'changedBy',
    changedByRole: 'changedByRole',
    reason: 'reason',
    createdAt: 'createdAt'
  };

  export type PriceHistoryScalarFieldEnum = (typeof PriceHistoryScalarFieldEnum)[keyof typeof PriceHistoryScalarFieldEnum]


  export const CostPriceHistoryScalarFieldEnum: {
    id: 'id',
    productId: 'productId',
    shopId: 'shopId',
    costPrice: 'costPrice',
    quantity: 'quantity',
    invoiceCode: 'invoiceCode',
    supplier: 'supplier',
    note: 'note',
    importedBy: 'importedBy',
    importDate: 'importDate',
    createdAt: 'createdAt'
  };

  export type CostPriceHistoryScalarFieldEnum = (typeof CostPriceHistoryScalarFieldEnum)[keyof typeof CostPriceHistoryScalarFieldEnum]


  export const ReviewScalarFieldEnum: {
    id: 'id',
    productId: 'productId',
    orderId: 'orderId',
    username: 'username',
    rating: 'rating',
    comment: 'comment',
    variant: 'variant',
    images: 'images',
    reply: 'reply',
    createdAt: 'createdAt'
  };

  export type ReviewScalarFieldEnum = (typeof ReviewScalarFieldEnum)[keyof typeof ReviewScalarFieldEnum]


  export const ProductLikeScalarFieldEnum: {
    id: 'id',
    productId: 'productId',
    userId: 'userId',
    createdAt: 'createdAt'
  };

  export type ProductLikeScalarFieldEnum = (typeof ProductLikeScalarFieldEnum)[keyof typeof ProductLikeScalarFieldEnum]


  export const CategoryScalarFieldEnum: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    createdAt: 'createdAt'
  };

  export type CategoryScalarFieldEnum = (typeof CategoryScalarFieldEnum)[keyof typeof CategoryScalarFieldEnum]


  export const FlashSaleScalarFieldEnum: {
    id: 'id',
    timeSlot: 'timeSlot',
    productsCount: 'productsCount',
    status: 'status',
    createdAt: 'createdAt'
  };

  export type FlashSaleScalarFieldEnum = (typeof FlashSaleScalarFieldEnum)[keyof typeof FlashSaleScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    
  /**
   * Deep Input Types
   */


  export type ProductWhereInput = {
    AND?: ProductWhereInput | ProductWhereInput[]
    OR?: ProductWhereInput[]
    NOT?: ProductWhereInput | ProductWhereInput[]
    id?: StringFilter<"Product"> | string
    shopId?: StringFilter<"Product"> | string
    name?: StringFilter<"Product"> | string
    image?: StringNullableFilter<"Product"> | string | null
    images?: StringNullableFilter<"Product"> | string | null
    video?: StringNullableFilter<"Product"> | string | null
    category?: StringFilter<"Product"> | string
    categoryId?: StringNullableFilter<"Product"> | string | null
    brand?: StringFilter<"Product"> | string
    description?: StringFilter<"Product"> | string
    price?: StringFilter<"Product"> | string
    originalPrice?: StringNullableFilter<"Product"> | string | null
    costPrice?: FloatNullableFilter<"Product"> | number | null
    stock?: IntFilter<"Product"> | number
    sales?: IntFilter<"Product"> | number
    status?: StringFilter<"Product"> | string
    sku?: StringNullableFilter<"Product"> | string | null
    variationsText?: StringNullableFilter<"Product"> | string | null
    hasVariations?: BoolFilter<"Product"> | boolean
    variationGroups?: StringNullableFilter<"Product"> | string | null
    variationRows?: StringNullableFilter<"Product"> | string | null
    weight?: StringNullableFilter<"Product"> | string | null
    length?: StringNullableFilter<"Product"> | string | null
    width?: StringNullableFilter<"Product"> | string | null
    height?: StringNullableFilter<"Product"> | string | null
    condition?: StringFilter<"Product"> | string
    isPreOrder?: BoolFilter<"Product"> | boolean
    preOrderDays?: StringNullableFilter<"Product"> | string | null
    isViolated?: BoolFilter<"Product"> | boolean
    violationReason?: StringNullableFilter<"Product"> | string | null
    reportsCount?: IntFilter<"Product"> | number
    createdAt?: DateTimeFilter<"Product"> | Date | string
    updatedAt?: DateTimeFilter<"Product"> | Date | string
    categoryRef?: XOR<CategoryNullableScalarRelationFilter, CategoryWhereInput> | null
    priceHistories?: PriceHistoryListRelationFilter
    costHistories?: CostPriceHistoryListRelationFilter
  }

  export type ProductOrderByWithRelationInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    image?: SortOrderInput | SortOrder
    images?: SortOrderInput | SortOrder
    video?: SortOrderInput | SortOrder
    category?: SortOrder
    categoryId?: SortOrderInput | SortOrder
    brand?: SortOrder
    description?: SortOrder
    price?: SortOrder
    originalPrice?: SortOrderInput | SortOrder
    costPrice?: SortOrderInput | SortOrder
    stock?: SortOrder
    sales?: SortOrder
    status?: SortOrder
    sku?: SortOrderInput | SortOrder
    variationsText?: SortOrderInput | SortOrder
    hasVariations?: SortOrder
    variationGroups?: SortOrderInput | SortOrder
    variationRows?: SortOrderInput | SortOrder
    weight?: SortOrderInput | SortOrder
    length?: SortOrderInput | SortOrder
    width?: SortOrderInput | SortOrder
    height?: SortOrderInput | SortOrder
    condition?: SortOrder
    isPreOrder?: SortOrder
    preOrderDays?: SortOrderInput | SortOrder
    isViolated?: SortOrder
    violationReason?: SortOrderInput | SortOrder
    reportsCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    categoryRef?: CategoryOrderByWithRelationInput
    priceHistories?: PriceHistoryOrderByRelationAggregateInput
    costHistories?: CostPriceHistoryOrderByRelationAggregateInput
  }

  export type ProductWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ProductWhereInput | ProductWhereInput[]
    OR?: ProductWhereInput[]
    NOT?: ProductWhereInput | ProductWhereInput[]
    shopId?: StringFilter<"Product"> | string
    name?: StringFilter<"Product"> | string
    image?: StringNullableFilter<"Product"> | string | null
    images?: StringNullableFilter<"Product"> | string | null
    video?: StringNullableFilter<"Product"> | string | null
    category?: StringFilter<"Product"> | string
    categoryId?: StringNullableFilter<"Product"> | string | null
    brand?: StringFilter<"Product"> | string
    description?: StringFilter<"Product"> | string
    price?: StringFilter<"Product"> | string
    originalPrice?: StringNullableFilter<"Product"> | string | null
    costPrice?: FloatNullableFilter<"Product"> | number | null
    stock?: IntFilter<"Product"> | number
    sales?: IntFilter<"Product"> | number
    status?: StringFilter<"Product"> | string
    sku?: StringNullableFilter<"Product"> | string | null
    variationsText?: StringNullableFilter<"Product"> | string | null
    hasVariations?: BoolFilter<"Product"> | boolean
    variationGroups?: StringNullableFilter<"Product"> | string | null
    variationRows?: StringNullableFilter<"Product"> | string | null
    weight?: StringNullableFilter<"Product"> | string | null
    length?: StringNullableFilter<"Product"> | string | null
    width?: StringNullableFilter<"Product"> | string | null
    height?: StringNullableFilter<"Product"> | string | null
    condition?: StringFilter<"Product"> | string
    isPreOrder?: BoolFilter<"Product"> | boolean
    preOrderDays?: StringNullableFilter<"Product"> | string | null
    isViolated?: BoolFilter<"Product"> | boolean
    violationReason?: StringNullableFilter<"Product"> | string | null
    reportsCount?: IntFilter<"Product"> | number
    createdAt?: DateTimeFilter<"Product"> | Date | string
    updatedAt?: DateTimeFilter<"Product"> | Date | string
    categoryRef?: XOR<CategoryNullableScalarRelationFilter, CategoryWhereInput> | null
    priceHistories?: PriceHistoryListRelationFilter
    costHistories?: CostPriceHistoryListRelationFilter
  }, "id">

  export type ProductOrderByWithAggregationInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    image?: SortOrderInput | SortOrder
    images?: SortOrderInput | SortOrder
    video?: SortOrderInput | SortOrder
    category?: SortOrder
    categoryId?: SortOrderInput | SortOrder
    brand?: SortOrder
    description?: SortOrder
    price?: SortOrder
    originalPrice?: SortOrderInput | SortOrder
    costPrice?: SortOrderInput | SortOrder
    stock?: SortOrder
    sales?: SortOrder
    status?: SortOrder
    sku?: SortOrderInput | SortOrder
    variationsText?: SortOrderInput | SortOrder
    hasVariations?: SortOrder
    variationGroups?: SortOrderInput | SortOrder
    variationRows?: SortOrderInput | SortOrder
    weight?: SortOrderInput | SortOrder
    length?: SortOrderInput | SortOrder
    width?: SortOrderInput | SortOrder
    height?: SortOrderInput | SortOrder
    condition?: SortOrder
    isPreOrder?: SortOrder
    preOrderDays?: SortOrderInput | SortOrder
    isViolated?: SortOrder
    violationReason?: SortOrderInput | SortOrder
    reportsCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ProductCountOrderByAggregateInput
    _avg?: ProductAvgOrderByAggregateInput
    _max?: ProductMaxOrderByAggregateInput
    _min?: ProductMinOrderByAggregateInput
    _sum?: ProductSumOrderByAggregateInput
  }

  export type ProductScalarWhereWithAggregatesInput = {
    AND?: ProductScalarWhereWithAggregatesInput | ProductScalarWhereWithAggregatesInput[]
    OR?: ProductScalarWhereWithAggregatesInput[]
    NOT?: ProductScalarWhereWithAggregatesInput | ProductScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Product"> | string
    shopId?: StringWithAggregatesFilter<"Product"> | string
    name?: StringWithAggregatesFilter<"Product"> | string
    image?: StringNullableWithAggregatesFilter<"Product"> | string | null
    images?: StringNullableWithAggregatesFilter<"Product"> | string | null
    video?: StringNullableWithAggregatesFilter<"Product"> | string | null
    category?: StringWithAggregatesFilter<"Product"> | string
    categoryId?: StringNullableWithAggregatesFilter<"Product"> | string | null
    brand?: StringWithAggregatesFilter<"Product"> | string
    description?: StringWithAggregatesFilter<"Product"> | string
    price?: StringWithAggregatesFilter<"Product"> | string
    originalPrice?: StringNullableWithAggregatesFilter<"Product"> | string | null
    costPrice?: FloatNullableWithAggregatesFilter<"Product"> | number | null
    stock?: IntWithAggregatesFilter<"Product"> | number
    sales?: IntWithAggregatesFilter<"Product"> | number
    status?: StringWithAggregatesFilter<"Product"> | string
    sku?: StringNullableWithAggregatesFilter<"Product"> | string | null
    variationsText?: StringNullableWithAggregatesFilter<"Product"> | string | null
    hasVariations?: BoolWithAggregatesFilter<"Product"> | boolean
    variationGroups?: StringNullableWithAggregatesFilter<"Product"> | string | null
    variationRows?: StringNullableWithAggregatesFilter<"Product"> | string | null
    weight?: StringNullableWithAggregatesFilter<"Product"> | string | null
    length?: StringNullableWithAggregatesFilter<"Product"> | string | null
    width?: StringNullableWithAggregatesFilter<"Product"> | string | null
    height?: StringNullableWithAggregatesFilter<"Product"> | string | null
    condition?: StringWithAggregatesFilter<"Product"> | string
    isPreOrder?: BoolWithAggregatesFilter<"Product"> | boolean
    preOrderDays?: StringNullableWithAggregatesFilter<"Product"> | string | null
    isViolated?: BoolWithAggregatesFilter<"Product"> | boolean
    violationReason?: StringNullableWithAggregatesFilter<"Product"> | string | null
    reportsCount?: IntWithAggregatesFilter<"Product"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Product"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Product"> | Date | string
  }

  export type PriceHistoryWhereInput = {
    AND?: PriceHistoryWhereInput | PriceHistoryWhereInput[]
    OR?: PriceHistoryWhereInput[]
    NOT?: PriceHistoryWhereInput | PriceHistoryWhereInput[]
    id?: StringFilter<"PriceHistory"> | string
    productId?: StringFilter<"PriceHistory"> | string
    shopId?: StringFilter<"PriceHistory"> | string
    oldPrice?: FloatFilter<"PriceHistory"> | number
    newPrice?: FloatFilter<"PriceHistory"> | number
    changeType?: StringFilter<"PriceHistory"> | string
    changedBy?: StringFilter<"PriceHistory"> | string
    changedByRole?: StringFilter<"PriceHistory"> | string
    reason?: StringNullableFilter<"PriceHistory"> | string | null
    createdAt?: DateTimeFilter<"PriceHistory"> | Date | string
    product?: XOR<ProductScalarRelationFilter, ProductWhereInput>
  }

  export type PriceHistoryOrderByWithRelationInput = {
    id?: SortOrder
    productId?: SortOrder
    shopId?: SortOrder
    oldPrice?: SortOrder
    newPrice?: SortOrder
    changeType?: SortOrder
    changedBy?: SortOrder
    changedByRole?: SortOrder
    reason?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    product?: ProductOrderByWithRelationInput
  }

  export type PriceHistoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PriceHistoryWhereInput | PriceHistoryWhereInput[]
    OR?: PriceHistoryWhereInput[]
    NOT?: PriceHistoryWhereInput | PriceHistoryWhereInput[]
    productId?: StringFilter<"PriceHistory"> | string
    shopId?: StringFilter<"PriceHistory"> | string
    oldPrice?: FloatFilter<"PriceHistory"> | number
    newPrice?: FloatFilter<"PriceHistory"> | number
    changeType?: StringFilter<"PriceHistory"> | string
    changedBy?: StringFilter<"PriceHistory"> | string
    changedByRole?: StringFilter<"PriceHistory"> | string
    reason?: StringNullableFilter<"PriceHistory"> | string | null
    createdAt?: DateTimeFilter<"PriceHistory"> | Date | string
    product?: XOR<ProductScalarRelationFilter, ProductWhereInput>
  }, "id">

  export type PriceHistoryOrderByWithAggregationInput = {
    id?: SortOrder
    productId?: SortOrder
    shopId?: SortOrder
    oldPrice?: SortOrder
    newPrice?: SortOrder
    changeType?: SortOrder
    changedBy?: SortOrder
    changedByRole?: SortOrder
    reason?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: PriceHistoryCountOrderByAggregateInput
    _avg?: PriceHistoryAvgOrderByAggregateInput
    _max?: PriceHistoryMaxOrderByAggregateInput
    _min?: PriceHistoryMinOrderByAggregateInput
    _sum?: PriceHistorySumOrderByAggregateInput
  }

  export type PriceHistoryScalarWhereWithAggregatesInput = {
    AND?: PriceHistoryScalarWhereWithAggregatesInput | PriceHistoryScalarWhereWithAggregatesInput[]
    OR?: PriceHistoryScalarWhereWithAggregatesInput[]
    NOT?: PriceHistoryScalarWhereWithAggregatesInput | PriceHistoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PriceHistory"> | string
    productId?: StringWithAggregatesFilter<"PriceHistory"> | string
    shopId?: StringWithAggregatesFilter<"PriceHistory"> | string
    oldPrice?: FloatWithAggregatesFilter<"PriceHistory"> | number
    newPrice?: FloatWithAggregatesFilter<"PriceHistory"> | number
    changeType?: StringWithAggregatesFilter<"PriceHistory"> | string
    changedBy?: StringWithAggregatesFilter<"PriceHistory"> | string
    changedByRole?: StringWithAggregatesFilter<"PriceHistory"> | string
    reason?: StringNullableWithAggregatesFilter<"PriceHistory"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PriceHistory"> | Date | string
  }

  export type CostPriceHistoryWhereInput = {
    AND?: CostPriceHistoryWhereInput | CostPriceHistoryWhereInput[]
    OR?: CostPriceHistoryWhereInput[]
    NOT?: CostPriceHistoryWhereInput | CostPriceHistoryWhereInput[]
    id?: StringFilter<"CostPriceHistory"> | string
    productId?: StringFilter<"CostPriceHistory"> | string
    shopId?: StringFilter<"CostPriceHistory"> | string
    costPrice?: FloatFilter<"CostPriceHistory"> | number
    quantity?: IntFilter<"CostPriceHistory"> | number
    invoiceCode?: StringNullableFilter<"CostPriceHistory"> | string | null
    supplier?: StringNullableFilter<"CostPriceHistory"> | string | null
    note?: StringNullableFilter<"CostPriceHistory"> | string | null
    importedBy?: StringFilter<"CostPriceHistory"> | string
    importDate?: DateTimeFilter<"CostPriceHistory"> | Date | string
    createdAt?: DateTimeFilter<"CostPriceHistory"> | Date | string
    product?: XOR<ProductScalarRelationFilter, ProductWhereInput>
  }

  export type CostPriceHistoryOrderByWithRelationInput = {
    id?: SortOrder
    productId?: SortOrder
    shopId?: SortOrder
    costPrice?: SortOrder
    quantity?: SortOrder
    invoiceCode?: SortOrderInput | SortOrder
    supplier?: SortOrderInput | SortOrder
    note?: SortOrderInput | SortOrder
    importedBy?: SortOrder
    importDate?: SortOrder
    createdAt?: SortOrder
    product?: ProductOrderByWithRelationInput
  }

  export type CostPriceHistoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CostPriceHistoryWhereInput | CostPriceHistoryWhereInput[]
    OR?: CostPriceHistoryWhereInput[]
    NOT?: CostPriceHistoryWhereInput | CostPriceHistoryWhereInput[]
    productId?: StringFilter<"CostPriceHistory"> | string
    shopId?: StringFilter<"CostPriceHistory"> | string
    costPrice?: FloatFilter<"CostPriceHistory"> | number
    quantity?: IntFilter<"CostPriceHistory"> | number
    invoiceCode?: StringNullableFilter<"CostPriceHistory"> | string | null
    supplier?: StringNullableFilter<"CostPriceHistory"> | string | null
    note?: StringNullableFilter<"CostPriceHistory"> | string | null
    importedBy?: StringFilter<"CostPriceHistory"> | string
    importDate?: DateTimeFilter<"CostPriceHistory"> | Date | string
    createdAt?: DateTimeFilter<"CostPriceHistory"> | Date | string
    product?: XOR<ProductScalarRelationFilter, ProductWhereInput>
  }, "id">

  export type CostPriceHistoryOrderByWithAggregationInput = {
    id?: SortOrder
    productId?: SortOrder
    shopId?: SortOrder
    costPrice?: SortOrder
    quantity?: SortOrder
    invoiceCode?: SortOrderInput | SortOrder
    supplier?: SortOrderInput | SortOrder
    note?: SortOrderInput | SortOrder
    importedBy?: SortOrder
    importDate?: SortOrder
    createdAt?: SortOrder
    _count?: CostPriceHistoryCountOrderByAggregateInput
    _avg?: CostPriceHistoryAvgOrderByAggregateInput
    _max?: CostPriceHistoryMaxOrderByAggregateInput
    _min?: CostPriceHistoryMinOrderByAggregateInput
    _sum?: CostPriceHistorySumOrderByAggregateInput
  }

  export type CostPriceHistoryScalarWhereWithAggregatesInput = {
    AND?: CostPriceHistoryScalarWhereWithAggregatesInput | CostPriceHistoryScalarWhereWithAggregatesInput[]
    OR?: CostPriceHistoryScalarWhereWithAggregatesInput[]
    NOT?: CostPriceHistoryScalarWhereWithAggregatesInput | CostPriceHistoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CostPriceHistory"> | string
    productId?: StringWithAggregatesFilter<"CostPriceHistory"> | string
    shopId?: StringWithAggregatesFilter<"CostPriceHistory"> | string
    costPrice?: FloatWithAggregatesFilter<"CostPriceHistory"> | number
    quantity?: IntWithAggregatesFilter<"CostPriceHistory"> | number
    invoiceCode?: StringNullableWithAggregatesFilter<"CostPriceHistory"> | string | null
    supplier?: StringNullableWithAggregatesFilter<"CostPriceHistory"> | string | null
    note?: StringNullableWithAggregatesFilter<"CostPriceHistory"> | string | null
    importedBy?: StringWithAggregatesFilter<"CostPriceHistory"> | string
    importDate?: DateTimeWithAggregatesFilter<"CostPriceHistory"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"CostPriceHistory"> | Date | string
  }

  export type ReviewWhereInput = {
    AND?: ReviewWhereInput | ReviewWhereInput[]
    OR?: ReviewWhereInput[]
    NOT?: ReviewWhereInput | ReviewWhereInput[]
    id?: StringFilter<"Review"> | string
    productId?: StringFilter<"Review"> | string
    orderId?: StringNullableFilter<"Review"> | string | null
    username?: StringFilter<"Review"> | string
    rating?: IntFilter<"Review"> | number
    comment?: StringFilter<"Review"> | string
    variant?: StringFilter<"Review"> | string
    images?: StringNullableFilter<"Review"> | string | null
    reply?: StringNullableFilter<"Review"> | string | null
    createdAt?: DateTimeFilter<"Review"> | Date | string
  }

  export type ReviewOrderByWithRelationInput = {
    id?: SortOrder
    productId?: SortOrder
    orderId?: SortOrderInput | SortOrder
    username?: SortOrder
    rating?: SortOrder
    comment?: SortOrder
    variant?: SortOrder
    images?: SortOrderInput | SortOrder
    reply?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type ReviewWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ReviewWhereInput | ReviewWhereInput[]
    OR?: ReviewWhereInput[]
    NOT?: ReviewWhereInput | ReviewWhereInput[]
    productId?: StringFilter<"Review"> | string
    orderId?: StringNullableFilter<"Review"> | string | null
    username?: StringFilter<"Review"> | string
    rating?: IntFilter<"Review"> | number
    comment?: StringFilter<"Review"> | string
    variant?: StringFilter<"Review"> | string
    images?: StringNullableFilter<"Review"> | string | null
    reply?: StringNullableFilter<"Review"> | string | null
    createdAt?: DateTimeFilter<"Review"> | Date | string
  }, "id">

  export type ReviewOrderByWithAggregationInput = {
    id?: SortOrder
    productId?: SortOrder
    orderId?: SortOrderInput | SortOrder
    username?: SortOrder
    rating?: SortOrder
    comment?: SortOrder
    variant?: SortOrder
    images?: SortOrderInput | SortOrder
    reply?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: ReviewCountOrderByAggregateInput
    _avg?: ReviewAvgOrderByAggregateInput
    _max?: ReviewMaxOrderByAggregateInput
    _min?: ReviewMinOrderByAggregateInput
    _sum?: ReviewSumOrderByAggregateInput
  }

  export type ReviewScalarWhereWithAggregatesInput = {
    AND?: ReviewScalarWhereWithAggregatesInput | ReviewScalarWhereWithAggregatesInput[]
    OR?: ReviewScalarWhereWithAggregatesInput[]
    NOT?: ReviewScalarWhereWithAggregatesInput | ReviewScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Review"> | string
    productId?: StringWithAggregatesFilter<"Review"> | string
    orderId?: StringNullableWithAggregatesFilter<"Review"> | string | null
    username?: StringWithAggregatesFilter<"Review"> | string
    rating?: IntWithAggregatesFilter<"Review"> | number
    comment?: StringWithAggregatesFilter<"Review"> | string
    variant?: StringWithAggregatesFilter<"Review"> | string
    images?: StringNullableWithAggregatesFilter<"Review"> | string | null
    reply?: StringNullableWithAggregatesFilter<"Review"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Review"> | Date | string
  }

  export type ProductLikeWhereInput = {
    AND?: ProductLikeWhereInput | ProductLikeWhereInput[]
    OR?: ProductLikeWhereInput[]
    NOT?: ProductLikeWhereInput | ProductLikeWhereInput[]
    id?: StringFilter<"ProductLike"> | string
    productId?: StringFilter<"ProductLike"> | string
    userId?: StringFilter<"ProductLike"> | string
    createdAt?: DateTimeFilter<"ProductLike"> | Date | string
  }

  export type ProductLikeOrderByWithRelationInput = {
    id?: SortOrder
    productId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type ProductLikeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    productId_userId?: ProductLikeProductIdUserIdCompoundUniqueInput
    AND?: ProductLikeWhereInput | ProductLikeWhereInput[]
    OR?: ProductLikeWhereInput[]
    NOT?: ProductLikeWhereInput | ProductLikeWhereInput[]
    productId?: StringFilter<"ProductLike"> | string
    userId?: StringFilter<"ProductLike"> | string
    createdAt?: DateTimeFilter<"ProductLike"> | Date | string
  }, "id" | "productId_userId">

  export type ProductLikeOrderByWithAggregationInput = {
    id?: SortOrder
    productId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    _count?: ProductLikeCountOrderByAggregateInput
    _max?: ProductLikeMaxOrderByAggregateInput
    _min?: ProductLikeMinOrderByAggregateInput
  }

  export type ProductLikeScalarWhereWithAggregatesInput = {
    AND?: ProductLikeScalarWhereWithAggregatesInput | ProductLikeScalarWhereWithAggregatesInput[]
    OR?: ProductLikeScalarWhereWithAggregatesInput[]
    NOT?: ProductLikeScalarWhereWithAggregatesInput | ProductLikeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ProductLike"> | string
    productId?: StringWithAggregatesFilter<"ProductLike"> | string
    userId?: StringWithAggregatesFilter<"ProductLike"> | string
    createdAt?: DateTimeWithAggregatesFilter<"ProductLike"> | Date | string
  }

  export type CategoryWhereInput = {
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    id?: StringFilter<"Category"> | string
    name?: StringFilter<"Category"> | string
    slug?: StringFilter<"Category"> | string
    createdAt?: DateTimeFilter<"Category"> | Date | string
    products?: ProductListRelationFilter
  }

  export type CategoryOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    createdAt?: SortOrder
    products?: ProductOrderByRelationAggregateInput
  }

  export type CategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    slug?: string
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    createdAt?: DateTimeFilter<"Category"> | Date | string
    products?: ProductListRelationFilter
  }, "id" | "name" | "slug">

  export type CategoryOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    createdAt?: SortOrder
    _count?: CategoryCountOrderByAggregateInput
    _max?: CategoryMaxOrderByAggregateInput
    _min?: CategoryMinOrderByAggregateInput
  }

  export type CategoryScalarWhereWithAggregatesInput = {
    AND?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    OR?: CategoryScalarWhereWithAggregatesInput[]
    NOT?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Category"> | string
    name?: StringWithAggregatesFilter<"Category"> | string
    slug?: StringWithAggregatesFilter<"Category"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Category"> | Date | string
  }

  export type FlashSaleWhereInput = {
    AND?: FlashSaleWhereInput | FlashSaleWhereInput[]
    OR?: FlashSaleWhereInput[]
    NOT?: FlashSaleWhereInput | FlashSaleWhereInput[]
    id?: StringFilter<"FlashSale"> | string
    timeSlot?: StringFilter<"FlashSale"> | string
    productsCount?: IntFilter<"FlashSale"> | number
    status?: StringFilter<"FlashSale"> | string
    createdAt?: DateTimeFilter<"FlashSale"> | Date | string
  }

  export type FlashSaleOrderByWithRelationInput = {
    id?: SortOrder
    timeSlot?: SortOrder
    productsCount?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type FlashSaleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    timeSlot?: string
    AND?: FlashSaleWhereInput | FlashSaleWhereInput[]
    OR?: FlashSaleWhereInput[]
    NOT?: FlashSaleWhereInput | FlashSaleWhereInput[]
    productsCount?: IntFilter<"FlashSale"> | number
    status?: StringFilter<"FlashSale"> | string
    createdAt?: DateTimeFilter<"FlashSale"> | Date | string
  }, "id" | "timeSlot">

  export type FlashSaleOrderByWithAggregationInput = {
    id?: SortOrder
    timeSlot?: SortOrder
    productsCount?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    _count?: FlashSaleCountOrderByAggregateInput
    _avg?: FlashSaleAvgOrderByAggregateInput
    _max?: FlashSaleMaxOrderByAggregateInput
    _min?: FlashSaleMinOrderByAggregateInput
    _sum?: FlashSaleSumOrderByAggregateInput
  }

  export type FlashSaleScalarWhereWithAggregatesInput = {
    AND?: FlashSaleScalarWhereWithAggregatesInput | FlashSaleScalarWhereWithAggregatesInput[]
    OR?: FlashSaleScalarWhereWithAggregatesInput[]
    NOT?: FlashSaleScalarWhereWithAggregatesInput | FlashSaleScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"FlashSale"> | string
    timeSlot?: StringWithAggregatesFilter<"FlashSale"> | string
    productsCount?: IntWithAggregatesFilter<"FlashSale"> | number
    status?: StringWithAggregatesFilter<"FlashSale"> | string
    createdAt?: DateTimeWithAggregatesFilter<"FlashSale"> | Date | string
  }

  export type ProductCreateInput = {
    id?: string
    shopId: string
    name: string
    image?: string | null
    images?: string | null
    video?: string | null
    category: string
    brand: string
    description: string
    price: string
    originalPrice?: string | null
    costPrice?: number | null
    stock: number
    sales?: number
    status: string
    sku?: string | null
    variationsText?: string | null
    hasVariations?: boolean
    variationGroups?: string | null
    variationRows?: string | null
    weight?: string | null
    length?: string | null
    width?: string | null
    height?: string | null
    condition?: string
    isPreOrder?: boolean
    preOrderDays?: string | null
    isViolated?: boolean
    violationReason?: string | null
    reportsCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    categoryRef?: CategoryCreateNestedOneWithoutProductsInput
    priceHistories?: PriceHistoryCreateNestedManyWithoutProductInput
    costHistories?: CostPriceHistoryCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateInput = {
    id?: string
    shopId: string
    name: string
    image?: string | null
    images?: string | null
    video?: string | null
    category: string
    categoryId?: string | null
    brand: string
    description: string
    price: string
    originalPrice?: string | null
    costPrice?: number | null
    stock: number
    sales?: number
    status: string
    sku?: string | null
    variationsText?: string | null
    hasVariations?: boolean
    variationGroups?: string | null
    variationRows?: string | null
    weight?: string | null
    length?: string | null
    width?: string | null
    height?: string | null
    condition?: string
    isPreOrder?: boolean
    preOrderDays?: string | null
    isViolated?: boolean
    violationReason?: string | null
    reportsCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    priceHistories?: PriceHistoryUncheckedCreateNestedManyWithoutProductInput
    costHistories?: CostPriceHistoryUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    images?: NullableStringFieldUpdateOperationsInput | string | null
    video?: NullableStringFieldUpdateOperationsInput | string | null
    category?: StringFieldUpdateOperationsInput | string
    brand?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    price?: StringFieldUpdateOperationsInput | string
    originalPrice?: NullableStringFieldUpdateOperationsInput | string | null
    costPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    stock?: IntFieldUpdateOperationsInput | number
    sales?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    variationsText?: NullableStringFieldUpdateOperationsInput | string | null
    hasVariations?: BoolFieldUpdateOperationsInput | boolean
    variationGroups?: NullableStringFieldUpdateOperationsInput | string | null
    variationRows?: NullableStringFieldUpdateOperationsInput | string | null
    weight?: NullableStringFieldUpdateOperationsInput | string | null
    length?: NullableStringFieldUpdateOperationsInput | string | null
    width?: NullableStringFieldUpdateOperationsInput | string | null
    height?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: StringFieldUpdateOperationsInput | string
    isPreOrder?: BoolFieldUpdateOperationsInput | boolean
    preOrderDays?: NullableStringFieldUpdateOperationsInput | string | null
    isViolated?: BoolFieldUpdateOperationsInput | boolean
    violationReason?: NullableStringFieldUpdateOperationsInput | string | null
    reportsCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categoryRef?: CategoryUpdateOneWithoutProductsNestedInput
    priceHistories?: PriceHistoryUpdateManyWithoutProductNestedInput
    costHistories?: CostPriceHistoryUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    images?: NullableStringFieldUpdateOperationsInput | string | null
    video?: NullableStringFieldUpdateOperationsInput | string | null
    category?: StringFieldUpdateOperationsInput | string
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    price?: StringFieldUpdateOperationsInput | string
    originalPrice?: NullableStringFieldUpdateOperationsInput | string | null
    costPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    stock?: IntFieldUpdateOperationsInput | number
    sales?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    variationsText?: NullableStringFieldUpdateOperationsInput | string | null
    hasVariations?: BoolFieldUpdateOperationsInput | boolean
    variationGroups?: NullableStringFieldUpdateOperationsInput | string | null
    variationRows?: NullableStringFieldUpdateOperationsInput | string | null
    weight?: NullableStringFieldUpdateOperationsInput | string | null
    length?: NullableStringFieldUpdateOperationsInput | string | null
    width?: NullableStringFieldUpdateOperationsInput | string | null
    height?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: StringFieldUpdateOperationsInput | string
    isPreOrder?: BoolFieldUpdateOperationsInput | boolean
    preOrderDays?: NullableStringFieldUpdateOperationsInput | string | null
    isViolated?: BoolFieldUpdateOperationsInput | boolean
    violationReason?: NullableStringFieldUpdateOperationsInput | string | null
    reportsCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    priceHistories?: PriceHistoryUncheckedUpdateManyWithoutProductNestedInput
    costHistories?: CostPriceHistoryUncheckedUpdateManyWithoutProductNestedInput
  }

  export type ProductCreateManyInput = {
    id?: string
    shopId: string
    name: string
    image?: string | null
    images?: string | null
    video?: string | null
    category: string
    categoryId?: string | null
    brand: string
    description: string
    price: string
    originalPrice?: string | null
    costPrice?: number | null
    stock: number
    sales?: number
    status: string
    sku?: string | null
    variationsText?: string | null
    hasVariations?: boolean
    variationGroups?: string | null
    variationRows?: string | null
    weight?: string | null
    length?: string | null
    width?: string | null
    height?: string | null
    condition?: string
    isPreOrder?: boolean
    preOrderDays?: string | null
    isViolated?: boolean
    violationReason?: string | null
    reportsCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProductUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    images?: NullableStringFieldUpdateOperationsInput | string | null
    video?: NullableStringFieldUpdateOperationsInput | string | null
    category?: StringFieldUpdateOperationsInput | string
    brand?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    price?: StringFieldUpdateOperationsInput | string
    originalPrice?: NullableStringFieldUpdateOperationsInput | string | null
    costPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    stock?: IntFieldUpdateOperationsInput | number
    sales?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    variationsText?: NullableStringFieldUpdateOperationsInput | string | null
    hasVariations?: BoolFieldUpdateOperationsInput | boolean
    variationGroups?: NullableStringFieldUpdateOperationsInput | string | null
    variationRows?: NullableStringFieldUpdateOperationsInput | string | null
    weight?: NullableStringFieldUpdateOperationsInput | string | null
    length?: NullableStringFieldUpdateOperationsInput | string | null
    width?: NullableStringFieldUpdateOperationsInput | string | null
    height?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: StringFieldUpdateOperationsInput | string
    isPreOrder?: BoolFieldUpdateOperationsInput | boolean
    preOrderDays?: NullableStringFieldUpdateOperationsInput | string | null
    isViolated?: BoolFieldUpdateOperationsInput | boolean
    violationReason?: NullableStringFieldUpdateOperationsInput | string | null
    reportsCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    images?: NullableStringFieldUpdateOperationsInput | string | null
    video?: NullableStringFieldUpdateOperationsInput | string | null
    category?: StringFieldUpdateOperationsInput | string
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    price?: StringFieldUpdateOperationsInput | string
    originalPrice?: NullableStringFieldUpdateOperationsInput | string | null
    costPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    stock?: IntFieldUpdateOperationsInput | number
    sales?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    variationsText?: NullableStringFieldUpdateOperationsInput | string | null
    hasVariations?: BoolFieldUpdateOperationsInput | boolean
    variationGroups?: NullableStringFieldUpdateOperationsInput | string | null
    variationRows?: NullableStringFieldUpdateOperationsInput | string | null
    weight?: NullableStringFieldUpdateOperationsInput | string | null
    length?: NullableStringFieldUpdateOperationsInput | string | null
    width?: NullableStringFieldUpdateOperationsInput | string | null
    height?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: StringFieldUpdateOperationsInput | string
    isPreOrder?: BoolFieldUpdateOperationsInput | boolean
    preOrderDays?: NullableStringFieldUpdateOperationsInput | string | null
    isViolated?: BoolFieldUpdateOperationsInput | boolean
    violationReason?: NullableStringFieldUpdateOperationsInput | string | null
    reportsCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PriceHistoryCreateInput = {
    id?: string
    shopId: string
    oldPrice: number
    newPrice: number
    changeType?: string
    changedBy: string
    changedByRole?: string
    reason?: string | null
    createdAt?: Date | string
    product: ProductCreateNestedOneWithoutPriceHistoriesInput
  }

  export type PriceHistoryUncheckedCreateInput = {
    id?: string
    productId: string
    shopId: string
    oldPrice: number
    newPrice: number
    changeType?: string
    changedBy: string
    changedByRole?: string
    reason?: string | null
    createdAt?: Date | string
  }

  export type PriceHistoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    oldPrice?: FloatFieldUpdateOperationsInput | number
    newPrice?: FloatFieldUpdateOperationsInput | number
    changeType?: StringFieldUpdateOperationsInput | string
    changedBy?: StringFieldUpdateOperationsInput | string
    changedByRole?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    product?: ProductUpdateOneRequiredWithoutPriceHistoriesNestedInput
  }

  export type PriceHistoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    oldPrice?: FloatFieldUpdateOperationsInput | number
    newPrice?: FloatFieldUpdateOperationsInput | number
    changeType?: StringFieldUpdateOperationsInput | string
    changedBy?: StringFieldUpdateOperationsInput | string
    changedByRole?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PriceHistoryCreateManyInput = {
    id?: string
    productId: string
    shopId: string
    oldPrice: number
    newPrice: number
    changeType?: string
    changedBy: string
    changedByRole?: string
    reason?: string | null
    createdAt?: Date | string
  }

  export type PriceHistoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    oldPrice?: FloatFieldUpdateOperationsInput | number
    newPrice?: FloatFieldUpdateOperationsInput | number
    changeType?: StringFieldUpdateOperationsInput | string
    changedBy?: StringFieldUpdateOperationsInput | string
    changedByRole?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PriceHistoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    oldPrice?: FloatFieldUpdateOperationsInput | number
    newPrice?: FloatFieldUpdateOperationsInput | number
    changeType?: StringFieldUpdateOperationsInput | string
    changedBy?: StringFieldUpdateOperationsInput | string
    changedByRole?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CostPriceHistoryCreateInput = {
    id?: string
    shopId: string
    costPrice: number
    quantity: number
    invoiceCode?: string | null
    supplier?: string | null
    note?: string | null
    importedBy: string
    importDate?: Date | string
    createdAt?: Date | string
    product: ProductCreateNestedOneWithoutCostHistoriesInput
  }

  export type CostPriceHistoryUncheckedCreateInput = {
    id?: string
    productId: string
    shopId: string
    costPrice: number
    quantity: number
    invoiceCode?: string | null
    supplier?: string | null
    note?: string | null
    importedBy: string
    importDate?: Date | string
    createdAt?: Date | string
  }

  export type CostPriceHistoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    costPrice?: FloatFieldUpdateOperationsInput | number
    quantity?: IntFieldUpdateOperationsInput | number
    invoiceCode?: NullableStringFieldUpdateOperationsInput | string | null
    supplier?: NullableStringFieldUpdateOperationsInput | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
    importedBy?: StringFieldUpdateOperationsInput | string
    importDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    product?: ProductUpdateOneRequiredWithoutCostHistoriesNestedInput
  }

  export type CostPriceHistoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    costPrice?: FloatFieldUpdateOperationsInput | number
    quantity?: IntFieldUpdateOperationsInput | number
    invoiceCode?: NullableStringFieldUpdateOperationsInput | string | null
    supplier?: NullableStringFieldUpdateOperationsInput | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
    importedBy?: StringFieldUpdateOperationsInput | string
    importDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CostPriceHistoryCreateManyInput = {
    id?: string
    productId: string
    shopId: string
    costPrice: number
    quantity: number
    invoiceCode?: string | null
    supplier?: string | null
    note?: string | null
    importedBy: string
    importDate?: Date | string
    createdAt?: Date | string
  }

  export type CostPriceHistoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    costPrice?: FloatFieldUpdateOperationsInput | number
    quantity?: IntFieldUpdateOperationsInput | number
    invoiceCode?: NullableStringFieldUpdateOperationsInput | string | null
    supplier?: NullableStringFieldUpdateOperationsInput | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
    importedBy?: StringFieldUpdateOperationsInput | string
    importDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CostPriceHistoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    costPrice?: FloatFieldUpdateOperationsInput | number
    quantity?: IntFieldUpdateOperationsInput | number
    invoiceCode?: NullableStringFieldUpdateOperationsInput | string | null
    supplier?: NullableStringFieldUpdateOperationsInput | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
    importedBy?: StringFieldUpdateOperationsInput | string
    importDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewCreateInput = {
    id?: string
    productId: string
    orderId?: string | null
    username: string
    rating: number
    comment: string
    variant: string
    images?: string | null
    reply?: string | null
    createdAt?: Date | string
  }

  export type ReviewUncheckedCreateInput = {
    id?: string
    productId: string
    orderId?: string | null
    username: string
    rating: number
    comment: string
    variant: string
    images?: string | null
    reply?: string | null
    createdAt?: Date | string
  }

  export type ReviewUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: StringFieldUpdateOperationsInput | string
    variant?: StringFieldUpdateOperationsInput | string
    images?: NullableStringFieldUpdateOperationsInput | string | null
    reply?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: StringFieldUpdateOperationsInput | string
    variant?: StringFieldUpdateOperationsInput | string
    images?: NullableStringFieldUpdateOperationsInput | string | null
    reply?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewCreateManyInput = {
    id?: string
    productId: string
    orderId?: string | null
    username: string
    rating: number
    comment: string
    variant: string
    images?: string | null
    reply?: string | null
    createdAt?: Date | string
  }

  export type ReviewUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: StringFieldUpdateOperationsInput | string
    variant?: StringFieldUpdateOperationsInput | string
    images?: NullableStringFieldUpdateOperationsInput | string | null
    reply?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: StringFieldUpdateOperationsInput | string
    variant?: StringFieldUpdateOperationsInput | string
    images?: NullableStringFieldUpdateOperationsInput | string | null
    reply?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductLikeCreateInput = {
    id?: string
    productId: string
    userId: string
    createdAt?: Date | string
  }

  export type ProductLikeUncheckedCreateInput = {
    id?: string
    productId: string
    userId: string
    createdAt?: Date | string
  }

  export type ProductLikeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductLikeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductLikeCreateManyInput = {
    id?: string
    productId: string
    userId: string
    createdAt?: Date | string
  }

  export type ProductLikeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductLikeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryCreateInput = {
    id?: string
    name: string
    slug: string
    createdAt?: Date | string
    products?: ProductCreateNestedManyWithoutCategoryRefInput
  }

  export type CategoryUncheckedCreateInput = {
    id?: string
    name: string
    slug: string
    createdAt?: Date | string
    products?: ProductUncheckedCreateNestedManyWithoutCategoryRefInput
  }

  export type CategoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUpdateManyWithoutCategoryRefNestedInput
  }

  export type CategoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    products?: ProductUncheckedUpdateManyWithoutCategoryRefNestedInput
  }

  export type CategoryCreateManyInput = {
    id?: string
    name: string
    slug: string
    createdAt?: Date | string
  }

  export type CategoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FlashSaleCreateInput = {
    id?: string
    timeSlot: string
    productsCount?: number
    status?: string
    createdAt?: Date | string
  }

  export type FlashSaleUncheckedCreateInput = {
    id?: string
    timeSlot: string
    productsCount?: number
    status?: string
    createdAt?: Date | string
  }

  export type FlashSaleUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    timeSlot?: StringFieldUpdateOperationsInput | string
    productsCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FlashSaleUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    timeSlot?: StringFieldUpdateOperationsInput | string
    productsCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FlashSaleCreateManyInput = {
    id?: string
    timeSlot: string
    productsCount?: number
    status?: string
    createdAt?: Date | string
  }

  export type FlashSaleUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    timeSlot?: StringFieldUpdateOperationsInput | string
    productsCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FlashSaleUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    timeSlot?: StringFieldUpdateOperationsInput | string
    productsCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type CategoryNullableScalarRelationFilter = {
    is?: CategoryWhereInput | null
    isNot?: CategoryWhereInput | null
  }

  export type PriceHistoryListRelationFilter = {
    every?: PriceHistoryWhereInput
    some?: PriceHistoryWhereInput
    none?: PriceHistoryWhereInput
  }

  export type CostPriceHistoryListRelationFilter = {
    every?: CostPriceHistoryWhereInput
    some?: CostPriceHistoryWhereInput
    none?: CostPriceHistoryWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type PriceHistoryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CostPriceHistoryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ProductCountOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    image?: SortOrder
    images?: SortOrder
    video?: SortOrder
    category?: SortOrder
    categoryId?: SortOrder
    brand?: SortOrder
    description?: SortOrder
    price?: SortOrder
    originalPrice?: SortOrder
    costPrice?: SortOrder
    stock?: SortOrder
    sales?: SortOrder
    status?: SortOrder
    sku?: SortOrder
    variationsText?: SortOrder
    hasVariations?: SortOrder
    variationGroups?: SortOrder
    variationRows?: SortOrder
    weight?: SortOrder
    length?: SortOrder
    width?: SortOrder
    height?: SortOrder
    condition?: SortOrder
    isPreOrder?: SortOrder
    preOrderDays?: SortOrder
    isViolated?: SortOrder
    violationReason?: SortOrder
    reportsCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProductAvgOrderByAggregateInput = {
    costPrice?: SortOrder
    stock?: SortOrder
    sales?: SortOrder
    reportsCount?: SortOrder
  }

  export type ProductMaxOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    image?: SortOrder
    images?: SortOrder
    video?: SortOrder
    category?: SortOrder
    categoryId?: SortOrder
    brand?: SortOrder
    description?: SortOrder
    price?: SortOrder
    originalPrice?: SortOrder
    costPrice?: SortOrder
    stock?: SortOrder
    sales?: SortOrder
    status?: SortOrder
    sku?: SortOrder
    variationsText?: SortOrder
    hasVariations?: SortOrder
    variationGroups?: SortOrder
    variationRows?: SortOrder
    weight?: SortOrder
    length?: SortOrder
    width?: SortOrder
    height?: SortOrder
    condition?: SortOrder
    isPreOrder?: SortOrder
    preOrderDays?: SortOrder
    isViolated?: SortOrder
    violationReason?: SortOrder
    reportsCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProductMinOrderByAggregateInput = {
    id?: SortOrder
    shopId?: SortOrder
    name?: SortOrder
    image?: SortOrder
    images?: SortOrder
    video?: SortOrder
    category?: SortOrder
    categoryId?: SortOrder
    brand?: SortOrder
    description?: SortOrder
    price?: SortOrder
    originalPrice?: SortOrder
    costPrice?: SortOrder
    stock?: SortOrder
    sales?: SortOrder
    status?: SortOrder
    sku?: SortOrder
    variationsText?: SortOrder
    hasVariations?: SortOrder
    variationGroups?: SortOrder
    variationRows?: SortOrder
    weight?: SortOrder
    length?: SortOrder
    width?: SortOrder
    height?: SortOrder
    condition?: SortOrder
    isPreOrder?: SortOrder
    preOrderDays?: SortOrder
    isViolated?: SortOrder
    violationReason?: SortOrder
    reportsCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProductSumOrderByAggregateInput = {
    costPrice?: SortOrder
    stock?: SortOrder
    sales?: SortOrder
    reportsCount?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type ProductScalarRelationFilter = {
    is?: ProductWhereInput
    isNot?: ProductWhereInput
  }

  export type PriceHistoryCountOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    shopId?: SortOrder
    oldPrice?: SortOrder
    newPrice?: SortOrder
    changeType?: SortOrder
    changedBy?: SortOrder
    changedByRole?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type PriceHistoryAvgOrderByAggregateInput = {
    oldPrice?: SortOrder
    newPrice?: SortOrder
  }

  export type PriceHistoryMaxOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    shopId?: SortOrder
    oldPrice?: SortOrder
    newPrice?: SortOrder
    changeType?: SortOrder
    changedBy?: SortOrder
    changedByRole?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type PriceHistoryMinOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    shopId?: SortOrder
    oldPrice?: SortOrder
    newPrice?: SortOrder
    changeType?: SortOrder
    changedBy?: SortOrder
    changedByRole?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type PriceHistorySumOrderByAggregateInput = {
    oldPrice?: SortOrder
    newPrice?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type CostPriceHistoryCountOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    shopId?: SortOrder
    costPrice?: SortOrder
    quantity?: SortOrder
    invoiceCode?: SortOrder
    supplier?: SortOrder
    note?: SortOrder
    importedBy?: SortOrder
    importDate?: SortOrder
    createdAt?: SortOrder
  }

  export type CostPriceHistoryAvgOrderByAggregateInput = {
    costPrice?: SortOrder
    quantity?: SortOrder
  }

  export type CostPriceHistoryMaxOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    shopId?: SortOrder
    costPrice?: SortOrder
    quantity?: SortOrder
    invoiceCode?: SortOrder
    supplier?: SortOrder
    note?: SortOrder
    importedBy?: SortOrder
    importDate?: SortOrder
    createdAt?: SortOrder
  }

  export type CostPriceHistoryMinOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    shopId?: SortOrder
    costPrice?: SortOrder
    quantity?: SortOrder
    invoiceCode?: SortOrder
    supplier?: SortOrder
    note?: SortOrder
    importedBy?: SortOrder
    importDate?: SortOrder
    createdAt?: SortOrder
  }

  export type CostPriceHistorySumOrderByAggregateInput = {
    costPrice?: SortOrder
    quantity?: SortOrder
  }

  export type ReviewCountOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    orderId?: SortOrder
    username?: SortOrder
    rating?: SortOrder
    comment?: SortOrder
    variant?: SortOrder
    images?: SortOrder
    reply?: SortOrder
    createdAt?: SortOrder
  }

  export type ReviewAvgOrderByAggregateInput = {
    rating?: SortOrder
  }

  export type ReviewMaxOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    orderId?: SortOrder
    username?: SortOrder
    rating?: SortOrder
    comment?: SortOrder
    variant?: SortOrder
    images?: SortOrder
    reply?: SortOrder
    createdAt?: SortOrder
  }

  export type ReviewMinOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    orderId?: SortOrder
    username?: SortOrder
    rating?: SortOrder
    comment?: SortOrder
    variant?: SortOrder
    images?: SortOrder
    reply?: SortOrder
    createdAt?: SortOrder
  }

  export type ReviewSumOrderByAggregateInput = {
    rating?: SortOrder
  }

  export type ProductLikeProductIdUserIdCompoundUniqueInput = {
    productId: string
    userId: string
  }

  export type ProductLikeCountOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type ProductLikeMaxOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type ProductLikeMinOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type ProductListRelationFilter = {
    every?: ProductWhereInput
    some?: ProductWhereInput
    none?: ProductWhereInput
  }

  export type ProductOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CategoryCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    createdAt?: SortOrder
  }

  export type CategoryMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    createdAt?: SortOrder
  }

  export type CategoryMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    createdAt?: SortOrder
  }

  export type FlashSaleCountOrderByAggregateInput = {
    id?: SortOrder
    timeSlot?: SortOrder
    productsCount?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type FlashSaleAvgOrderByAggregateInput = {
    productsCount?: SortOrder
  }

  export type FlashSaleMaxOrderByAggregateInput = {
    id?: SortOrder
    timeSlot?: SortOrder
    productsCount?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type FlashSaleMinOrderByAggregateInput = {
    id?: SortOrder
    timeSlot?: SortOrder
    productsCount?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type FlashSaleSumOrderByAggregateInput = {
    productsCount?: SortOrder
  }

  export type CategoryCreateNestedOneWithoutProductsInput = {
    create?: XOR<CategoryCreateWithoutProductsInput, CategoryUncheckedCreateWithoutProductsInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutProductsInput
    connect?: CategoryWhereUniqueInput
  }

  export type PriceHistoryCreateNestedManyWithoutProductInput = {
    create?: XOR<PriceHistoryCreateWithoutProductInput, PriceHistoryUncheckedCreateWithoutProductInput> | PriceHistoryCreateWithoutProductInput[] | PriceHistoryUncheckedCreateWithoutProductInput[]
    connectOrCreate?: PriceHistoryCreateOrConnectWithoutProductInput | PriceHistoryCreateOrConnectWithoutProductInput[]
    createMany?: PriceHistoryCreateManyProductInputEnvelope
    connect?: PriceHistoryWhereUniqueInput | PriceHistoryWhereUniqueInput[]
  }

  export type CostPriceHistoryCreateNestedManyWithoutProductInput = {
    create?: XOR<CostPriceHistoryCreateWithoutProductInput, CostPriceHistoryUncheckedCreateWithoutProductInput> | CostPriceHistoryCreateWithoutProductInput[] | CostPriceHistoryUncheckedCreateWithoutProductInput[]
    connectOrCreate?: CostPriceHistoryCreateOrConnectWithoutProductInput | CostPriceHistoryCreateOrConnectWithoutProductInput[]
    createMany?: CostPriceHistoryCreateManyProductInputEnvelope
    connect?: CostPriceHistoryWhereUniqueInput | CostPriceHistoryWhereUniqueInput[]
  }

  export type PriceHistoryUncheckedCreateNestedManyWithoutProductInput = {
    create?: XOR<PriceHistoryCreateWithoutProductInput, PriceHistoryUncheckedCreateWithoutProductInput> | PriceHistoryCreateWithoutProductInput[] | PriceHistoryUncheckedCreateWithoutProductInput[]
    connectOrCreate?: PriceHistoryCreateOrConnectWithoutProductInput | PriceHistoryCreateOrConnectWithoutProductInput[]
    createMany?: PriceHistoryCreateManyProductInputEnvelope
    connect?: PriceHistoryWhereUniqueInput | PriceHistoryWhereUniqueInput[]
  }

  export type CostPriceHistoryUncheckedCreateNestedManyWithoutProductInput = {
    create?: XOR<CostPriceHistoryCreateWithoutProductInput, CostPriceHistoryUncheckedCreateWithoutProductInput> | CostPriceHistoryCreateWithoutProductInput[] | CostPriceHistoryUncheckedCreateWithoutProductInput[]
    connectOrCreate?: CostPriceHistoryCreateOrConnectWithoutProductInput | CostPriceHistoryCreateOrConnectWithoutProductInput[]
    createMany?: CostPriceHistoryCreateManyProductInputEnvelope
    connect?: CostPriceHistoryWhereUniqueInput | CostPriceHistoryWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type CategoryUpdateOneWithoutProductsNestedInput = {
    create?: XOR<CategoryCreateWithoutProductsInput, CategoryUncheckedCreateWithoutProductsInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutProductsInput
    upsert?: CategoryUpsertWithoutProductsInput
    disconnect?: CategoryWhereInput | boolean
    delete?: CategoryWhereInput | boolean
    connect?: CategoryWhereUniqueInput
    update?: XOR<XOR<CategoryUpdateToOneWithWhereWithoutProductsInput, CategoryUpdateWithoutProductsInput>, CategoryUncheckedUpdateWithoutProductsInput>
  }

  export type PriceHistoryUpdateManyWithoutProductNestedInput = {
    create?: XOR<PriceHistoryCreateWithoutProductInput, PriceHistoryUncheckedCreateWithoutProductInput> | PriceHistoryCreateWithoutProductInput[] | PriceHistoryUncheckedCreateWithoutProductInput[]
    connectOrCreate?: PriceHistoryCreateOrConnectWithoutProductInput | PriceHistoryCreateOrConnectWithoutProductInput[]
    upsert?: PriceHistoryUpsertWithWhereUniqueWithoutProductInput | PriceHistoryUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: PriceHistoryCreateManyProductInputEnvelope
    set?: PriceHistoryWhereUniqueInput | PriceHistoryWhereUniqueInput[]
    disconnect?: PriceHistoryWhereUniqueInput | PriceHistoryWhereUniqueInput[]
    delete?: PriceHistoryWhereUniqueInput | PriceHistoryWhereUniqueInput[]
    connect?: PriceHistoryWhereUniqueInput | PriceHistoryWhereUniqueInput[]
    update?: PriceHistoryUpdateWithWhereUniqueWithoutProductInput | PriceHistoryUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: PriceHistoryUpdateManyWithWhereWithoutProductInput | PriceHistoryUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: PriceHistoryScalarWhereInput | PriceHistoryScalarWhereInput[]
  }

  export type CostPriceHistoryUpdateManyWithoutProductNestedInput = {
    create?: XOR<CostPriceHistoryCreateWithoutProductInput, CostPriceHistoryUncheckedCreateWithoutProductInput> | CostPriceHistoryCreateWithoutProductInput[] | CostPriceHistoryUncheckedCreateWithoutProductInput[]
    connectOrCreate?: CostPriceHistoryCreateOrConnectWithoutProductInput | CostPriceHistoryCreateOrConnectWithoutProductInput[]
    upsert?: CostPriceHistoryUpsertWithWhereUniqueWithoutProductInput | CostPriceHistoryUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: CostPriceHistoryCreateManyProductInputEnvelope
    set?: CostPriceHistoryWhereUniqueInput | CostPriceHistoryWhereUniqueInput[]
    disconnect?: CostPriceHistoryWhereUniqueInput | CostPriceHistoryWhereUniqueInput[]
    delete?: CostPriceHistoryWhereUniqueInput | CostPriceHistoryWhereUniqueInput[]
    connect?: CostPriceHistoryWhereUniqueInput | CostPriceHistoryWhereUniqueInput[]
    update?: CostPriceHistoryUpdateWithWhereUniqueWithoutProductInput | CostPriceHistoryUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: CostPriceHistoryUpdateManyWithWhereWithoutProductInput | CostPriceHistoryUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: CostPriceHistoryScalarWhereInput | CostPriceHistoryScalarWhereInput[]
  }

  export type PriceHistoryUncheckedUpdateManyWithoutProductNestedInput = {
    create?: XOR<PriceHistoryCreateWithoutProductInput, PriceHistoryUncheckedCreateWithoutProductInput> | PriceHistoryCreateWithoutProductInput[] | PriceHistoryUncheckedCreateWithoutProductInput[]
    connectOrCreate?: PriceHistoryCreateOrConnectWithoutProductInput | PriceHistoryCreateOrConnectWithoutProductInput[]
    upsert?: PriceHistoryUpsertWithWhereUniqueWithoutProductInput | PriceHistoryUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: PriceHistoryCreateManyProductInputEnvelope
    set?: PriceHistoryWhereUniqueInput | PriceHistoryWhereUniqueInput[]
    disconnect?: PriceHistoryWhereUniqueInput | PriceHistoryWhereUniqueInput[]
    delete?: PriceHistoryWhereUniqueInput | PriceHistoryWhereUniqueInput[]
    connect?: PriceHistoryWhereUniqueInput | PriceHistoryWhereUniqueInput[]
    update?: PriceHistoryUpdateWithWhereUniqueWithoutProductInput | PriceHistoryUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: PriceHistoryUpdateManyWithWhereWithoutProductInput | PriceHistoryUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: PriceHistoryScalarWhereInput | PriceHistoryScalarWhereInput[]
  }

  export type CostPriceHistoryUncheckedUpdateManyWithoutProductNestedInput = {
    create?: XOR<CostPriceHistoryCreateWithoutProductInput, CostPriceHistoryUncheckedCreateWithoutProductInput> | CostPriceHistoryCreateWithoutProductInput[] | CostPriceHistoryUncheckedCreateWithoutProductInput[]
    connectOrCreate?: CostPriceHistoryCreateOrConnectWithoutProductInput | CostPriceHistoryCreateOrConnectWithoutProductInput[]
    upsert?: CostPriceHistoryUpsertWithWhereUniqueWithoutProductInput | CostPriceHistoryUpsertWithWhereUniqueWithoutProductInput[]
    createMany?: CostPriceHistoryCreateManyProductInputEnvelope
    set?: CostPriceHistoryWhereUniqueInput | CostPriceHistoryWhereUniqueInput[]
    disconnect?: CostPriceHistoryWhereUniqueInput | CostPriceHistoryWhereUniqueInput[]
    delete?: CostPriceHistoryWhereUniqueInput | CostPriceHistoryWhereUniqueInput[]
    connect?: CostPriceHistoryWhereUniqueInput | CostPriceHistoryWhereUniqueInput[]
    update?: CostPriceHistoryUpdateWithWhereUniqueWithoutProductInput | CostPriceHistoryUpdateWithWhereUniqueWithoutProductInput[]
    updateMany?: CostPriceHistoryUpdateManyWithWhereWithoutProductInput | CostPriceHistoryUpdateManyWithWhereWithoutProductInput[]
    deleteMany?: CostPriceHistoryScalarWhereInput | CostPriceHistoryScalarWhereInput[]
  }

  export type ProductCreateNestedOneWithoutPriceHistoriesInput = {
    create?: XOR<ProductCreateWithoutPriceHistoriesInput, ProductUncheckedCreateWithoutPriceHistoriesInput>
    connectOrCreate?: ProductCreateOrConnectWithoutPriceHistoriesInput
    connect?: ProductWhereUniqueInput
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ProductUpdateOneRequiredWithoutPriceHistoriesNestedInput = {
    create?: XOR<ProductCreateWithoutPriceHistoriesInput, ProductUncheckedCreateWithoutPriceHistoriesInput>
    connectOrCreate?: ProductCreateOrConnectWithoutPriceHistoriesInput
    upsert?: ProductUpsertWithoutPriceHistoriesInput
    connect?: ProductWhereUniqueInput
    update?: XOR<XOR<ProductUpdateToOneWithWhereWithoutPriceHistoriesInput, ProductUpdateWithoutPriceHistoriesInput>, ProductUncheckedUpdateWithoutPriceHistoriesInput>
  }

  export type ProductCreateNestedOneWithoutCostHistoriesInput = {
    create?: XOR<ProductCreateWithoutCostHistoriesInput, ProductUncheckedCreateWithoutCostHistoriesInput>
    connectOrCreate?: ProductCreateOrConnectWithoutCostHistoriesInput
    connect?: ProductWhereUniqueInput
  }

  export type ProductUpdateOneRequiredWithoutCostHistoriesNestedInput = {
    create?: XOR<ProductCreateWithoutCostHistoriesInput, ProductUncheckedCreateWithoutCostHistoriesInput>
    connectOrCreate?: ProductCreateOrConnectWithoutCostHistoriesInput
    upsert?: ProductUpsertWithoutCostHistoriesInput
    connect?: ProductWhereUniqueInput
    update?: XOR<XOR<ProductUpdateToOneWithWhereWithoutCostHistoriesInput, ProductUpdateWithoutCostHistoriesInput>, ProductUncheckedUpdateWithoutCostHistoriesInput>
  }

  export type ProductCreateNestedManyWithoutCategoryRefInput = {
    create?: XOR<ProductCreateWithoutCategoryRefInput, ProductUncheckedCreateWithoutCategoryRefInput> | ProductCreateWithoutCategoryRefInput[] | ProductUncheckedCreateWithoutCategoryRefInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutCategoryRefInput | ProductCreateOrConnectWithoutCategoryRefInput[]
    createMany?: ProductCreateManyCategoryRefInputEnvelope
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
  }

  export type ProductUncheckedCreateNestedManyWithoutCategoryRefInput = {
    create?: XOR<ProductCreateWithoutCategoryRefInput, ProductUncheckedCreateWithoutCategoryRefInput> | ProductCreateWithoutCategoryRefInput[] | ProductUncheckedCreateWithoutCategoryRefInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutCategoryRefInput | ProductCreateOrConnectWithoutCategoryRefInput[]
    createMany?: ProductCreateManyCategoryRefInputEnvelope
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
  }

  export type ProductUpdateManyWithoutCategoryRefNestedInput = {
    create?: XOR<ProductCreateWithoutCategoryRefInput, ProductUncheckedCreateWithoutCategoryRefInput> | ProductCreateWithoutCategoryRefInput[] | ProductUncheckedCreateWithoutCategoryRefInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutCategoryRefInput | ProductCreateOrConnectWithoutCategoryRefInput[]
    upsert?: ProductUpsertWithWhereUniqueWithoutCategoryRefInput | ProductUpsertWithWhereUniqueWithoutCategoryRefInput[]
    createMany?: ProductCreateManyCategoryRefInputEnvelope
    set?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    disconnect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    delete?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    update?: ProductUpdateWithWhereUniqueWithoutCategoryRefInput | ProductUpdateWithWhereUniqueWithoutCategoryRefInput[]
    updateMany?: ProductUpdateManyWithWhereWithoutCategoryRefInput | ProductUpdateManyWithWhereWithoutCategoryRefInput[]
    deleteMany?: ProductScalarWhereInput | ProductScalarWhereInput[]
  }

  export type ProductUncheckedUpdateManyWithoutCategoryRefNestedInput = {
    create?: XOR<ProductCreateWithoutCategoryRefInput, ProductUncheckedCreateWithoutCategoryRefInput> | ProductCreateWithoutCategoryRefInput[] | ProductUncheckedCreateWithoutCategoryRefInput[]
    connectOrCreate?: ProductCreateOrConnectWithoutCategoryRefInput | ProductCreateOrConnectWithoutCategoryRefInput[]
    upsert?: ProductUpsertWithWhereUniqueWithoutCategoryRefInput | ProductUpsertWithWhereUniqueWithoutCategoryRefInput[]
    createMany?: ProductCreateManyCategoryRefInputEnvelope
    set?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    disconnect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    delete?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    connect?: ProductWhereUniqueInput | ProductWhereUniqueInput[]
    update?: ProductUpdateWithWhereUniqueWithoutCategoryRefInput | ProductUpdateWithWhereUniqueWithoutCategoryRefInput[]
    updateMany?: ProductUpdateManyWithWhereWithoutCategoryRefInput | ProductUpdateManyWithWhereWithoutCategoryRefInput[]
    deleteMany?: ProductScalarWhereInput | ProductScalarWhereInput[]
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type CategoryCreateWithoutProductsInput = {
    id?: string
    name: string
    slug: string
    createdAt?: Date | string
  }

  export type CategoryUncheckedCreateWithoutProductsInput = {
    id?: string
    name: string
    slug: string
    createdAt?: Date | string
  }

  export type CategoryCreateOrConnectWithoutProductsInput = {
    where: CategoryWhereUniqueInput
    create: XOR<CategoryCreateWithoutProductsInput, CategoryUncheckedCreateWithoutProductsInput>
  }

  export type PriceHistoryCreateWithoutProductInput = {
    id?: string
    shopId: string
    oldPrice: number
    newPrice: number
    changeType?: string
    changedBy: string
    changedByRole?: string
    reason?: string | null
    createdAt?: Date | string
  }

  export type PriceHistoryUncheckedCreateWithoutProductInput = {
    id?: string
    shopId: string
    oldPrice: number
    newPrice: number
    changeType?: string
    changedBy: string
    changedByRole?: string
    reason?: string | null
    createdAt?: Date | string
  }

  export type PriceHistoryCreateOrConnectWithoutProductInput = {
    where: PriceHistoryWhereUniqueInput
    create: XOR<PriceHistoryCreateWithoutProductInput, PriceHistoryUncheckedCreateWithoutProductInput>
  }

  export type PriceHistoryCreateManyProductInputEnvelope = {
    data: PriceHistoryCreateManyProductInput | PriceHistoryCreateManyProductInput[]
    skipDuplicates?: boolean
  }

  export type CostPriceHistoryCreateWithoutProductInput = {
    id?: string
    shopId: string
    costPrice: number
    quantity: number
    invoiceCode?: string | null
    supplier?: string | null
    note?: string | null
    importedBy: string
    importDate?: Date | string
    createdAt?: Date | string
  }

  export type CostPriceHistoryUncheckedCreateWithoutProductInput = {
    id?: string
    shopId: string
    costPrice: number
    quantity: number
    invoiceCode?: string | null
    supplier?: string | null
    note?: string | null
    importedBy: string
    importDate?: Date | string
    createdAt?: Date | string
  }

  export type CostPriceHistoryCreateOrConnectWithoutProductInput = {
    where: CostPriceHistoryWhereUniqueInput
    create: XOR<CostPriceHistoryCreateWithoutProductInput, CostPriceHistoryUncheckedCreateWithoutProductInput>
  }

  export type CostPriceHistoryCreateManyProductInputEnvelope = {
    data: CostPriceHistoryCreateManyProductInput | CostPriceHistoryCreateManyProductInput[]
    skipDuplicates?: boolean
  }

  export type CategoryUpsertWithoutProductsInput = {
    update: XOR<CategoryUpdateWithoutProductsInput, CategoryUncheckedUpdateWithoutProductsInput>
    create: XOR<CategoryCreateWithoutProductsInput, CategoryUncheckedCreateWithoutProductsInput>
    where?: CategoryWhereInput
  }

  export type CategoryUpdateToOneWithWhereWithoutProductsInput = {
    where?: CategoryWhereInput
    data: XOR<CategoryUpdateWithoutProductsInput, CategoryUncheckedUpdateWithoutProductsInput>
  }

  export type CategoryUpdateWithoutProductsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryUncheckedUpdateWithoutProductsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PriceHistoryUpsertWithWhereUniqueWithoutProductInput = {
    where: PriceHistoryWhereUniqueInput
    update: XOR<PriceHistoryUpdateWithoutProductInput, PriceHistoryUncheckedUpdateWithoutProductInput>
    create: XOR<PriceHistoryCreateWithoutProductInput, PriceHistoryUncheckedCreateWithoutProductInput>
  }

  export type PriceHistoryUpdateWithWhereUniqueWithoutProductInput = {
    where: PriceHistoryWhereUniqueInput
    data: XOR<PriceHistoryUpdateWithoutProductInput, PriceHistoryUncheckedUpdateWithoutProductInput>
  }

  export type PriceHistoryUpdateManyWithWhereWithoutProductInput = {
    where: PriceHistoryScalarWhereInput
    data: XOR<PriceHistoryUpdateManyMutationInput, PriceHistoryUncheckedUpdateManyWithoutProductInput>
  }

  export type PriceHistoryScalarWhereInput = {
    AND?: PriceHistoryScalarWhereInput | PriceHistoryScalarWhereInput[]
    OR?: PriceHistoryScalarWhereInput[]
    NOT?: PriceHistoryScalarWhereInput | PriceHistoryScalarWhereInput[]
    id?: StringFilter<"PriceHistory"> | string
    productId?: StringFilter<"PriceHistory"> | string
    shopId?: StringFilter<"PriceHistory"> | string
    oldPrice?: FloatFilter<"PriceHistory"> | number
    newPrice?: FloatFilter<"PriceHistory"> | number
    changeType?: StringFilter<"PriceHistory"> | string
    changedBy?: StringFilter<"PriceHistory"> | string
    changedByRole?: StringFilter<"PriceHistory"> | string
    reason?: StringNullableFilter<"PriceHistory"> | string | null
    createdAt?: DateTimeFilter<"PriceHistory"> | Date | string
  }

  export type CostPriceHistoryUpsertWithWhereUniqueWithoutProductInput = {
    where: CostPriceHistoryWhereUniqueInput
    update: XOR<CostPriceHistoryUpdateWithoutProductInput, CostPriceHistoryUncheckedUpdateWithoutProductInput>
    create: XOR<CostPriceHistoryCreateWithoutProductInput, CostPriceHistoryUncheckedCreateWithoutProductInput>
  }

  export type CostPriceHistoryUpdateWithWhereUniqueWithoutProductInput = {
    where: CostPriceHistoryWhereUniqueInput
    data: XOR<CostPriceHistoryUpdateWithoutProductInput, CostPriceHistoryUncheckedUpdateWithoutProductInput>
  }

  export type CostPriceHistoryUpdateManyWithWhereWithoutProductInput = {
    where: CostPriceHistoryScalarWhereInput
    data: XOR<CostPriceHistoryUpdateManyMutationInput, CostPriceHistoryUncheckedUpdateManyWithoutProductInput>
  }

  export type CostPriceHistoryScalarWhereInput = {
    AND?: CostPriceHistoryScalarWhereInput | CostPriceHistoryScalarWhereInput[]
    OR?: CostPriceHistoryScalarWhereInput[]
    NOT?: CostPriceHistoryScalarWhereInput | CostPriceHistoryScalarWhereInput[]
    id?: StringFilter<"CostPriceHistory"> | string
    productId?: StringFilter<"CostPriceHistory"> | string
    shopId?: StringFilter<"CostPriceHistory"> | string
    costPrice?: FloatFilter<"CostPriceHistory"> | number
    quantity?: IntFilter<"CostPriceHistory"> | number
    invoiceCode?: StringNullableFilter<"CostPriceHistory"> | string | null
    supplier?: StringNullableFilter<"CostPriceHistory"> | string | null
    note?: StringNullableFilter<"CostPriceHistory"> | string | null
    importedBy?: StringFilter<"CostPriceHistory"> | string
    importDate?: DateTimeFilter<"CostPriceHistory"> | Date | string
    createdAt?: DateTimeFilter<"CostPriceHistory"> | Date | string
  }

  export type ProductCreateWithoutPriceHistoriesInput = {
    id?: string
    shopId: string
    name: string
    image?: string | null
    images?: string | null
    video?: string | null
    category: string
    brand: string
    description: string
    price: string
    originalPrice?: string | null
    costPrice?: number | null
    stock: number
    sales?: number
    status: string
    sku?: string | null
    variationsText?: string | null
    hasVariations?: boolean
    variationGroups?: string | null
    variationRows?: string | null
    weight?: string | null
    length?: string | null
    width?: string | null
    height?: string | null
    condition?: string
    isPreOrder?: boolean
    preOrderDays?: string | null
    isViolated?: boolean
    violationReason?: string | null
    reportsCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    categoryRef?: CategoryCreateNestedOneWithoutProductsInput
    costHistories?: CostPriceHistoryCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateWithoutPriceHistoriesInput = {
    id?: string
    shopId: string
    name: string
    image?: string | null
    images?: string | null
    video?: string | null
    category: string
    categoryId?: string | null
    brand: string
    description: string
    price: string
    originalPrice?: string | null
    costPrice?: number | null
    stock: number
    sales?: number
    status: string
    sku?: string | null
    variationsText?: string | null
    hasVariations?: boolean
    variationGroups?: string | null
    variationRows?: string | null
    weight?: string | null
    length?: string | null
    width?: string | null
    height?: string | null
    condition?: string
    isPreOrder?: boolean
    preOrderDays?: string | null
    isViolated?: boolean
    violationReason?: string | null
    reportsCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    costHistories?: CostPriceHistoryUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutPriceHistoriesInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutPriceHistoriesInput, ProductUncheckedCreateWithoutPriceHistoriesInput>
  }

  export type ProductUpsertWithoutPriceHistoriesInput = {
    update: XOR<ProductUpdateWithoutPriceHistoriesInput, ProductUncheckedUpdateWithoutPriceHistoriesInput>
    create: XOR<ProductCreateWithoutPriceHistoriesInput, ProductUncheckedCreateWithoutPriceHistoriesInput>
    where?: ProductWhereInput
  }

  export type ProductUpdateToOneWithWhereWithoutPriceHistoriesInput = {
    where?: ProductWhereInput
    data: XOR<ProductUpdateWithoutPriceHistoriesInput, ProductUncheckedUpdateWithoutPriceHistoriesInput>
  }

  export type ProductUpdateWithoutPriceHistoriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    images?: NullableStringFieldUpdateOperationsInput | string | null
    video?: NullableStringFieldUpdateOperationsInput | string | null
    category?: StringFieldUpdateOperationsInput | string
    brand?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    price?: StringFieldUpdateOperationsInput | string
    originalPrice?: NullableStringFieldUpdateOperationsInput | string | null
    costPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    stock?: IntFieldUpdateOperationsInput | number
    sales?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    variationsText?: NullableStringFieldUpdateOperationsInput | string | null
    hasVariations?: BoolFieldUpdateOperationsInput | boolean
    variationGroups?: NullableStringFieldUpdateOperationsInput | string | null
    variationRows?: NullableStringFieldUpdateOperationsInput | string | null
    weight?: NullableStringFieldUpdateOperationsInput | string | null
    length?: NullableStringFieldUpdateOperationsInput | string | null
    width?: NullableStringFieldUpdateOperationsInput | string | null
    height?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: StringFieldUpdateOperationsInput | string
    isPreOrder?: BoolFieldUpdateOperationsInput | boolean
    preOrderDays?: NullableStringFieldUpdateOperationsInput | string | null
    isViolated?: BoolFieldUpdateOperationsInput | boolean
    violationReason?: NullableStringFieldUpdateOperationsInput | string | null
    reportsCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categoryRef?: CategoryUpdateOneWithoutProductsNestedInput
    costHistories?: CostPriceHistoryUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateWithoutPriceHistoriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    images?: NullableStringFieldUpdateOperationsInput | string | null
    video?: NullableStringFieldUpdateOperationsInput | string | null
    category?: StringFieldUpdateOperationsInput | string
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    price?: StringFieldUpdateOperationsInput | string
    originalPrice?: NullableStringFieldUpdateOperationsInput | string | null
    costPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    stock?: IntFieldUpdateOperationsInput | number
    sales?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    variationsText?: NullableStringFieldUpdateOperationsInput | string | null
    hasVariations?: BoolFieldUpdateOperationsInput | boolean
    variationGroups?: NullableStringFieldUpdateOperationsInput | string | null
    variationRows?: NullableStringFieldUpdateOperationsInput | string | null
    weight?: NullableStringFieldUpdateOperationsInput | string | null
    length?: NullableStringFieldUpdateOperationsInput | string | null
    width?: NullableStringFieldUpdateOperationsInput | string | null
    height?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: StringFieldUpdateOperationsInput | string
    isPreOrder?: BoolFieldUpdateOperationsInput | boolean
    preOrderDays?: NullableStringFieldUpdateOperationsInput | string | null
    isViolated?: BoolFieldUpdateOperationsInput | boolean
    violationReason?: NullableStringFieldUpdateOperationsInput | string | null
    reportsCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    costHistories?: CostPriceHistoryUncheckedUpdateManyWithoutProductNestedInput
  }

  export type ProductCreateWithoutCostHistoriesInput = {
    id?: string
    shopId: string
    name: string
    image?: string | null
    images?: string | null
    video?: string | null
    category: string
    brand: string
    description: string
    price: string
    originalPrice?: string | null
    costPrice?: number | null
    stock: number
    sales?: number
    status: string
    sku?: string | null
    variationsText?: string | null
    hasVariations?: boolean
    variationGroups?: string | null
    variationRows?: string | null
    weight?: string | null
    length?: string | null
    width?: string | null
    height?: string | null
    condition?: string
    isPreOrder?: boolean
    preOrderDays?: string | null
    isViolated?: boolean
    violationReason?: string | null
    reportsCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    categoryRef?: CategoryCreateNestedOneWithoutProductsInput
    priceHistories?: PriceHistoryCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateWithoutCostHistoriesInput = {
    id?: string
    shopId: string
    name: string
    image?: string | null
    images?: string | null
    video?: string | null
    category: string
    categoryId?: string | null
    brand: string
    description: string
    price: string
    originalPrice?: string | null
    costPrice?: number | null
    stock: number
    sales?: number
    status: string
    sku?: string | null
    variationsText?: string | null
    hasVariations?: boolean
    variationGroups?: string | null
    variationRows?: string | null
    weight?: string | null
    length?: string | null
    width?: string | null
    height?: string | null
    condition?: string
    isPreOrder?: boolean
    preOrderDays?: string | null
    isViolated?: boolean
    violationReason?: string | null
    reportsCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    priceHistories?: PriceHistoryUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutCostHistoriesInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutCostHistoriesInput, ProductUncheckedCreateWithoutCostHistoriesInput>
  }

  export type ProductUpsertWithoutCostHistoriesInput = {
    update: XOR<ProductUpdateWithoutCostHistoriesInput, ProductUncheckedUpdateWithoutCostHistoriesInput>
    create: XOR<ProductCreateWithoutCostHistoriesInput, ProductUncheckedCreateWithoutCostHistoriesInput>
    where?: ProductWhereInput
  }

  export type ProductUpdateToOneWithWhereWithoutCostHistoriesInput = {
    where?: ProductWhereInput
    data: XOR<ProductUpdateWithoutCostHistoriesInput, ProductUncheckedUpdateWithoutCostHistoriesInput>
  }

  export type ProductUpdateWithoutCostHistoriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    images?: NullableStringFieldUpdateOperationsInput | string | null
    video?: NullableStringFieldUpdateOperationsInput | string | null
    category?: StringFieldUpdateOperationsInput | string
    brand?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    price?: StringFieldUpdateOperationsInput | string
    originalPrice?: NullableStringFieldUpdateOperationsInput | string | null
    costPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    stock?: IntFieldUpdateOperationsInput | number
    sales?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    variationsText?: NullableStringFieldUpdateOperationsInput | string | null
    hasVariations?: BoolFieldUpdateOperationsInput | boolean
    variationGroups?: NullableStringFieldUpdateOperationsInput | string | null
    variationRows?: NullableStringFieldUpdateOperationsInput | string | null
    weight?: NullableStringFieldUpdateOperationsInput | string | null
    length?: NullableStringFieldUpdateOperationsInput | string | null
    width?: NullableStringFieldUpdateOperationsInput | string | null
    height?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: StringFieldUpdateOperationsInput | string
    isPreOrder?: BoolFieldUpdateOperationsInput | boolean
    preOrderDays?: NullableStringFieldUpdateOperationsInput | string | null
    isViolated?: BoolFieldUpdateOperationsInput | boolean
    violationReason?: NullableStringFieldUpdateOperationsInput | string | null
    reportsCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categoryRef?: CategoryUpdateOneWithoutProductsNestedInput
    priceHistories?: PriceHistoryUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateWithoutCostHistoriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    images?: NullableStringFieldUpdateOperationsInput | string | null
    video?: NullableStringFieldUpdateOperationsInput | string | null
    category?: StringFieldUpdateOperationsInput | string
    categoryId?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    price?: StringFieldUpdateOperationsInput | string
    originalPrice?: NullableStringFieldUpdateOperationsInput | string | null
    costPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    stock?: IntFieldUpdateOperationsInput | number
    sales?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    variationsText?: NullableStringFieldUpdateOperationsInput | string | null
    hasVariations?: BoolFieldUpdateOperationsInput | boolean
    variationGroups?: NullableStringFieldUpdateOperationsInput | string | null
    variationRows?: NullableStringFieldUpdateOperationsInput | string | null
    weight?: NullableStringFieldUpdateOperationsInput | string | null
    length?: NullableStringFieldUpdateOperationsInput | string | null
    width?: NullableStringFieldUpdateOperationsInput | string | null
    height?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: StringFieldUpdateOperationsInput | string
    isPreOrder?: BoolFieldUpdateOperationsInput | boolean
    preOrderDays?: NullableStringFieldUpdateOperationsInput | string | null
    isViolated?: BoolFieldUpdateOperationsInput | boolean
    violationReason?: NullableStringFieldUpdateOperationsInput | string | null
    reportsCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    priceHistories?: PriceHistoryUncheckedUpdateManyWithoutProductNestedInput
  }

  export type ProductCreateWithoutCategoryRefInput = {
    id?: string
    shopId: string
    name: string
    image?: string | null
    images?: string | null
    video?: string | null
    category: string
    brand: string
    description: string
    price: string
    originalPrice?: string | null
    costPrice?: number | null
    stock: number
    sales?: number
    status: string
    sku?: string | null
    variationsText?: string | null
    hasVariations?: boolean
    variationGroups?: string | null
    variationRows?: string | null
    weight?: string | null
    length?: string | null
    width?: string | null
    height?: string | null
    condition?: string
    isPreOrder?: boolean
    preOrderDays?: string | null
    isViolated?: boolean
    violationReason?: string | null
    reportsCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    priceHistories?: PriceHistoryCreateNestedManyWithoutProductInput
    costHistories?: CostPriceHistoryCreateNestedManyWithoutProductInput
  }

  export type ProductUncheckedCreateWithoutCategoryRefInput = {
    id?: string
    shopId: string
    name: string
    image?: string | null
    images?: string | null
    video?: string | null
    category: string
    brand: string
    description: string
    price: string
    originalPrice?: string | null
    costPrice?: number | null
    stock: number
    sales?: number
    status: string
    sku?: string | null
    variationsText?: string | null
    hasVariations?: boolean
    variationGroups?: string | null
    variationRows?: string | null
    weight?: string | null
    length?: string | null
    width?: string | null
    height?: string | null
    condition?: string
    isPreOrder?: boolean
    preOrderDays?: string | null
    isViolated?: boolean
    violationReason?: string | null
    reportsCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    priceHistories?: PriceHistoryUncheckedCreateNestedManyWithoutProductInput
    costHistories?: CostPriceHistoryUncheckedCreateNestedManyWithoutProductInput
  }

  export type ProductCreateOrConnectWithoutCategoryRefInput = {
    where: ProductWhereUniqueInput
    create: XOR<ProductCreateWithoutCategoryRefInput, ProductUncheckedCreateWithoutCategoryRefInput>
  }

  export type ProductCreateManyCategoryRefInputEnvelope = {
    data: ProductCreateManyCategoryRefInput | ProductCreateManyCategoryRefInput[]
    skipDuplicates?: boolean
  }

  export type ProductUpsertWithWhereUniqueWithoutCategoryRefInput = {
    where: ProductWhereUniqueInput
    update: XOR<ProductUpdateWithoutCategoryRefInput, ProductUncheckedUpdateWithoutCategoryRefInput>
    create: XOR<ProductCreateWithoutCategoryRefInput, ProductUncheckedCreateWithoutCategoryRefInput>
  }

  export type ProductUpdateWithWhereUniqueWithoutCategoryRefInput = {
    where: ProductWhereUniqueInput
    data: XOR<ProductUpdateWithoutCategoryRefInput, ProductUncheckedUpdateWithoutCategoryRefInput>
  }

  export type ProductUpdateManyWithWhereWithoutCategoryRefInput = {
    where: ProductScalarWhereInput
    data: XOR<ProductUpdateManyMutationInput, ProductUncheckedUpdateManyWithoutCategoryRefInput>
  }

  export type ProductScalarWhereInput = {
    AND?: ProductScalarWhereInput | ProductScalarWhereInput[]
    OR?: ProductScalarWhereInput[]
    NOT?: ProductScalarWhereInput | ProductScalarWhereInput[]
    id?: StringFilter<"Product"> | string
    shopId?: StringFilter<"Product"> | string
    name?: StringFilter<"Product"> | string
    image?: StringNullableFilter<"Product"> | string | null
    images?: StringNullableFilter<"Product"> | string | null
    video?: StringNullableFilter<"Product"> | string | null
    category?: StringFilter<"Product"> | string
    categoryId?: StringNullableFilter<"Product"> | string | null
    brand?: StringFilter<"Product"> | string
    description?: StringFilter<"Product"> | string
    price?: StringFilter<"Product"> | string
    originalPrice?: StringNullableFilter<"Product"> | string | null
    costPrice?: FloatNullableFilter<"Product"> | number | null
    stock?: IntFilter<"Product"> | number
    sales?: IntFilter<"Product"> | number
    status?: StringFilter<"Product"> | string
    sku?: StringNullableFilter<"Product"> | string | null
    variationsText?: StringNullableFilter<"Product"> | string | null
    hasVariations?: BoolFilter<"Product"> | boolean
    variationGroups?: StringNullableFilter<"Product"> | string | null
    variationRows?: StringNullableFilter<"Product"> | string | null
    weight?: StringNullableFilter<"Product"> | string | null
    length?: StringNullableFilter<"Product"> | string | null
    width?: StringNullableFilter<"Product"> | string | null
    height?: StringNullableFilter<"Product"> | string | null
    condition?: StringFilter<"Product"> | string
    isPreOrder?: BoolFilter<"Product"> | boolean
    preOrderDays?: StringNullableFilter<"Product"> | string | null
    isViolated?: BoolFilter<"Product"> | boolean
    violationReason?: StringNullableFilter<"Product"> | string | null
    reportsCount?: IntFilter<"Product"> | number
    createdAt?: DateTimeFilter<"Product"> | Date | string
    updatedAt?: DateTimeFilter<"Product"> | Date | string
  }

  export type PriceHistoryCreateManyProductInput = {
    id?: string
    shopId: string
    oldPrice: number
    newPrice: number
    changeType?: string
    changedBy: string
    changedByRole?: string
    reason?: string | null
    createdAt?: Date | string
  }

  export type CostPriceHistoryCreateManyProductInput = {
    id?: string
    shopId: string
    costPrice: number
    quantity: number
    invoiceCode?: string | null
    supplier?: string | null
    note?: string | null
    importedBy: string
    importDate?: Date | string
    createdAt?: Date | string
  }

  export type PriceHistoryUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    oldPrice?: FloatFieldUpdateOperationsInput | number
    newPrice?: FloatFieldUpdateOperationsInput | number
    changeType?: StringFieldUpdateOperationsInput | string
    changedBy?: StringFieldUpdateOperationsInput | string
    changedByRole?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PriceHistoryUncheckedUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    oldPrice?: FloatFieldUpdateOperationsInput | number
    newPrice?: FloatFieldUpdateOperationsInput | number
    changeType?: StringFieldUpdateOperationsInput | string
    changedBy?: StringFieldUpdateOperationsInput | string
    changedByRole?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PriceHistoryUncheckedUpdateManyWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    oldPrice?: FloatFieldUpdateOperationsInput | number
    newPrice?: FloatFieldUpdateOperationsInput | number
    changeType?: StringFieldUpdateOperationsInput | string
    changedBy?: StringFieldUpdateOperationsInput | string
    changedByRole?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CostPriceHistoryUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    costPrice?: FloatFieldUpdateOperationsInput | number
    quantity?: IntFieldUpdateOperationsInput | number
    invoiceCode?: NullableStringFieldUpdateOperationsInput | string | null
    supplier?: NullableStringFieldUpdateOperationsInput | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
    importedBy?: StringFieldUpdateOperationsInput | string
    importDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CostPriceHistoryUncheckedUpdateWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    costPrice?: FloatFieldUpdateOperationsInput | number
    quantity?: IntFieldUpdateOperationsInput | number
    invoiceCode?: NullableStringFieldUpdateOperationsInput | string | null
    supplier?: NullableStringFieldUpdateOperationsInput | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
    importedBy?: StringFieldUpdateOperationsInput | string
    importDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CostPriceHistoryUncheckedUpdateManyWithoutProductInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    costPrice?: FloatFieldUpdateOperationsInput | number
    quantity?: IntFieldUpdateOperationsInput | number
    invoiceCode?: NullableStringFieldUpdateOperationsInput | string | null
    supplier?: NullableStringFieldUpdateOperationsInput | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
    importedBy?: StringFieldUpdateOperationsInput | string
    importDate?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProductCreateManyCategoryRefInput = {
    id?: string
    shopId: string
    name: string
    image?: string | null
    images?: string | null
    video?: string | null
    category: string
    brand: string
    description: string
    price: string
    originalPrice?: string | null
    costPrice?: number | null
    stock: number
    sales?: number
    status: string
    sku?: string | null
    variationsText?: string | null
    hasVariations?: boolean
    variationGroups?: string | null
    variationRows?: string | null
    weight?: string | null
    length?: string | null
    width?: string | null
    height?: string | null
    condition?: string
    isPreOrder?: boolean
    preOrderDays?: string | null
    isViolated?: boolean
    violationReason?: string | null
    reportsCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProductUpdateWithoutCategoryRefInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    images?: NullableStringFieldUpdateOperationsInput | string | null
    video?: NullableStringFieldUpdateOperationsInput | string | null
    category?: StringFieldUpdateOperationsInput | string
    brand?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    price?: StringFieldUpdateOperationsInput | string
    originalPrice?: NullableStringFieldUpdateOperationsInput | string | null
    costPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    stock?: IntFieldUpdateOperationsInput | number
    sales?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    variationsText?: NullableStringFieldUpdateOperationsInput | string | null
    hasVariations?: BoolFieldUpdateOperationsInput | boolean
    variationGroups?: NullableStringFieldUpdateOperationsInput | string | null
    variationRows?: NullableStringFieldUpdateOperationsInput | string | null
    weight?: NullableStringFieldUpdateOperationsInput | string | null
    length?: NullableStringFieldUpdateOperationsInput | string | null
    width?: NullableStringFieldUpdateOperationsInput | string | null
    height?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: StringFieldUpdateOperationsInput | string
    isPreOrder?: BoolFieldUpdateOperationsInput | boolean
    preOrderDays?: NullableStringFieldUpdateOperationsInput | string | null
    isViolated?: BoolFieldUpdateOperationsInput | boolean
    violationReason?: NullableStringFieldUpdateOperationsInput | string | null
    reportsCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    priceHistories?: PriceHistoryUpdateManyWithoutProductNestedInput
    costHistories?: CostPriceHistoryUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateWithoutCategoryRefInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    images?: NullableStringFieldUpdateOperationsInput | string | null
    video?: NullableStringFieldUpdateOperationsInput | string | null
    category?: StringFieldUpdateOperationsInput | string
    brand?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    price?: StringFieldUpdateOperationsInput | string
    originalPrice?: NullableStringFieldUpdateOperationsInput | string | null
    costPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    stock?: IntFieldUpdateOperationsInput | number
    sales?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    variationsText?: NullableStringFieldUpdateOperationsInput | string | null
    hasVariations?: BoolFieldUpdateOperationsInput | boolean
    variationGroups?: NullableStringFieldUpdateOperationsInput | string | null
    variationRows?: NullableStringFieldUpdateOperationsInput | string | null
    weight?: NullableStringFieldUpdateOperationsInput | string | null
    length?: NullableStringFieldUpdateOperationsInput | string | null
    width?: NullableStringFieldUpdateOperationsInput | string | null
    height?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: StringFieldUpdateOperationsInput | string
    isPreOrder?: BoolFieldUpdateOperationsInput | boolean
    preOrderDays?: NullableStringFieldUpdateOperationsInput | string | null
    isViolated?: BoolFieldUpdateOperationsInput | boolean
    violationReason?: NullableStringFieldUpdateOperationsInput | string | null
    reportsCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    priceHistories?: PriceHistoryUncheckedUpdateManyWithoutProductNestedInput
    costHistories?: CostPriceHistoryUncheckedUpdateManyWithoutProductNestedInput
  }

  export type ProductUncheckedUpdateManyWithoutCategoryRefInput = {
    id?: StringFieldUpdateOperationsInput | string
    shopId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    images?: NullableStringFieldUpdateOperationsInput | string | null
    video?: NullableStringFieldUpdateOperationsInput | string | null
    category?: StringFieldUpdateOperationsInput | string
    brand?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    price?: StringFieldUpdateOperationsInput | string
    originalPrice?: NullableStringFieldUpdateOperationsInput | string | null
    costPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    stock?: IntFieldUpdateOperationsInput | number
    sales?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    variationsText?: NullableStringFieldUpdateOperationsInput | string | null
    hasVariations?: BoolFieldUpdateOperationsInput | boolean
    variationGroups?: NullableStringFieldUpdateOperationsInput | string | null
    variationRows?: NullableStringFieldUpdateOperationsInput | string | null
    weight?: NullableStringFieldUpdateOperationsInput | string | null
    length?: NullableStringFieldUpdateOperationsInput | string | null
    width?: NullableStringFieldUpdateOperationsInput | string | null
    height?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: StringFieldUpdateOperationsInput | string
    isPreOrder?: BoolFieldUpdateOperationsInput | boolean
    preOrderDays?: NullableStringFieldUpdateOperationsInput | string | null
    isViolated?: BoolFieldUpdateOperationsInput | boolean
    violationReason?: NullableStringFieldUpdateOperationsInput | string | null
    reportsCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}