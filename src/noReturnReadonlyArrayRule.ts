/**
 * This rule prevents the type `ReadonlyArray<T>` from being returned from a
 * function.
 *
 * Note: Values of type `ReadonlyArray<T>` cannot be provided to functions
 * expecting a value of type `Array<T>`.
 */

import * as Lint from 'tslint';
import * as ts from 'typescript';

import {
  createNodeTypedRule,
  InvalidNodeResult,
  markAsInvalidNode,
  RuleFunctionResult
} from './common/nodeRuleHelpers';
import * as Options from './common/options';
import {
  isTypedFunctionLikeDeclaration,
  TypedFunctionLikeDeclaration
} from './common/typeguard';

type RuleOptions =
  & Options.IncludeTypeArguments
  & Options.Deep;

const readonlyArrayType = 'ReadonlyArray';

const failureMessageDefault = 'Do not return a ReadonlyArray; return an Array instead.';
const failureMessageType = 'Do not return a type containing a ReadonlyArray; use an Array instead.';
const failureMessageDeep = 'Do not return a ReadonlyArray within the result; use an Array instead.';

/**
 * The `no-return-readonly-array-rule`.
 */
export const Rule = createNodeTypedRule<RuleOptions>(ruleEntryPoint);

/**
 * Does the given node vialate this rule?
 *
 * If not return the nodes that are invalid (can be subnodes of the given node).
 */
function ruleEntryPoint(
  node: ts.Node,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker
): RuleFunctionResult {
  if (isTypedFunctionLikeDeclaration(node)) {
    if (ts.isTypeReferenceNode(node.type)) {
      const invalidNodes = inspectTypeReference(
        node.type,
        ctx,
        checker,
        failureMessageDefault,
        true
      );

      if (invalidNodes.length > 0) {
        return {
          invalidNodes,
          skipChildren: false
        };
      }
    }

    if (Boolean(ctx.options.deep)) {
      const invalidNodes = checkOptionDeep(node, ctx, checker, true);

      if (invalidNodes.length > 0) {
        return {
          invalidNodes,
          skipChildren: false
        };
      }
    }
  }

  return {
    invalidNodes: [],
    skipChildren: false
  };
}

/**
 * Does one of the given node's child nodes invalidate this rule?
 */
function checkOptionDeep(
  node: TypedFunctionLikeDeclaration,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  safeToReplace: boolean
): Array<InvalidNodeResult> {
  if (ts.isTypeLiteralNode(node.type)) {
    const result = inspectTypeLiteralNode(
      node.type,
      ctx,
      checker,
      safeToReplace
    );

    if (result.length > 0) {
      return result;
    }
  }

  if (ts.isTupleTypeNode(node.type)) {
    const result = inspectTupleTypeNode(
      node.type,
      ctx,
      checker,
      safeToReplace
    );

    if (result.length > 0) {
      return result;
    }
  }

  return [];
}

/**
 * Does the given property signature vialate this rule?
 */
function inspectPropertySignatureNode(
  node: ts.PropertySignature,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  safeToReplace: boolean,
  nodeToMark?: ts.Node
): Array<InvalidNodeResult> {
  if (node.type === undefined) {
    return [];
  }

  if (ts.isTypeReferenceNode(node.type)) {
    return inspectTypeReference(
      node.type,
      ctx,
      checker,
      failureMessageDeep,
      safeToReplace,
      nodeToMark
    );
  }

  if (ts.isTypeLiteralNode(node.type)) {
    return inspectTypeLiteralNode(
      node.type,
      ctx,
      checker,
      safeToReplace,
      nodeToMark
    );
  }

  return [];
}

/**
 * Does the given tuple vialate this rule?
 */
function inspectTupleTypeNode(
  node: ts.TupleTypeNode,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  safeToReplace: boolean,
  nodeToMark?: ts.Node
): Array<InvalidNodeResult> {
  // tslint:disable-next-line:no-any
  const mutableIds: any = {};

  return (
    /**
     * TODO: Ensure this flat map doesn't contain any duplicates.
     * BODY: Duplicates occur when `nodeToMark` gets marked as an invalid node by multiple elements in the tuple.
     *       Once this has been fixed, the filter function below can be removed.
     */
    ([] as ReadonlyArray<InvalidNodeResult>).concat(
      ...node.elementTypes.map((element) =>
        ts.isTypeReferenceNode(element)
          ? inspectTypeReference(
              element,
              ctx,
              checker,
              failureMessageDeep,
              safeToReplace,
              nodeToMark
            )
          : []
      )
    )
    // Filter out duplicates.
    .filter((item) => {
      // tslint:disable:no-unsafe-any
      const id = item.node.pos;
      if (mutableIds[id]) {
        return false;
      }
      mutableIds[id] = true;
      return true;
      // tslint:enable:no-unsafe-any
    })
  );
}

/**
 * Does the given type reference vialate this rule?
 */
function inspectTypeReference(
  node: ts.TypeReferenceNode,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  failureMessage: string,
  safeToReplace: boolean,
  nodeToMark?: ts.Node
): Array<InvalidNodeResult> {
  if (!ts.isIdentifier(node.typeName)) {
    return [];
  }

  if (node.typeName.text === readonlyArrayType) {
    return [
      markAsInvalidNode(
        nodeToMark === undefined
          ? node
          : nodeToMark,
        failureMessage,
        getInvalidNodeReplacements(safeToReplace, node, readonlyArrayType, ctx)
      )
    ];
  }

  if (Boolean(ctx.options.includeTypeArguments)) {
    const results = checkOptionIncludeTypeArguments(
      node,
      ctx,
      checker,
      failureMessageType,
      safeToReplace,
      nodeToMark
    );

    if (results.length > 0) {
      return results;
    }
  }

  return inspectTypeReferenceWithTypeChecking(
    node,
    ctx,
    checker,
    nodeToMark
  );
}

/**
 * Does the given type reference vialate this rule?
 * (uses typechecking)
 */
function inspectTypeReferenceWithTypeChecking(
  node: ts.TypeReferenceNode,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  nodeToMark?: ts.Node
): Array<InvalidNodeResult> {
  if (!Boolean(ctx.options.deep)) {
    return [];
  }

  const nodeType = checker.getTypeFromTypeNode(node);

  const nodeTypeNodeResults =
    inspectTypeReferenceNodeTypeNode(
      node,
      nodeType,
      ctx,
      checker,
      nodeToMark
    );

  if (nodeTypeNodeResults.length > 0) {
    return nodeTypeNodeResults;
  }

  const typeAliasResults =
    inspectTypeReferenceTypeAlias(
      node,
      nodeType,
      ctx,
      checker,
      nodeToMark
    );

  if (typeAliasResults.length > 0) {
    return typeAliasResults;
  }

  return [];
}

/**
 * Does the given type reference vialate this rule?
 * Checks against the node type.
 */
function inspectTypeReferenceNodeTypeNode(
  node: ts.TypeReferenceNode,
  nodeType: ts.Type,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  nodeToMark?: ts.Node
): Array<InvalidNodeResult> {
  const nodeTypeNode = checker.typeToTypeNode(nodeType);

  // This should never be undefined.
  // istanbul ignore next
  if (nodeTypeNode === undefined) {
    return [];
  }

  if (ts.isTypeReferenceNode(nodeTypeNode)) {
    return inspectTypeReference(
      nodeTypeNode,
      ctx,
      checker,
      failureMessageDeep,
      false,
      nodeToMark === undefined
        ? node
        : nodeToMark
    );
  }

  if (ts.isTupleTypeNode(nodeTypeNode)) {
    return inspectTupleTypeNode(
      nodeTypeNode,
      ctx,
      checker,
      false,
      nodeToMark === undefined
        ? node
        : nodeToMark
    );
  }

  return [];
}

/**
 * Does the given type reference vialate this rule?
 * Checks against the type alias.
 */
function inspectTypeReferenceTypeAlias(
  node: ts.TypeReferenceNode,
  nodeType: ts.Type,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  nodeToMark?: ts.Node
): Array<InvalidNodeResult> {
  if (nodeType.aliasSymbol === undefined) {
    return [];
  }

  return ([] as ReadonlyArray<InvalidNodeResult>).concat(
    ...nodeType.aliasSymbol.declarations.map((declaration) =>
      (
        ts.isTypeAliasDeclaration(declaration) &&
        ts.isTypeLiteralNode(declaration.type)
      )
        ? inspectTypeLiteralNode(
            declaration.type,
            ctx,
            checker,
            false,
            nodeToMark === undefined
              ? node
              : nodeToMark
          )
        : []
    )
  );
}

/**
 * Does the given type literal vialate this rule?
 */
function inspectTypeLiteralNode(
  node: ts.TypeLiteralNode,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  safeToReplace: boolean,
  nodeToMark?: ts.Node
): Array<InvalidNodeResult> {
  return (
    ([] as ReadonlyArray<InvalidNodeResult>).concat(
      ...node.members.map((member) =>
        ts.isPropertySignature(member)
          ? inspectPropertySignatureNode(
              member,
              ctx,
              checker,
              safeToReplace,
              nodeToMark
            )
          : []
      )
    )
  );
}

/**
 * Get the invalid nodes within the given type reference.
 */
function checkOptionIncludeTypeArguments(
  node: ts.TypeReferenceNode,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  failureMessage: string,
  safeToReplace: boolean,
  nodeToMark?: ts.Node
): Array<InvalidNodeResult> {
  if (node.typeArguments === undefined) {
    return [];
  }

  return (
    ([] as ReadonlyArray<InvalidNodeResult>).concat(
      ...node.typeArguments.map((argument) => {
        if (!ts.isTypeReferenceNode(argument)) {
          return [];
        }

        if (
          ts.isIdentifier(argument.typeName) &&
          argument.typeName.text === readonlyArrayType
        ) {

          return [
            markAsInvalidNode(
              nodeToMark === undefined
                ? argument
                : nodeToMark,
              failureMessage,
              getInvalidNodeReplacements(safeToReplace, argument, readonlyArrayType, ctx)
            ),
            ...checkOptionIncludeTypeArguments(
              argument,
              ctx,
              checker,
              failureMessage,
              safeToReplace,
              nodeToMark
            )
          ];
        }

        return checkOptionIncludeTypeArguments(
          argument,
          ctx,
          checker,
          failureMessage,
          safeToReplace,
          nodeToMark
        );
      })
    )
  );
}

/**
 * Get the fix replacement for an invalid node.
 */
function getInvalidNodeReplacements(
  safeToReplace: boolean,
  invalidNode: ts.TypeReferenceNode,
  toReplace: string,
  ctx: Lint.WalkContext<RuleOptions>
): Array<Lint.Replacement> {
  return (
    safeToReplace && invalidNode.pos >= 0
      ? [
          new Lint.Replacement(
            invalidNode.getStart(ctx.sourceFile),
            toReplace.length,
            'Array'
          )
        ]
      : []
  );
}
