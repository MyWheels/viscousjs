import P from "parsimmon";

export type Op =
  | "-"
  | "not"
  | "^"
  | "*"
  | "/"
  | "=="
  | "!="
  | "<="
  | "<"
  | ">="
  | ">"
  | "contains"
  | "+"
  | "and"
  | "or";

export type ExprNode =
  | ["bool", boolean]
  | ["num", number]
  | ["str", string]
  | ["id", string]
  | ["member", ExprNode, string]
  | ["helper", string, ExprNode[]]
  | [Op, ...ExprNode[]];

// Turn escaped characters into real ones (e.g. "\\n" becomes "\n").
function interpretEscapes(str: string) {
  let escapes: Record<string, string> = {
    b: "\b",
    f: "\f",
    n: "\n",
    r: "\r",
    t: "\t",
  };
  return str.replace(/\\(u[0-9a-fA-F]{4}|[^u])/, (_, escape) => {
    let type = escape.charAt(0);
    let hex = escape.slice(1);
    if (type === "u") {
      return String.fromCharCode(parseInt(hex, 16));
    }
    if (escapes.hasOwnProperty(type)) {
      return escapes[type];
    }
    return type;
  });
}

// ======================================================================
// Note: This code is taken almost verbatim from the Parsimmon's examples
// ======================================================================

// This parser supports basic math with + - * / ^, unary negation, factorial,
// and parentheses. It does not evaluate the math, just turn it into a series of
// nested lists that are easy to evaluate.

// You might think that parsing math would be easy since people learn it early
// in school, but dealing with precedence and associativity of operators is
// actually one of the hardest and most tedious things you can do in a parser!
// If you look at a language like JavaScript, it has even more operators than
// math, like = and && and || and ++ and so many more...

///////////////////////////////////////////////////////////////////////

let _ = P.optWhitespace;

// Operators should allow whitespace around them, but not require it. This
// helper combines multiple operators together with names.
//
// Example: operators(["+", "-"])
function operators(ops: string[]) {
  const parsers = ops
    .slice()
    .sort()
    .map((op) => P.string(op).trim(_));
  return P.alt(...parsers) as P.Parser<Op>;
}

// Takes a parser for the prefix operator, and a parser for the base thing being
// parsed, and parses as many occurrences as possible of the prefix operator.
// Note that the parser is created using `P.lazy` because it's recursive. It's
// valid for there to be zero occurrences of the prefix operator.
function PREFIX(
  operatorsParser: P.Parser<Op>,
  nextParser: P.Parser<ExprNode>
): P.Parser<ExprNode> {
  const parser: P.Parser<ExprNode> = P.lazy(() => {
    return P.seq(operatorsParser, parser).or(nextParser);
  });
  return parser;
}

// Ideally this function would be just like `PREFIX` but reordered like
// `P.seq(parser, operatorsParser).or(nextParser)`, but that doesn't work. The
// reason for that is that Parsimmon will get stuck in infinite recursion, since
// the very first rule. Inside `parser` is to match parser again. Alternatively,
// you might think to try `nextParser.or(P.seq(parser, operatorsParser))`, but
// that won't work either because in a call to `.or` (aka `P.alt`), Parsimmon
// takes the first possible match, even if subsequent matches are longer, so the
// parser will never actually look far enough ahead to see the postfix
// operators.
function POSTFIX(
  operatorsParser: P.Parser<Op>,
  nextParser: P.Parser<ExprNode>
): P.Parser<ExprNode> {
  // Because we can't use recursion like stated above, we just match a flat list
  // of as many occurrences of the postfix operator as possible, then use
  // `.reduce` to manually nest the list.
  //
  // Example:
  //
  // INPUT  :: "4!!!"
  // PARSE  :: [4, "factorial", "factorial", "factorial"]
  // REDUCE :: ["factorial", ["factorial", ["factorial", 4]]]
  return P.seqMap(nextParser, operatorsParser.many(), (x, suffixes) =>
    suffixes.reduce((acc, x) => [x, acc], x)
  );
}

// Takes a parser for all the operators at this precedence level, and a parser
// that parsers everything at the next precedence level, and returns a parser
// that parses as many binary operations as possible, associating them to the
// right. (e.g. 1^2^3 is 1^(2^3) not (1^2)^3)
function BINARY_RIGHT(
  operatorsParser: P.Parser<Op>,
  nextParser: P.Parser<ExprNode>
): P.Parser<ExprNode> {
  const parser: P.Parser<ExprNode> = P.lazy(() =>
    nextParser.chain((next) =>
      P.seq(operatorsParser, P.of(next), parser).or(P.of(next))
    )
  );
  return parser;
}

// Takes a parser for all the operators at this precedence level, and a parser
// that parsers everything at the next precedence level, and returns a parser
// that parses as many binary operations as possible, associating them to the
// left. (e.g. 1-2-3 is (1-2)-3 not 1-(2-3))
function BINARY_LEFT(
  operatorsParser: P.Parser<Op>,
  nextParser: P.Parser<ExprNode>
): P.Parser<ExprNode> {
  // We run into a similar problem as with the `POSTFIX` parser above where we
  // can't recurse in the direction we want, so we have to resort to parsing an
  // entire list of operator chunks and then using `.reduce` to manually nest
  // them again.
  //
  // Example:
  //
  // INPUT  :: "1+2+3"
  // PARSE  :: [1, ["+", 2], ["+", 3]]
  // REDUCE :: ["+", ["+", 1, 2], 3]
  return P.seqMap(
    nextParser,
    P.seq(operatorsParser, nextParser).many(),
    (first, rest) => {
      return rest.reduce((acc, ch) => {
        let [op, another] = ch;
        return [op, acc, another];
      }, first);
    }
  );
}

// Just match simple integers and turn them into JavaScript numbers. Wraps it up
// in an array with a string tag so that our data is easy to manipulate at the
// end and we don't have to use `typeof` to check it.
const Num = P.regexp(/[0-9]+/)
  .map((str): ExprNode => ["num", +str])
  .desc("num");

const Bool = P.string("true")
  .or(P.string("false"))
  .map((str): ExprNode => ["bool", str === "true"])
  .desc("bool");

const Str = P.regexp(/"((?:\\.|.)*?)"/, 1)
  .or(P.regexp(/'((?:\\.|.)*?)'/, 1))
  .map(interpretEscapes)
  .map((str): ExprNode => ["str", str])
  .desc("str");

const Id = P.regexp(/[_a-zA-Z]+/);
const Identifier = Id.map((str): ExprNode => ["id", str]).desc("id");

const Member = P.seqMap(
  Identifier,
  _.then(P.string(".")).then(Id).many(),
  (id, keys) => {
    return keys.reduce((node, key) => ["member", node, key] as ExprNode, id);
  }
).desc("member");

const Helper: P.Parser<ExprNode> = P.lazy(() => {
  return P.seq(
    Id,
    _,
    P.string("("),
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    Expr.sepBy(P.string(",").trim(_)),
    P.string(")")
  ).map(([name, , , args]) => ["helper", name, args]);
});

const Parenthesized = P.lazy(() => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return Expr.wrap(P.string("("), P.string(")"));
});

// A basic value is any parenthesized Expr,
//  or an atom,
//  or a function call
const Basic: P.Parser<ExprNode> = P.lazy(() => {
  return P.alt(Helper, Parenthesized, Bool, Str, Num, Member);
});

// Now we can describe the operators in order by precedence. You just need to
// re-order the table.
const table = [
  { type: PREFIX, ops: operators(["-", "not"]) },
  // { type: POSTFIX, ops: operators({ fac: "!" }) },
  { type: BINARY_RIGHT, ops: operators(["^"]) },
  { type: BINARY_LEFT, ops: operators(["*", "/"]) },
  {
    type: BINARY_LEFT,
    ops: operators(["==", "!=", "<=", "<", ">=", ">", "contains", "+", "-"]),
  },
  {
    type: BINARY_LEFT,
    ops: operators(["and", "or"]),
  },
];

// Start off with Num as the base parser for numbers and thread that through the
// entire table of operator parsers.
const tableParser: P.Parser<ExprNode> = table.reduce(
  (acc, level) => level.type(level.ops, acc),
  Basic
);

// The above is equivalent to:
//
// TYPE(operators({...}),
//   TYPE(operators({...}),
//     TYPE(operators({...})),
//       TYPE(operators({...}),
//         TYPE(operators({...}), ...))))
//
// But it's easier if to see what's going on and reorder the precedence if we
// keep it in a table instead of nesting it all manually.

export const Expr: P.Parser<ExprNode> = tableParser.trim(_);
