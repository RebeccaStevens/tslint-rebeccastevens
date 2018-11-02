/**
 * Helper funcation and types for creating tslint rules.
 */

import * as Lint from 'tslint';
import * as ts from 'typescript';

type NodeRuleFunction<TOptions> =
  | UntypedNodeRuleFunction<TOptions>
  | TypedNodeRuleFunction<TOptions>;

export type UntypedNodeRuleFunction<TOptions> = (
  node: ts.Node,
  ctx: Lint.WalkContext<TOptions>
) => RuleFunctionResult;

export type TypedNodeRuleFunction<TOptions> = (
  node: ts.Node,
  ctx: Lint.WalkContext<TOptions>,
  checker: ts.TypeChecker
) => RuleFunctionResult;

export interface RuleFunctionResult {
  readonly invalidNodes: ReadonlyArray<InvalidNode>;
  readonly skipChildren?: boolean;
}

export interface InvalidNode {
  readonly node: ts.Node;
  readonly failureMessage: string;
  readonly replacements: ReadonlyArray<Lint.Replacement>;
}

// tslint:disable:readonly-keyword readonly-array
interface MutableInvalidNode {
  node: ts.Node;
  failureMessage: string;
  replacements: Array<Lint.Replacement>;
}
// tslint:enable:readonly-keyword readonly-array

type ParseOptionsFunction<TOptions> = (
  ruleArguments: ReadonlyArray<RuleArgument>
) => TOptions;

type RuleArgument =
  | string
  | {
      readonly [key: string]: unknown;
    };

interface RuleOptions {
  readonly [key: string]: unknown;
}

export type TsSyntaxFunction =
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.ArrowFunction
  | ts.MethodDeclaration;

export type TsSyntaxFunctionTyped =
  TsSyntaxFunction
  & {
    // tslint:disable-next-line:no-reserved-keywords
    readonly type: ts.TypeNode;
  };

/**
 * Create a Rule class from a rule function.
 */
export function createNodeRule<TOptions extends RuleOptions>(
  ruleFunction: NodeRuleFunction<TOptions>,
  doParseOptions: ParseOptionsFunction<TOptions> = parseOptions
): { new (): Lint.Rules.AbstractRule } {
  // @ts-ignore
  return class Rule extends Lint.Rules.AbstractRule {

    /**
     * Apply this rule.
     */
    public apply(sourceFile: ts.SourceFile): Array<Lint.RuleFailure> {
      return this.applyWithFunction(
        sourceFile,
        (ctx) => {
          walk(ctx, ruleFunction);
        },
        doParseOptions(this.ruleArguments)
      );
    }
  };
}

/**
 * Create a Rule class from a rule function that uses type information.
 */
export function createNodeTypedRule<TOptions extends RuleOptions>(
  ruleFunction: TypedNodeRuleFunction<TOptions>,
  doParseOptions: ParseOptionsFunction<TOptions> = parseOptions
): { new (): Lint.Rules.TypedRule } {
  // @ts-ignore
  return class Rule extends Lint.Rules.TypedRule {

    /**
     * Apply this rule.
     */
    public applyWithProgram(
      sourceFile: ts.SourceFile,
      program: ts.Program
    ): Array<Lint.RuleFailure> {
      return this.applyWithFunction(
        sourceFile,
        (ctx, checker: ts.TypeChecker) => {
          walk(ctx, ruleFunction, checker);
        },
        doParseOptions(this.ruleArguments),
        program.getTypeChecker()
      );
    }
  };
}

/**
 * Walk the AST.
 */
function walk<TOptions>(
  ctx: Lint.WalkContext<TOptions>,
  ruleFunction: NodeRuleFunction<TOptions>,
  checker?: ts.TypeChecker
): void {
  const cb = (node: ts.Node): void => {
    const { invalidNodes, skipChildren } =
      checker === undefined
        ? (ruleFunction as UntypedNodeRuleFunction<TOptions>)(node, ctx)
        : (ruleFunction as TypedNodeRuleFunction<TOptions>)(node, ctx, checker);
    reportInvalidNodes(invalidNodes, ctx);

    if (skipChildren === true) {
      return;
    }

    return ts.forEachChild(node, cb);
  };

  return ts.forEachChild(ctx.sourceFile, cb);
}

/**
 * Report the invalid nodes.
 */
function reportInvalidNodes<TOptions>(
  invalidNodes: ReadonlyArray<InvalidNode>,
  ctx: Lint.WalkContext<TOptions>
): void {
  // At this point we are finished with the invalid nodes and so we can
  // pass them of with mutable properties.
  invalidNodes.forEach((invalidNode: MutableInvalidNode) => {
    ctx.addFailureAtNode(
      invalidNode.node,
      invalidNode.failureMessage,
      invalidNode.replacements
    );
  });
}

/**
 * Converts ruleArguments in format
 * ["foo-bar", {"do-it": "foo"}, "do-not-do-it"]
 * to options in format
 * {fooBar: true, doIt: "foo", doNotDoIt: true}
 */
export function parseOptions<TOptions extends RuleOptions>(
  ruleArguments: ReadonlyArray<RuleArgument>
): TOptions {
  return ruleArguments.reduce<TOptions>(
    (options, arg) => {
      switch (typeof arg) {
        case 'string':
          return {
            ...(options as {}),
            [camelize(arg)]: true
          } as TOptions;

        case 'object':
          return {
            ...(options as {}),
            ...(Object
              .keys(arg)
              .reduce<TOptions>((options2, key) => {
                return {
                  ...(options2 as {}),
                  [camelize(key)]: arg[key]
                } as TOptions;
              }, {} as TOptions) as {})
          } as TOptions;

        default:
          return options;
      }
    },
    {} as TOptions
  );
}

/**
 * Create a camelCase version of the string passed in.
 *
 * Words must be seperated by either a dash (-) or an underscore (_).
 */
function camelize(text: string): string {
  const words = text.split(/[-_]/g);
  return (
    words[0].toLowerCase() +
    words
      .slice(1)
      .map(upFirstCharacter)
      .join('')
  );
}

/**
 * Capitalize the first character of the given text.
 */
function upFirstCharacter(word: string): string {
  return (
    word[0].toUpperCase() +
    word
      .toLowerCase()
      .slice(1)
  );
}

/**
 * Mark the given node as invalid
 */
export function markAsInvalidNode(
  node: ts.Node,
  failureMessage: string,
  replacements: ReadonlyArray<Lint.Replacement> = []
): InvalidNode {
  return { node, failureMessage, replacements };
}
