import P from "parsimmon";

import { ExprNode, Expr } from "./expression";
import { Id } from "./shared";

type Meta = {
  stripLeft: boolean;
  stripRight: boolean;
};

export type IfTmplNode = P.Node<"if", Meta & { content: ExprNode }>;
export type UnlessTmplNode = P.Node<"unless", Meta & { content: ExprNode }>;
export type ElseIfTmplNode = P.Node<"elseif", Meta & { content: ExprNode }>;
export type ElseTmplNode = P.Node<"else", Meta>;
export type ForTmplNode = P.Node<
  "for",
  Meta & { content: { id: string; collection: ExprNode } }
>;
export type EndTmplNode = P.Node<"end", Meta>;
export type InterpolationTmplNode = P.Node<
  "interpolation",
  Meta & { content: ExprNode }
>;
export type RawTmplNode = P.Node<"raw", { content: string }>;

export type TmplNode =
  | IfTmplNode
  | UnlessTmplNode
  | ElseIfTmplNode
  | ElseTmplNode
  | ForTmplNode
  | EndTmplNode
  | InterpolationTmplNode
  | RawTmplNode;

const _ = P.regexp(/[ \n\t]*/);
const __ = P.regexp(/[ \n\t]+/);
const InterpOpen = P.regexp(/\{\{-?/).map((str) => str.length === 3);
const InterpClose = P.regexp(/-?\}\}/).map((str) => str.length === 3);
const BlockOpen = P.regexp(/\{%-?/).map((str) => str.length === 3);
const BlockClose = P.regexp(/-?%\}/).map((str) => str.length === 3);

function andThenParseAsExpression(str: string) {
  return P((_input, i) => {
    try {
      const res = Expr.tryParse(str);
      return P.makeSuccess(i, res);
    } catch (error) {
      return P.makeFailure(i, "failed parsing inner expression");
    }
  });
}

const Interpolation: P.Parser<InterpolationTmplNode> = P.seqObj<{
  stripLeft: boolean;
  content: ExprNode;
  stripRight: boolean;
}>(
  ["stripLeft", InterpOpen],
  _,
  [
    "content",
    P((input, i) => {
      let j = i;
      while (j < input.length && !input.slice(j).match(/^[ \n\t]*-?\}\}/)) {
        j++;
      }
      if (j >= input.length) {
        return P.makeFailure(j, "%}");
      } else {
        return P.makeSuccess(j, input.slice(i, j));
      }
    }).chain(andThenParseAsExpression),
  ],
  _,
  ["stripRight", InterpClose]
).node("interpolation");

/**
 * Reads a block of the shape {%-? (content) -?%}
 */
function makeBlock<Name extends string, Content>(
  name: Name,
  parse: P.Parser<Content>
): P.Parser<P.Node<Name, Meta & { content: Content }>> {
  return P.seqObj<{
    stripLeft: boolean;
    content: Content;
    stripRight: boolean;
  }>(["stripLeft", BlockOpen], _, ["content", parse], _, [
    "stripRight",
    BlockClose,
  ]).node(name);
}

/**
 * Reads the rest of a block's content, assuming
 *  it's an expression to be parsed later
 */
const UnaryBlockExpr: P.Parser<ExprNode> = P((input, i) => {
  let j = i;
  while (j < input.length && !input.slice(j).match(/^[ \n\t]*-?%\}/)) {
    j++;
  }
  if (j >= input.length) {
    return P.makeFailure(j, "%}");
  } else {
    return P.makeSuccess(j, input.slice(i, j));
  }
}).chain(andThenParseAsExpression);

const IfOpen: P.Parser<IfTmplNode> = makeBlock(
  "if",
  P.string("if").then(__).then(UnaryBlockExpr)
);
const UnlessOpen: P.Parser<UnlessTmplNode> = makeBlock(
  "unless",
  P.string("unless").then(__).then(UnaryBlockExpr)
);
const Else: P.Parser<ElseTmplNode> = makeBlock(
  "else",
  P.string("else").result(null)
);
const ElseIf: P.Parser<ElseIfTmplNode> = makeBlock(
  "elseif",
  P.regexp(/el(s(e ?)?)?if/)
    .then(__)
    .then(UnaryBlockExpr)
);
const For: P.Parser<ForTmplNode> = makeBlock(
  "for",
  P.seqObj<{
    id: string;
    collection: ExprNode;
  }>(
    P.string("for"),
    __,
    ["id", Id],
    __,
    P.alt(P.string("in"), P.string("of")),
    __,
    ["collection", UnaryBlockExpr]
  )
);
const End: P.Parser<EndTmplNode> = makeBlock(
  "end",
  P.alt(P.regex(/end(if|unless)?/)).result(null)
);

const Raw: P.Parser<RawTmplNode> = P((input, i) => {
  let j = i;
  while (
    j < input.length &&
    !(input[j] === "{" && (input[j + 1] === "%" || input[j + 1] === "{"))
  ) {
    j++;
  }
  if (j > i) {
    return P.makeSuccess(j, {
      content: input.slice(i, j),
    });
  } else {
    return P.makeFailure(j, "raw content");
  }
}).node("raw");

export const Tmpl = P.alt<TmplNode>(
  IfOpen,
  UnlessOpen,
  Else,
  ElseIf,
  End,
  For,
  Interpolation,
  Raw
).many();
