import P from "parsimmon";

export const Id = P.regexp(/[_a-zA-Z]+/);

export type Op =
  | "-"
  | "not"
  | "^"
  | "*"
  | "/"
  | "=="
  | "==="
  | "!="
  | "!=="
  | "<="
  | "<"
  | ">="
  | ">"
  | "contains"
  | "+"
  | "and"
  | "or";

export type ExprNode =
  | ["bool", boolean]
  | ["num", number]
  | ["str", string]
  | ["id", string]
  | ["member", ExprNode, string]
  | ["helper", string, ExprNode[]]
  | [Op, ...ExprNode[]];

export type ViscousConfig = {
  helpers?: Record<string, Function>;
  isTruthy?: (data: any) => boolean;
  throwOnError?: boolean;
  verbose?: boolean;
  evaluate?: (expr: ExprNode, env?: any, config?: ViscousConfig) => any;
};
