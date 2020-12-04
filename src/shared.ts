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

export type TmplNodeBase = {
  id: number;
  children: TmplNode[];
};

export type RootNode = TmplNodeBase & {
  type: "root";
};
export type InterpolationNode = TmplNodeBase & {
  type: "interpolation";
  expression: ExprNode;
};
export type CondNode = TmplNodeBase & {
  type: "cond"; // used for `if`, `unless`, and `elseif`
  condition: ExprNode;
  else?: TmplNode;
};
export type ElseNode = TmplNodeBase & {
  type: "else";
};
export type ForNode = TmplNodeBase & {
  type: "for";
  item: string;
  collection: ExprNode;
};
export type RawNode = TmplNodeBase & {
  type: "raw";
  content: string;
};

export type TmplNode =
  | RootNode
  | InterpolationNode
  | CondNode
  | ElseNode
  | ForNode
  | RawNode;
