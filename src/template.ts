import P from "parsimmon";

import { Expr } from "./expression";
import { ExprNode, Id, TmplNode, RootNode, Filter } from "./shared";

type Meta = {
  stripLeft: boolean;
  stripRight: boolean;
};

const _ = P.regexp(/[ \n\t]*/);
const __ = P.regexp(/[ \n\t]+/);
const InterpOpen = P.regexp(/\{\{-?/).map((str) => str.length === 3);
const InterpClose = P.regexp(/-?\}\}/).map((str) => str.length === 3);
const BlockOpen = P.regexp(/\{%-?/).map((str) => str.length === 3);
const BlockClose = P.regexp(/-?%\}/).map((str) => str.length === 3);

// Reads a block of the shape {%-? (content) -?%}
function inControlBlock<T extends object>(
  parseContent: P.Parser<T>
): P.Parser<T & Meta> {
  return P.seq(BlockOpen, _, parseContent, _, BlockClose).map(
    ([stripLeft, , content, , stripRight]) => {
      return { ...content, stripLeft, stripRight };
    }
  );
}
// Reads a block of the shape {%-? (content) -?%}
function inInterpolationBlock<T extends object>(
  parseContent: P.Parser<T>
): P.Parser<T & Meta> {
  return P.seq(InterpOpen, _, parseContent, _, InterpClose).map(
    ([stripLeft, , content, , stripRight]) => {
      return { ...content, stripLeft, stripRight };
    }
  );
}

const Pipe: P.Parser<Filter> = P.string("|")
  .then(_)
  .then(
    P.alt<{
      filter: string;
      args: ExprNode[];
    }>(
      P.seq(Id, P.string(":"), _, Expr.sepBy1(P.regexp(/,\s*/))).map(
        ([filter, , , args]) => {
          return { filter, args };
        }
      ),
      Id.map((filter) => {
        return { filter, args: [] };
      })
    )
  );

type InterpolationBlock = Meta & {
  type: "interpolation";
  expression: ExprNode;
  filters: Filter[];
};

const Interpolation: P.Parser<InterpolationBlock> = P.seq(
  Expr.skip(_),
  Pipe.skip(_).many()
)
  .map(([expression, filters]) => {
    return { type: "interpolation" as "interpolation", expression, filters };
  })
  .thru(inInterpolationBlock);

type IfBlock = Meta & {
  type: "if";
  condition: ExprNode;
};

const If: P.Parser<IfBlock> = P.string("if")
  .then(__)
  .then(Expr)
  .map((condition) => {
    return { type: "if" as "if", condition };
  })
  .thru(inControlBlock);

type UnlessBlock = Meta & {
  type: "unless";
  condition: ExprNode;
};

const Unless: P.Parser<UnlessBlock> = P.string("unless")
  .then(__)
  .then(Expr)
  .map((condition) => {
    return { type: "unless" as "unless", condition };
  })
  .thru(inControlBlock);

type ElseBlock = Meta & {
  type: "else";
};

const Else: P.Parser<ElseBlock> = P.string("else")
  .map(() => {
    return { type: "else" as "else" };
  })
  .thru(inControlBlock);

type ElseIfBlock = Meta & {
  type: "elseif";
  condition: ExprNode;
};

const ElseIf: P.Parser<ElseIfBlock> = P.regexp(/el(s(e ?)?)?if/)
  .then(__)
  .then(Expr)
  .map((condition) => {
    return { type: "elseif" as "elseif", condition };
  })
  .thru(inControlBlock);

type ForBlock = Meta & {
  type: "for";
  item: string;
  collection: ExprNode;
};

const For: P.Parser<ForBlock> = P.seqObj<{
  item: string;
  collection: ExprNode;
}>(
  P.string("for"),
  __,
  ["item", Id],
  __,
  P.alt(P.string("in"), P.string("of")),
  __,
  ["collection", Expr]
)
  .map((info) => {
    return { type: "for" as "for", ...info };
  })
  .thru(inControlBlock);

type EndBlock = Meta & {
  type: "end";
};

const End: P.Parser<EndBlock> = P.alt(P.regex(/end(if|unless|for)?/))
  .map(() => {
    return { type: "end" as "end" };
  })
  .thru(inControlBlock);

type RawBlock = Meta & {
  type: "raw";
  content: string;
};

const Raw: P.Parser<RawBlock> = P((input, i) => {
  let j = i;
  while (
    j < input.length &&
    !(input[j] === "{" && (input[j + 1] === "%" || input[j + 1] === "{"))
  ) {
    j++;
  }
  if (j > i) {
    return P.makeSuccess(j, {
      stripLeft: false,
      stripRight: false,
      type: "raw" as "raw",
      content: input.slice(i, j),
    });
  } else {
    return P.makeFailure(j, "raw content");
  }
});

type Block =
  | InterpolationBlock
  | IfBlock
  | UnlessBlock
  | ElseBlock
  | ElseIfBlock
  | ForBlock
  | EndBlock
  | RawBlock;

export const TmplBlock = P.alt<Block>(
  Interpolation,
  If,
  Unless,
  Else,
  ElseIf,
  For,
  End,
  Raw
);

export const Tmpl: P.Parser<RootNode> = TmplBlock.many().map(intoAST);

export function intoAST(blocks: Block[]) {
  let _uid = -1;
  const _parents: TmplNode[] = [];
  const _end: TmplNode[] = [];

  const root: TmplNode = {
    id: ++_uid,
    type: "root",
    children: [],
  };

  _parents[root.id] = root;
  _end[root.id] = root;

  let parent: TmplNode = root;

  function addChild(node: TmplNode): TmplNode {
    _parents[node.id] = parent;
    _end[node.id] = parent;
    parent.children.push(node);
    return node;
  }

  function addElse(node: TmplNode): TmplNode {
    if (parent.type !== "cond") {
      throw new Error("misplaced {% else %}");
    }
    _parents[node.id] = parent;
    _end[node.id] = _end[parent.id];
    parent.else = node;
    return node;
  }

  // First, a whitespace stripping phase
  for (let i = 0; i < blocks.length; i++) {
    const prev: undefined | Block = blocks[i - 1];
    const curr = blocks[i];
    const next: undefined | Block = blocks[i + 1];
    if (curr.stripLeft && prev?.type === "raw") {
      prev.content = prev.content.replace(/[ \n\t]*$/, "");
    }
    if (curr.stripRight && next?.type === "raw") {
      next.content = next.content.replace(/^[ \n\t]*/, "");
    }
  }

  // Then, construct the AST
  for (const block of blocks) {
    if (block.type === "raw") {
      addChild({
        id: ++_uid,
        type: "raw",
        content: block.content,
        children: [],
      });
    } else if (block.type === "interpolation") {
      addChild({
        id: ++_uid,
        type: "interpolation",
        expression: block.expression,
        filters: block.filters,
        children: [],
      });
    } else if (block.type === "for") {
      parent = addChild({
        id: ++_uid,
        type: "for",
        item: block.item,
        collection: block.collection,
        children: [],
      });
    } else if (block.type === "if") {
      parent = addChild({
        id: ++_uid,
        type: "cond",
        condition: block.condition,
        children: [],
      });
    } else if (block.type === "unless") {
      const condition: ExprNode = ["not", block.condition];
      parent = addChild({
        id: ++_uid,
        type: "cond",
        condition,
        children: [],
      });
    } else if (block.type === "else") {
      parent = addElse({
        id: ++_uid,
        type: "else",
        children: [],
      });
    } else if (block.type === "elseif") {
      parent = addElse({
        id: ++_uid,
        type: "cond",
        condition: block.condition,
        children: [],
      });
    } else if (block.type === "end") {
      parent = _end[parent.id];
    }
  }

  if (parent !== root) {
    throw new Error("ended up nested");
  }

  return root;
}
