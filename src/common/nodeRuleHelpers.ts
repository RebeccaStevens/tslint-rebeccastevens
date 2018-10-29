/**
 * Helper funcation and types for creating tslint rules.
 */
// tslint:disable:no-object-literal-type-assertion

import * as Lint from 'tslint';
import * as ts from 'typescript';

type NodeRuleFunction<TOptions> =
  | UntypedNodeRuleFunction<TOptions>
  | TypedNodeRuleFunction<TOptions>;

export type UntypedNodeRuleFunction<TOptions> = (node: ts.Node, ctx: Lint.WalkContext<TOptions>) => IRuleFunctionResult;

export type TypedNodeRuleFunction<TOptions> = (
    node: ts.Node,
    ctx: Lint.WalkContext<TOptions>,
    checker: ts.TypeChecker
  ) => IRuleFunctionResult;

export interface IRuleFunctionResult {
  readonly invalidNodes: ReadonlyArray<IInvalidNode>;
  readonly skipChildren?: boolean;
}

export interface IInvalidNode {
  readonly node: ts.Node;
  readonly replacements: Array<Lint.Replacement>;
}

type ParseOptionsFunction<TOptions> = (ruleArguments: Array<RuleArgument>) => TOptions;

type RuleArgument =
  string
  | {
    readonly [key: string]: string | Array<string>;
  };

interface IRuleOptions {
  readonly [key: string]: string | Array<string>;
}

export function createNodeRule<TOptions extends IRuleOptions>(
  ruleFunction: NodeRuleFunction<TOptions>,
  failureString: string,
  doParseOptions: ParseOptionsFunction<TOptions> = parseOptions
): any {
  return class Rule extends Lint.Rules.AbstractRule {
    public apply(sourceFile: ts.SourceFile): Array<Lint.RuleFailure> {
      return this.applyWithFunction(
        sourceFile,
        (ctx: Lint.WalkContext<TOptions>) =>
          walk(ctx, ruleFunction, failureString),
        doParseOptions(this.ruleArguments)
      );
    }
  };
}

export function createNodeTypedRule<TOptions extends IRuleOptions>(
  ruleFunction: TypedNodeRuleFunction<TOptions>,
  failureString: string,
  doParseOptions: ParseOptionsFunction<TOptions> = parseOptions
): any {
  return class Rule extends Lint.Rules.TypedRule {
    public applyWithProgram(
      sourceFile: ts.SourceFile,
      program: ts.Program
    ): Array<Lint.RuleFailure> {
      return this.applyWithFunction(
        sourceFile,
        (ctx: Lint.WalkContext<TOptions>, checker: ts.TypeChecker) =>
          walk(ctx, ruleFunction, failureString, checker),
        doParseOptions(this.ruleArguments),
        program.getTypeChecker()
      );
    }
  };
}

function walk<TOptions>(
  ctx: Lint.WalkContext<TOptions>,
  ruleFunction: NodeRuleFunction<TOptions>,
  failureString: string,
  checker?: ts.TypeChecker
): void {
  const cb = (node: ts.Node): void => {
    const { invalidNodes, skipChildren } =
      checker === undefined
        ? (ruleFunction as UntypedNodeRuleFunction<TOptions>)(node, ctx)
        : (ruleFunction as TypedNodeRuleFunction<TOptions>)(node, ctx, checker);
    reportInvalidNodes(invalidNodes, ctx, failureString);

    if (skipChildren === true) {
      return;
    }

    return ts.forEachChild(node, cb);
  };

  return ts.forEachChild(ctx.sourceFile, cb);
}

function reportInvalidNodes<TOptions>(
  invalidNodes: ReadonlyArray<IInvalidNode>,
  ctx: Lint.WalkContext<TOptions>,
  failureString: string
): void {
  invalidNodes.forEach((invalidNode) =>
    ctx.addFailureAtNode(
      invalidNode.node,
      failureString,
      invalidNode.replacements
    )
  );
}

/**
 * Converts ruleArguments in format
 * ["foo-bar", {"do-it": "foo"}, "do-not-do-it"]
 * to options in format
 * {fooBar: true, doIt: "foo", doNotDoIt: true}
 */
export function parseOptions<TOptions extends IRuleOptions>(
  ruleArguments: Array<RuleArgument>
): TOptions {
  return (
    ruleArguments.reduce<TOptions>((options, arg) => {
      switch (typeof arg) {
        case 'string':
          return {
            ...(options as {}),
            [camelize(arg)]: true
          } as TOptions;

        case 'object':
          return {
            ...(options as {}),
            ...(
              Object.keys(arg)
                .reduce((options2, key) => {
                  return {
                    ...options2,
                    [camelize(key)]: arg[key]
                  };
                }, {})
            )
          } as TOptions;

        default:
          return options;
      }
    }, {} as TOptions)
  );
}

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

function upFirstCharacter(word: string): string {
  return (
    word[0].toUpperCase() +
    word
      .toLowerCase()
      .slice(1)
  );
}

export function createInvalidNode(
  node: ts.Node,
  replacements: Array<Lint.Replacement> = []
): IInvalidNode {
  return { node, replacements };
}
