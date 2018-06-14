/**
 * This rule prevents the type `ReadonlyArray<T>` from being returned from a function.
 * Functions should not rely on their return type being of type `ReadonlyArray<T>` to
 * prevent mutation as 3rd parties can still modify it (by casting it to a standard array).
 *
 * If a function needs to ensure the array it returns is immutable, it should use Object.freeze().
 *
 * Also note that values of type `ReadonlyArray<T>` cannot be provided to something wanting the type `Array<T>`.
 */

import * as Lint from 'tslint';
import * as ts from 'typescript';

import {
  createInvalidNode,
  createNodeRule,
  IInvalidNode,
  IRuleFunctionResult
} from './common/nodeRuleHelpers';

// tslint:disable-next-line:variable-name naming-convention
export const Rule = createNodeRule(
  ruleFunction,
  'Do not return a ReadonlyArray; return an Array instead.'
);

// tslint:disable-next-line:interface-over-type-literal
type Options = {};

function ruleFunction(
  node: ts.Node,
  ctx: Lint.WalkContext<Options>
): IRuleFunctionResult {
  return { invalidNodes: getInvalidNodes(node, ctx) };
}

function getInvalidNodes(
  node: ts.Node,
  _ctx: Lint.WalkContext<Options>
): Array<IInvalidNode> {
  if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
    const functionDeclaration = node as ts.FunctionDeclaration;
    if (functionDeclaration.type !== undefined) {
      const returnType = functionDeclaration.type as ts.TypeReferenceNode;
      if (returnType.typeName !== undefined && returnType.typeName.kind === ts.SyntaxKind.Identifier) {
        const identifier = returnType.typeName as ts.Identifier;
        if (identifier.text === 'ReadonlyArray') {
          return [createInvalidNode(returnType, [])];
        }
      }
    }
  }

  return [];
}
