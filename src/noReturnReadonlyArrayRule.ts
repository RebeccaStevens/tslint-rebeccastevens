/**
 * This rule prevents the type `ReadonlyArray<T>` from being returned from a function.
 * Functions should not rely on their return type being of type `ReadonlyArray<T>` to
 * prevent mutation as 3rd parties can still modify it (by casting it to a standard array).
 *
 * If a function needs to ensure the array it returns is immutable, it should use Object.freeze().
 *
 * Also note that values of type `ReadonlyArray<T>` cannot be provided to something wanting the type `Array<T>`.
 */

import * as ts from 'typescript';

import {
  createInvalidNode,
  createNodeRule,
  IInvalidNode,
  IRuleFunctionResult
} from './common/nodeRuleHelpers';

// tslint:disable-next-line:naming-convention
export const Rule = createNodeRule(
  ruleFunction,
  'Do not return a ReadonlyArray; return an Array instead.'
);

function ruleFunction(
  node: ts.Node
): IRuleFunctionResult {
  return { invalidNodes: getInvalidNodes(node) };
}

/**
 * Does the given node vialate this rule?
 */
function getInvalidNodes(node: ts.Node): Array<IInvalidNode> {
  if (node.kind !== ts.SyntaxKind.FunctionDeclaration) {
    return [];
  }

  const functionDeclaration = node as ts.FunctionDeclaration;
  if (functionDeclaration.type === undefined) {
    return [];
  }

  const returnType = functionDeclaration.type as ts.TypeReferenceNode;
  if (returnType.typeName === undefined || returnType.typeName.kind !== ts.SyntaxKind.Identifier) {
    return [];
  }

  const identifier = returnType.typeName as ts.Identifier;
  switch (identifier.text) {
    case 'ReadonlyArray':
      return [createInvalidNode(returnType)];

    case 'Promise':
      if (
        returnType.typeArguments === undefined ||
        returnType.typeArguments.length !== 1 ||
        returnType.typeArguments[0].kind !== ts.SyntaxKind.TypeReference
      ) {
        return [];
      }

      const promiseTypeRef = returnType.typeArguments[0] as ts.TypeReferenceNode;
      if (promiseTypeRef.typeName.kind !== ts.SyntaxKind.Identifier) {
        return [];
      }

      const promiseIdentifier = promiseTypeRef.typeName as ts.Identifier;
      if (promiseIdentifier.text === 'ReadonlyArray') {
        return [createInvalidNode(returnType)];
      }

      return [];

    default:
      return [];
  }
}
