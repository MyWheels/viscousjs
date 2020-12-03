import { ExprNode } from "./expression";
import { TmplNode } from "./template";
import { evaluate, builtinTruthy, EvalConfig } from "./evaluate";

export type RenderConfig = {
  helpers?: Record<string, Function>;
  isTruthy?: (data: any) => boolean;
  throwOnError?: boolean;
  verbose?: boolean;
  evaluate?: (expr: ExprNode, env?: any, config?: EvalConfig) => any;
};

export function render(
  nodes: TmplNode[],
  env: any = {},
  config: RenderConfig = {}
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
