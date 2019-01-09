/**
 * Helper funcation and types for creating tslint rules.
 */
import * as Lint from 'tslint';
import ts from 'typescript';

export type UntypedNodeRuleFunction<TOptions> = (
  node: ts.Node,
  ctx: Lint.WalkContext<TOptions>
) => RuleFunctionResult;

export type TypedNodeRuleFunction<TOptions> = (
  node: ts.Node,
  ctx: Lint.WalkContext<TOptions>,
  checker: ts.TypeChecker
) => RuleFunctionResult;

/*
 * Results should not have the return type of ReadonlyArray.
 *
 * @see "no-return-readonly-array" rule for more info.
 */
// tslint:disable:readonly-keyword readonly-array
export interface RuleFunctionResult {
  /**
   * The invalid nodes found by the rule.
   */
  readonly invalidNodes: Array<InvalidNodeResult>;

  /**
   * If true, child nodes do not need to be checked.
   */
  readonly skipChildren: boolean;
}

export interface InvalidNodeResult {
  /**
   * The node that failed the test.
   */
  readonly node: ts.Node;

  /**
   * The message explaining the failure.
   */
  readonly failureMessage: string;

  /**
   * Any automatic replacements that can be made to fix the problem.
   */
  readonly replacements: Array<Lint.Replacement>;
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

/**
 * Create a Rule class from a rule function that analyzes nodes one by one.
 */
export function createNodeRule<TOptions extends RuleOptions>(
  ruleFunction: UntypedNodeRuleFunction<TOptions>,
  doParseOptions: ParseOptionsFunction<TOptions> = parseOptions
): new () => Lint.Rules.AbstractRule {
  // @ts-ignore
  return class Rule extends Lint.Rules.AbstractRule {

    /**
     * Apply this rule.
     */
    public apply(sourceFile: ts.SourceFile): Array<Lint.RuleFailure> {
      return this.applyWithFunction(
        sourceFile,
        (ctx) => {
          walk(ctx, (node) => ruleFunction(node, ctx));
        },
        doParseOptions(this.ruleArguments)
      );
    }
  };
}

/**
 * Create a Rule class from a rule function that analyzes nodes one by one
 * and uses type information.
 */
export function createNodeTypedRule<TOptions extends RuleOptions>(
  ruleFunction: TypedNodeRuleFunction<TOptions>,
  doParseOptions: ParseOptionsFunction<TOptions> = parseOptions
): new () => Lint.Rules.TypedRule {
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
          walk(ctx, (node) => ruleFunction(node, ctx, checker));
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
  ruleFunction: (node: ts.Node) => RuleFunctionResult
): void {
  const cb = (node: ts.Node): void => {
    const { invalidNodes, skipChildren } = ruleFunction(node);
    reportInvalidNodes(invalidNodes, ctx);

    if (skipChildren) {
      return;
    }

    return ts.forEachChild(node, cb);
  };

  return ts.forEachChild(ctx.sourceFile, cb);
}

/**
 * Report the invalid nodes to tslint.
 */
function reportInvalidNodes<TOptions>(
  invalidNodes: ReadonlyArray<InvalidNodeResult>,
  ctx: Lint.WalkContext<TOptions>
): void {
  invalidNodes.forEach((invalidNode: InvalidNodeResult) => {
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
      // tslint:disable-next-line:switch-default
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
      }
    },
    {} as TOptions
  );
}

/**
 * Create a camelCase version of the string passed in.
 *
 * Note: Words must be seperated by either a dash (-) or an underscore (_).
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
 * Mark the given node as invalid.
 */
export function markAsInvalidNode(
  node: ts.Node,
  failureMessage: string,
  replacements: ReadonlyArray<Lint.Replacement> = []
): InvalidNodeResult {
  return {
    node,
    failureMessage,
    replacements: [...replacements]
  };
}
