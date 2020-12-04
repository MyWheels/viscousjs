import P from "parsimmon";

import { ExprNode, Expr } from "./expression";
import { Id } from "./shared";

type Meta = {
  stripLeft: boolean;
  stripRight: boolean;
};

export type IfTmplPiece = P.Node<"if", Meta & { content: ExprNode }>;
export type UnlessTmplPiece = P.Node<"unless", Meta & { content: ExprNode }>;
export type ElseIfTmplPiece = P.Node<"elseif", Meta & { content: ExprNode }>;
export type ElseTmplPiece = P.Node<"else", Meta>;
export type ForTmplPiece = P.Node<
  "for",
  Meta & { content: { id: string; collection: ExprNode } }
>;
export type EndTmplPiece = P.Node<"end", Meta>;
export type InterpolationTmplPiece = P.Node<
  "interpolation",
  Meta & { content: ExprNode }
>;
export type RawTmplPiece = P.Node<"raw", { content: string }>;

export type TmplPiece =
  | IfTmplPiece
  | UnlessTmplPiece
  | ElseIfTmplPiece
  | ElseTmplPiece
  | ForTmplPiece
  | EndTmplPiece
  | InterpolationTmplPiece
  | RawTmplPiece;

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

const Interpolation: P.Parser<InterpolationTmplPiece> = P.seqObj<{
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

const IfOpen: P.Parser<IfTmplPiece> = makeBlock(
  "if",
  P.string("if").then(__).then(UnaryBlockExpr)
);
const UnlessOpen: P.Parser<UnlessTmplPiece> = makeBlock(
  "unless",
  P.string("unless").then(__).then(UnaryBlockExpr)
);
const Else: P.Parser<ElseTmplPiece> = makeBlock(
  "else",
  P.string("else").result(null)
);
const ElseIf: P.Parser<ElseIfTmplPiece> = makeBlock(
  "elseif",
  P.regexp(/el(s(e ?)?)?if/)
    .then(__)
    .then(UnaryBlockExpr)
);
const For: P.Parser<ForTmplPiece> = makeBlock(
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
const End: P.Parser<EndTmplPiece> = makeBlock(
  "end",
  P.alt(P.regex(/end(if|unless)?/)).result(null)
);

const Raw: P.Parser<RawTmplPiece> = P((input, i) => {
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

export const Tmpl = P.alt<TmplPiece>(
  IfOpen,
  UnlessOpen,
  Else,
  ElseIf,
  End,
  For,
  Interpolation,
  Raw
).many();

export interface TmplNodeBase {
  parent: TmplNodeBase;
  type:
    | "root"
    | "if"
    | "else"
    | "elseif"
    | "interpolation"
    | "raw"
    | "for"
    | "unless";
  children: TmplNodeBase[];
  piece?: TmplPiece;
}

export function intoAST(pieces: TmplPiece[]) {
  const root: TmplNodeBase = {
    type: "root",
    children: [],
    get parent() {
      return root;
    },
  };

  let parent = root;

  for (const piece of pieces) {
    if (piece.name === "raw") {
      parent.children.push({ parent, type: "raw", children: [], piece });
    } else if (piece.name === "interpolation") {
      parent.children.push({
        parent,
        type: "interpolation",
        children: [],
        piece,
      });
    } else if (piece.name === "if") {
      const node: TmplNodeBase = { parent, type: "if", children: [], piece };
      parent.children.push(node);
      parent = node;
    } else if (piece.name === "unless") {
      const node: TmplNodeBase = {
        parent,
        type: "unless",
        children: [],
        piece,
      };
      parent.children.push(node);
      parent = node;
    } else if (piece.name === "for") {
      const node: TmplNodeBase = { parent, type: "for", children: [], piece };
      parent.children.push(node);
      parent = node;
    } else if (piece.name === "else") {
      if (!["unless", "if", "elseif"].includes(parent.type)) {
        throw new Error("misplaced {% else %}");
      }
      const node: TmplNodeBase = {
        parent: parent.parent,
        type: "else",
        children: [],
        piece: parent.piece, // (!)
      };
      parent.parent.children.push(node);
      parent = node;
    } else if (piece.name === "elseif") {
      if (!["if", "elseif"].includes(parent.type)) {
        throw new Error("misplaced {% else if %}");
      }
      const node: TmplNodeBase = {
        parent: parent.parent,
        type: "elseif",
        children: [],
        piece,
      };
      parent.parent.children.push(node);
      parent = parent.parent;
    } else if (piece.name === "end") {
      parent = parent.parent;
    }
  }

  if (parent !== root) {
    throw new Error("ended up nested");
  }

  return root;
}
