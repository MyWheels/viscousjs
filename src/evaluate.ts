import { ExprNode } from "./expression";

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
};

export type EvalConfig = {
  helpers?: Record<string, Function>;
  isTruthy?: (data: any) => boolean;
  throwOnError?: boolean;
};

export function evaluate(
  expr: ExprNode,
  env: any = {},
  { isTruthy = builtinTruthy, helpers, throwOnError = false }: EvalConfig = {}
): any {
  helpers = {
    ...builtinHelpers,
    ...helpers,
  };

  try {
    switch (expr[0]) {
      case "num":
      case "str":
      case "bool": {
        return expr[1];
      }
      case "id": {
        return env[expr[1]];
      }
      case "member": {
        const obj = evaluate(expr[1], env);
        if (obj && typeof obj === "object") {
          const key = expr[2];
          return obj[key];
        } else {
          if (throwOnError) throw new Error("member expression invalid");
          return;
        }
      }
      case "==": {
        // eslint-disable-next-line eqeqeq
        return evaluate(expr[1], env) == evaluate(expr[2], env);
      }
      case "!=": {
        // eslint-disable-next-line eqeqeq
        return evaluate(expr[1], env) != evaluate(expr[2], env);
      }
      case ">": {
        return evaluate(expr[1], env) > evaluate(expr[2], env);
      }
      case ">=": {
        return evaluate(expr[1], env) >= evaluate(expr[2], env);
      }
      case "<": {
        return evaluate(expr[1], env) < evaluate(expr[2], env);
      }
      case "<=": {
        return evaluate(expr[1], env) <= evaluate(expr[2], env);
      }
      case "or": {
        const le = evaluate(expr[1], env);
        const ri = evaluate(expr[2], env);
        return isTruthy(le) ? le : ri;
      }
      case "and": {
        const le = evaluate(expr[1], env);
        const ri = evaluate(expr[2], env);
        return !isTruthy(le) ? le : ri;
      }
      case "+": {
        return evaluate(expr[1], env) + evaluate(expr[2], env);
      }
      case "-": {
        if (expr[2]) {
          return evaluate(expr[1], env) - evaluate(expr[2], env);
        } else {
          return 0 - evaluate(expr[1], env);
        }
      }
      case "*": {
        return evaluate(expr[1], env) * evaluate(expr[2], env);
      }
      case "/": {
        return evaluate(expr[1], env) / evaluate(expr[2], env);
      }
      case "^": {
        return evaluate(expr[1], env) ^ evaluate(expr[2], env);
      }
      case "not": {
        const val = evaluate(expr[1], env);
        return isTruthy(val) ? false : val;
      }
      case "contains": {
        const le = evaluate(expr[1], env);
        const ri = evaluate(expr[2], env);
        return le.indexOf(ri) >= 0;
      }
      case "helper": {
        if (!helpers[expr[1] as string]) {
          if (throwOnError) throw new Error("Unknown expr node type");
          return;
        }
        return helpers[expr[1]](
          ...expr[2].map((node) => {
            return evaluate(node, env);
          })
        );
      }
      default: {
        if (throwOnError) throw new Error("Unknown expr node type");
        return;
      }
    }
  } catch (error) {
    if (throwOnError) throw error;
    return;
  }
}
