import * as ts from 'typescript';
import * as Lint from 'tslint';
import {
  parseOptions as defaultParseOptions,
  ParseOptionsFunction
} from './options';

type NodeRuleFunction<TOptions> =
  | UntypedNodeRuleFunction<TOptions>
  | TypedNodeRuleFunction<TOptions>;

export interface UntypedNodeRuleFunction<TOptions> {
  (node: ts.Node, ctx: Lint.WalkContext<TOptions>): RuleFunctionResult;
}

export interface TypedNodeRuleFunction<TOptions> {
  (
    node: ts.Node,
    ctx: Lint.WalkContext<TOptions>,
    checker: ts.TypeChecker
  ): RuleFunctionResult;
}

export interface RuleFunctionResult {
  invalidNodes: ReadonlyArray<InvalidNode>;
  skipChildren?: boolean;
}

export interface InvalidNode {
  readonly node: ts.Node;
  readonly replacements: Array<Lint.Replacement>;
}

export function createNodeRule<TOptions>(
  ruleFunction: NodeRuleFunction<TOptions>,
  failureString: string,
  parseOptions: ParseOptionsFunction<TOptions> = defaultParseOptions
): any {
  return class Rule extends Lint.Rules.AbstractRule {
    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
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
    ): Lint.RuleFailure[] {
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

export function createInvalidNode(
  node: ts.Node,
  replacements: Array<Lint.Replacement>
): InvalidNode {
  return { node, replacements };
}

function walk<TOptions>(
  ctx: Lint.WalkContext<TOptions>,
  ruleFunction: NodeRuleFunction<TOptions>,
  failureString: string,
  checker?: ts.TypeChecker
): void {
  return ts.forEachChild(ctx.sourceFile, function cb(node: ts.Node): void {
    const { invalidNodes, skipChildren } =
      checker === undefined
        ? (ruleFunction as UntypedNodeRuleFunction<TOptions>)(node, ctx)
        : (ruleFunction as TypedNodeRuleFunction<TOptions>)(node, ctx, checker);
    reportInvalidNodes(invalidNodes, ctx, failureString);

    if (skipChildren === true) {
      return;
    }

    return ts.forEachChild(node, cb);
  });
}

function reportInvalidNodes<TOptions>(
  invalidNodes: ReadonlyArray<InvalidNode>,
  ctx: Lint.WalkContext<TOptions>,
  failureString: string
): void {
  invalidNodes.forEach(invalidNode =>
    ctx.addFailureAtNode(
      invalidNode.node,
      failureString,
      invalidNode.replacements
    )
  );
}
