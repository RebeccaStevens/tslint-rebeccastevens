/**
 * Helper funcation and types for creating tslint rules.
 */

import * as Lint from 'tslint';
import * as ts from 'typescript';

import {
  parseOptions as defaultParseOptions,
  ParseOptionsFunction
} from './options';

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

export function createNodeRule<TOptions>(
  ruleFunction: NodeRuleFunction<TOptions>,
  failureString: string,
  parseOptions: ParseOptionsFunction<TOptions> = defaultParseOptions
): any {
  return class Rule extends Lint.Rules.AbstractRule {
    public apply(sourceFile: ts.SourceFile): Array<Lint.RuleFailure> {
      return this.applyWithFunction(
        sourceFile,
        (ctx: Lint.WalkContext<TOptions>) =>
          walk(ctx, ruleFunction, failureString),
        parseOptions(this.ruleArguments)
      );
    }
  };
}

export function createNodeTypedRule<TOptions>(
  ruleFunction: TypedNodeRuleFunction<TOptions>,
  failureString: string,
  parseOptions: ParseOptionsFunction<TOptions> = defaultParseOptions
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
        parseOptions(this.ruleArguments),
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

export function createInvalidNode(
  node: ts.Node,
  replacements: Array<Lint.Replacement> = []
): IInvalidNode {
  return { node, replacements };
}
