/**
 * This file contains functions that typeguard the given node.
 *
 * It also contains other useful types.
 */

import * as utils from 'tsutils/typeguard';
import * as ts from 'typescript';

export type AccessExpression =
  | ts.ElementAccessExpression
  | ts.PropertyAccessExpression;

export type TypedFunctionLikeDeclaration =
  & ts.FunctionLikeDeclaration
  & {
    readonly type: ts.TypeNode;
  };

/**
 * Is the given node a TypedFunctionLikeDeclaration?
 */
export function isTypedFunctionLikeDeclaration(
  node: ts.Node
): node is TypedFunctionLikeDeclaration {
  return isFunctionLikeDeclaration(node) && node.type !== undefined;
}

/**
 * Is the given node a FunctionLikeDeclaration.
 */
export function isFunctionLikeDeclaration(
  node: ts.Node
): node is ts.FunctionLikeDeclaration {
  return (
    utils.isArrowFunction(node) ||
    utils.isConstructorDeclaration(node) ||
    utils.isFunctionDeclaration(node) ||
    utils.isFunctionExpression(node) ||
    utils.isGetAccessorDeclaration(node) ||
    utils.isMethodDeclaration(node) ||
    utils.isSetAccessorDeclaration(node)
  );
}

/**
 * Is the given node a VariableLikeDeclaration.
 */
export function isVariableLikeDeclaration(
  node: ts.Node
): node is ts.VariableLikeDeclaration {
  return (
    utils.isBindingElement(node) ||
    utils.isEnumMember(node) ||
    utils.isParameterDeclaration(node) ||
    utils.isPropertyAssignment(node) ||
    utils.isPropertyDeclaration(node) ||
    utils.isPropertySignature(node) ||
    utils.isShorthandPropertyAssignment(node) ||
    utils.isVariableDeclaration(node)
  );
}

/**
 * Is the given node an AccessExpression.
 */
export function isAccessExpression(node: ts.Node): node is AccessExpression {
  return (
    utils.isElementAccessExpression(node) ||
    utils.isPropertyAccessExpression(node)
  );
}
