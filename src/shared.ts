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

export type Filter = {
  filter: string;
  args: ExprNode[];
};

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
  filters: Filter[];
};
export type AssignNode = TmplNodeBase & {
  type: "assign";
  item: string;
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
  | AssignNode
  | CondNode
  | ElseNode
  | ForNode
  | RawNode;

export function builtinTruthy(data: any) {
  return (
    data === true ||
    typeof data === "string" ||
    data === 0 ||
    typeof data === "number" ||
    !!data
  );
}

export const builtinHelpers: Record<string, Function> = {
  if(cond: any, a: any, b: any) {
    return builtinTruthy(cond) ? a : b;
  },
  cond(cond: any, a: any, b: any) {
    return builtinTruthy(cond) ? a : b;
  },
  abs(num: any) {
    return Math.abs(num);
  },
  append(a: any, b: any) {
    return a + b;
  },
  at_least(num: any, min: any) {
    return Math.max(num, min);
  },
  at_most(num: any, max: any) {
    return Math.min(num, max);
  },
  clamp(num: any, min: any, max: any) {
    return Math.max(Math.min(num, max), min);
  },
  upcase(str: any) {
    return (str + "").toLocaleUpperCase();
  },
  upper(str: any) {
    return (str + "").toLocaleUpperCase();
  },
  downcase(str: any) {
    return (str + "").toLocaleLowerCase();
  },
  lower(str: any) {
    return (str + "").toLocaleLowerCase();
  },
  ceil(num: any) {
    return Math.ceil(num);
  },
  floor(num: any) {
    return Math.floor(num);
  },
  default(val: any, fallback: any) {
    if (
      !builtinTruthy(val) ||
      val === "" ||
      (Array.isArray(val) && val.length === 0)
    ) {
      return fallback;
    } else {
      return val;
    }
  },
  stringify(data: any) {
    return JSON.stringify(data);
  },
};
