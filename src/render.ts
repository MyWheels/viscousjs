import {
  TmplPiece,
  TmplNodeBase,
  RawTmplPiece,
  InterpolationTmplPiece,
  IfTmplPiece,
  ForTmplPiece,
} from "./template";
import { evaluate, builtinTruthy } from "./evaluate";
import { ExprNode, ViscousConfig } from "./shared";

export function renderAst(
  node: TmplNodeBase,
  env: any = {},
  config: ViscousConfig = {}
): string {
  function ev(expr: ExprNode) {
    return (config.evaluate || evaluate)(expr, env, config);
  }
  function tru(expr: ExprNode) {
    return (config.isTruthy || builtinTruthy)(expr);
  }

  function r(child: TmplNodeBase): string {
    return renderAst(child, env, config);
  }

  if (node.type === "root") {
    return node.children.map(r).join("");
  } else if (node.type === "raw") {
    return (node.piece as RawTmplPiece).value.content;
  } else if (node.type === "interpolation") {
    return "" + ev((node.piece as InterpolationTmplPiece).value.content);
  } else if (node.type === "if" || node.type === "elseif") {
    const condition = ev((node.piece as IfTmplPiece).value.content);
    return tru(condition) ? node.children.map(r).join("") : "";
  } else if (node.type === "unless" || node.type === "else") {
    const condition = ev((node.piece as IfTmplPiece).value.content);
    return !tru(condition) ? node.children.map(r).join("") : "";
  } else if (node.type === "for") {
    const { id, collection } = (node.piece as ForTmplPiece).value.content;
    const arr = ev(collection);
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
            return renderAst(child, { ...env, [id]: item }, config);
          })
          .join("");
      })
      .join("");
  } else {
    throw new Error("unknown ast type");
  }
}

export function render(
  nodes: TmplPiece[],
  env: any = {},
  config: ViscousConfig = {}
) {
  function ev(expr: ExprNode) {
    return (config.evaluate || evaluate)(expr, env, config);
  }
  function tru(expr: ExprNode) {
    return (config.isTruthy || builtinTruthy)(expr);
  }

  let stack: Array<
    [
      "root" | "if" | "unless" | "else" | "elseif" | "for",
      boolean[] // reverse
    ]
  > = [["root", []]]; // reverse

  const curr = () => stack[0][0];
  const conditions = () => stack[0][1];
  const shouldOutput = () => conditions().every(Boolean);

  let output: Array<{
    type: "raw" | "evaluated";
    i: number;
    content: string;
  }> = [];

  let stripNext = false;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    config?.verbose && console.log("encounter node", shouldOutput(), node);

    if (node.name === "raw") {
      if (shouldOutput()) {
        output.push({
          type: "raw",
          i,
          content: node.value.content,
        });
        if (stripNext) {
          const last = output[output.length - 1];
          last.content = last.content.replace(/^[\s\n]*/, "");
        }
      }
      continue;
    }

    // Clear stripping flag, which only holds
    //  from one block to the next
    stripNext = false;

    if (node.value.stripLeft && output.length > 0) {
      const last = output[output.length - 1];
      if (last.i + 1 === i) {
        // Only strip direct predecessor raw block
        last.content = last.content.replace(/[\s\n]*$/, "");
      }
    }
    if (node.value.stripRight) {
      stripNext = true;
    }

    if (node.name === "interpolation") {
      if (shouldOutput()) {
        output.push({
          type: "evaluated",
          i: NaN,
          content: ev(node.value.content),
        });
      }
      continue;
    }

    if (node.name === "if") {
      const val = ev(node.value.content);
      stack.unshift(["if", [tru(val), ...conditions()]]);
    } else if (node.name === "unless") {
      const val = ev(node.value.content);
      stack.unshift(["unless", [!tru(val), ...conditions()]]);
    } else if (node.name === "else") {
      if (["if", "elseif", "unless"].indexOf(curr()) >= 0) {
        const [last, ...previous] = conditions();
        stack.unshift(["else", [!last, ...previous]]);
      } else {
        throw new Error("misplaced {% else %} block");
      }
    } else if (node.name === "elseif") {
      if (["if", "elseif"].indexOf(curr()) >= 0) {
        const val = ev(node.value.content);
        stack.unshift(["elseif", [tru(val), ...conditions().slice(1)]]);
      } else {
        throw new Error("misplaced {% elseif %} block");
      }
    } else if (node.name === "end") {
      if (curr() === "for") {
        stack.shift();
        // and now loop!
      } else if (["unless", "if", "elseif", "else"].indexOf(curr()) >= 0) {
        while (["elseif", "else"].indexOf(curr()) >= 0) {
          stack.shift();
        }
        if (["unless", "if"].indexOf(curr()) >= 0) {
          stack.shift();
        } else {
          throw new Error("misplaced {% end %} block");
        }
      } else {
        throw new Error("misplaced {% end %} block");
      }
    }

    config?.verbose && console.log("stack is now", stack);
  }

  if (stack.length !== 1) {
    throw new Error("block stack not empty at end");
  }

  return output.map((p) => p.content).join("");
}
