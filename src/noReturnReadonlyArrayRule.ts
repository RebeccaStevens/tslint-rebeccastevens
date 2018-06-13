import * as ts from 'typescript';
import * as Lint from 'tslint';

import {
  createInvalidNode,
  createNodeRule,
  RuleFunctionResult,
  InvalidNode
} from './common/nodeRuleHelpers';

// tslint:disable-next-line:variable-name
export const Rule = createNodeRule(ruleFunction, 'Do not return a ReadonlyArray; return an Array instead.');

type Options = {};

function ruleFunction(
  node: ts.Node,
  ctx: Lint.WalkContext<Options>
): RuleFunctionResult {
  return { invalidNodes: getInvalidNodes(node, ctx) };
}

function getInvalidNodes(
  node: ts.Node,
  _ctx: Lint.WalkContext<Options>
): Array<InvalidNode> {
  if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
    const functionDeclaration = node as ts.FunctionDeclaration;
    if (functionDeclaration.type !== undefined) {
      const returnType = functionDeclaration.type as ts.TypeReferenceNode;
      if (returnType.typeName.kind === ts.SyntaxKind.Identifier) {
        const identifier = returnType.typeName as ts.Identifier;
        if (identifier.text === 'ReadonlyArray') {
          return [createInvalidNode(returnType, [])];
        }
      }
    }
  }

  return [];
}
