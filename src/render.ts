import { evaluate, builtinTruthy } from "./evaluate";
import { ExprNode, ViscousConfig, TmplNode } from "./shared";

export function render(
  node: TmplNode,
  env: any = {},
  config: ViscousConfig = {}
): string {
  function ev(expr: ExprNode) {
    return (config.evaluate || evaluate)(expr, env, config);
  }
  function tru(expr: ExprNode) {
    return (config.isTruthy || builtinTruthy)(expr);
  }

  function r(child: TmplNode): string {
    return render(child, env, config);
  }

  if (node.type === "root" || node.type === "else") {
    return node.children.map(r).join("");
  } else if (node.type === "raw") {
    return node.content;
  } else if (node.type === "interpolation") {
    return "" + ev(node.expression);
  } else if (node.type === "cond") {
    return tru(ev(node.condition))
      ? node.children.map(r).join("")
      : node.else
      ? r(node.else)
      : "";
  } else if (node.type === "for") {
    const arr = ev(node.collection);
    if (!Array.isArray(arr)) {
      if (config?.throwOnError) {
        throw new Error("render error: collection is not an array");
      } else {
        return "";
      }
    }
    return arr
      .map((item: any) => {
        return node.children
          .map((child) => {
            return render(child, { ...env, [node.item]: item }, config);
          })
          .join("");
      })
      .join("");
  } else {
    throw new Error("unknown ast type");
  }
}
