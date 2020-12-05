import { evaluate } from "./evaluate";
import {
  ExprNode,
  ViscousConfig,
  TmplNode,
  builtinTruthy,
  builtinHelpers,
} from "./shared";

export function render(
  node: TmplNode,
  env: any = {},
  config: ViscousConfig = {}
): string {
  return _render(node, env, config).output;
}

export function _render(
  node: TmplNode,
  env: any,
  config: ViscousConfig
): {
  env: any;
  output: string;
} {
  function ev(expr: ExprNode) {
    return (config.evaluate || evaluate)(expr, env, config);
  }
  function tru(expr: ExprNode) {
    return (config.isTruthy || builtinTruthy)(expr);
  }
  function getHelper(name: string) {
    const helper = config.helpers?.[name] || builtinHelpers[name];
    if (!helper) {
      throw new Error(`Unknown helper: ${name}`);
    }
    return helper;
  }

  function r(children: TmplNode[], initialEnv = env) {
    return children.reduce(
      (prev, child) => {
        const { env, output } = _render(child, prev.env, config);
        return { env, output: prev.output + output };
      },
      { env: initialEnv, output: "" }
    );
  }

  if (node.type === "root" || node.type === "else") {
    return {
      env,
      output: r(node.children).output,
    };
  } else if (node.type === "raw") {
    return {
      env,
      output: node.content,
    };
  } else if (node.type === "interpolation") {
    let value = ev(node.expression);
    for (const { filter, args } of node.filters) {
      const helper = getHelper(filter);
      value = helper(value, ...args.map(ev));
    }
    return {
      env,
      output:
        typeof value === "number" && isNaN(value)
          ? ""
          : tru(value) || typeof value === "boolean"
          ? "" + value
          : "",
    };
  } else if (node.type === "assign") {
    return {
      env: { ...env, [node.item]: ev(node.expression) },
      output: "",
    };
  } else if (node.type === "cond") {
    return tru(ev(node.condition))
      ? { env, output: r(node.children).output }
      : node.else
      ? { env, output: _render(node.else, env, config).output }
      : { env, output: "" };
  } else if (node.type === "for") {
    const arr = ev(node.collection);
    if (!Array.isArray(arr)) {
      if (config?.throwOnError) {
        throw new Error("render error: collection is not an array");
      } else {
        return { env, output: "" };
      }
    }
    return {
      env,
      output: arr
        .map((item: any) => {
          return r(node.children, { ...env, [node.item]: item }).output;
        })
        .join(""),
    };
  } else {
    throw new Error("unknown ast type");
  }
}
