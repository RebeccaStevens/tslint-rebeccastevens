/**
 * General utility functions.
 */

import * as ts from 'typescript';

/**
 * Get the sibling node before this node.
 */
export function getSiblingBefore(node: ts.Node): ts.Node | undefined {
  /* tslint:disable:no-let */
  let siblingBefore: ts.Node | undefined;
  let foundNode = false;
  /* tslint:enable:no-let */

  node.parent.forEachChild((child) => {
    if (child === node) {
      foundNode = true;
    } else if (!foundNode) {
      siblingBefore = child;
    }
  });

  return siblingBefore;
}

/**
 * Get the sibling node after this node.
 */
export function getSiblingAfter(node: ts.Node): ts.Node | undefined {
  /* tslint:disable:no-let */
  let siblingAfter: ts.Node | undefined;
  let foundNode = false;
  /* tslint:enable:no-let */

  node.parent.forEachChild((child) => {
    if (child === node) {
      foundNode = true;
    } else if (foundNode && siblingAfter === undefined) {
      siblingAfter = child;
    }
  });

  return siblingAfter;
}
