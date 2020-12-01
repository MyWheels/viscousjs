import { Expr } from "./expression";
import { Tmpl } from "./template";
import { evaluate, EvalConfig } from "./evaluate";
import { render, RenderConfig } from "./render";

export * from "./expression";
export * from "./template";
export * from "./evaluate";
export * from "./render";

/**
 * Parses the template string, and then renders it
 *  with the given environment data, and optional
 *  configuration.
 * Returns an empty string on failure, or throws an
 *  error if configured such.
 */
export function parseAndRender(
  tmpl: string,
  env?: any,
  config?: RenderConfig
): string {
  try {
    return render(Tmpl.tryParse(tmpl), env, config);
  } catch (error) {
    if (config?.throwOnError) throw error;
    return "";
  }
}

/**
 * Parses the expression string, and then renders it
 *  with the given environment data, and optional
 *  configuration.
 * Returns undefined on failure, or throws an
 *  error if configured such.
 */
export function parseAndEvaluate(expr: string, env?: any, config?: EvalConfig) {
  try {
    return evaluate(Expr.tryParse(expr), env, config);
  } catch (error) {
    if (config?.throwOnError) throw error;
    return;
  }
}
