import {
  ExprNode,
  ViscousConfig,
  builtinTruthy,
  builtinHelpers,
} from "./shared";

export function evaluate(
  expr: ExprNode,
  env: any = {},
  {
    isTruthy = builtinTruthy,
    helpers,
    throwOnError = false,
  }: ViscousConfig = {}
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
          if (throwOnError) {
            throw new Error(
              `member expression invalid in ${JSON.stringify(expr)}`
            );
          }
          return;
        }
      }
      case "===": {
        const le = evaluate(expr[1], env);
        const ri = evaluate(expr[2], env);
        return le === ri;
      }
      case "==": {
        const le = evaluate(expr[1], env);
        const ri = evaluate(expr[2], env);
        // eslint-disable-next-line eqeqeq
        return le == ri;
      }
      case "!==": {
        const le = evaluate(expr[1], env);
        const ri = evaluate(expr[2], env);
        return le !== ri;
      }
      case "!=": {
        const le = evaluate(expr[1], env);
        const ri = evaluate(expr[2], env);
        // eslint-disable-next-line eqeqeq
        return le != ri;
      }
      case ">": {
        const le = evaluate(expr[1], env);
        const ri = evaluate(expr[2], env);
        if (!isTruthy(le) || !isTruthy(ri)) {
          return null;
        }
        return le > ri;
      }
      case ">=": {
        const le = evaluate(expr[1], env);
        const ri = evaluate(expr[2], env);
        if (!isTruthy(le) || !isTruthy(ri)) {
          return null;
        }
        return le >= ri;
      }
      case "<": {
        const le = evaluate(expr[1], env);
        const ri = evaluate(expr[2], env);
        if (!isTruthy(le) || !isTruthy(ri)) {
          return null;
        }
        return le < ri;
      }
      case "<=": {
        const le = evaluate(expr[1], env);
        const ri = evaluate(expr[2], env);
        if (!isTruthy(le) || !isTruthy(ri)) {
          return null;
        }
        return le <= ri;
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
