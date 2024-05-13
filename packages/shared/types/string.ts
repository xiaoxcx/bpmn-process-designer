export type CamelCase<S extends string> = S extends `${infer First}-${infer Rest}`
  ? `${First}${Capitalize<CamelCase<Rest>>}`
  : S
