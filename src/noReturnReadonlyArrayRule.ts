/**
 * This rule prevents the type `ReadonlyArray<T>` from being returned from a function.
 * Functions should not rely on their return type being of type `ReadonlyArray<T>` to
 * prevent mutation as 3rd parties can still modify it (by casting it to a standard array).
 *
 * If a function needs to ensure the array it returns is immutable, it should use Object.freeze().
 *
 * Also note that values of type `ReadonlyArray<T>` cannot be provided to a function wanting the type `Array<T>`.
 */

import * as Lint from 'tslint';
import * as ts from 'typescript';

import {
  createNodeTypedRule,
  InvalidNode,
  isFunctionLikeAndTyped,
  markAsInvalidNode,
  TsSyntaxSignatureDeclarationTyped
} from './common/nodeRuleHelpers';
import * as Options from './common/options';

type RuleOptions =
  & Options.Deep
  & Options.IncludeTypeArguments;

const failureMessageDefault =
  'Do not return a ReadonlyArray; return an Array instead.';

const failureMessageType =
  'Do not return a type containing a ReadonlyArray; use an Array instead.';

const failureMessageDeep =
  'Do not return a ReadonlyArray within the result; use an Array instead.';

const readonlyArrayType = 'ReadonlyArray';

/**
 * The `no-return-readonly-array-rule`.
 */
export const Rule = createNodeTypedRule<RuleOptions>(
  (node, ctx, checker) => ({
    invalidNodes: getInvalidNodes(node, ctx, checker)
  })
);

/**
 * Does the given node vialate this rule?
 *
 * If not return the nodes that are invalid (can be subnodes of the given node).
 */
function getInvalidNodes(
  node: ts.Node,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker
): Array<InvalidNode> {
  if (!isFunctionLikeAndTyped(node)) {
    return [];
  }

  if (ts.isTypeReferenceNode(node.type)) {
    const invalidTypeReferenceNodes =
      getInvalidTypeReferenceNodes(
        node.type,
        ctx,
        checker,
        failureMessageDefault,
        true
      );

    if (invalidTypeReferenceNodes.length > 0) {
      return invalidTypeReferenceNodes;
    }
  }

  if (Boolean(ctx.options.deep)) {
    const deepInvalidNodes =
      getDeepInvalidNodes(node, ctx, checker, true);

    if (deepInvalidNodes.length > 0) {
      return deepInvalidNodes;
    }
  }

  return [];
}

/**
 * Does one of the given node's child nodes invalidate this rule?
 */
function getDeepInvalidNodes(
  node: TsSyntaxSignatureDeclarationTyped,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  safeToReplace: boolean
): Array<InvalidNode> {
  if (ts.isTypeLiteralNode(node.type)) {
    const invalidTypeLiteralNodes = getInvalidTypeLiteralNodes(
      node.type,
      ctx,
      checker,
      safeToReplace
    );

    if (invalidTypeLiteralNodes.length > 0) {
      return invalidTypeLiteralNodes;
    }
  }

  if (ts.isTupleTypeNode(node.type)) {
    const invalidTupleTypeNodes = getInvalidTupleTypeNodes(
      node.type,
      ctx,
      checker,
      safeToReplace
    );

    if (invalidTupleTypeNodes.length > 0) {
      return invalidTupleTypeNodes;
    }
  }

  return [];
}

/**
 * Does the given property signature vialate this rule?
 */
function getInvalidPropertySignatureNodes(
  node: ts.PropertySignature,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  safeToReplace: boolean,
  nodeToMark?: ts.Node
): Array<InvalidNode> {
  if (node.type === undefined) {
    return [];
  }

  if (ts.isTypeReferenceNode(node.type)) {
    return getInvalidTypeReferenceNodes(
      node.type,
      ctx,
      checker,
      failureMessageDeep,
      safeToReplace,
      nodeToMark
    );
  }

  if (ts.isTypeLiteralNode(node.type)) {
    return getInvalidTypeLiteralNodes(
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
function getInvalidTupleTypeNodes(
  node: ts.TupleTypeNode,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  safeToReplace: boolean,
  nodeToMark?: ts.Node
): Array<InvalidNode> {
  // tslint:disable-next-line:no-any
  const mutableIds: any = {};

  return (
    /**
     * TODO: Ensure this flat map doesn't contain any duplicates.
     * BODY: Duplicates occur when `nodeToMark` gets marked as an invalid node by multiple elements in the tuple.
     *       Once this has been fixed, the filter function below can be removed.
     */
    ([] as ReadonlyArray<InvalidNode>).concat(
      ...node.elementTypes.map((element) =>
        ts.isTypeReferenceNode(element)
        ? getInvalidTypeReferenceNodes(
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
function getInvalidTypeReferenceNodes(
  node: ts.TypeReferenceNode,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  failureMessage: string,
  safeToReplace: boolean,
  nodeToMark?: ts.Node
): Array<InvalidNode> {
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
        getFixReplacement(safeToReplace, node, readonlyArrayType, ctx)
      )
    ];
  }

  if (Boolean(ctx.options.includeTypeArguments)) {
    const invalidTypeArgumentNodes = getInvalidTypeArgumentNodes(
      node,
      ctx,
      checker,
      failureMessageType,
      safeToReplace,
      nodeToMark
    );

    if (invalidTypeArgumentNodes.length > 0) {
      return invalidTypeArgumentNodes;
    }
  }

  return getInvalidTypeReferenceNodesWithTypeChecking(
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
function getInvalidTypeReferenceNodesWithTypeChecking(
  node: ts.TypeReferenceNode,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  nodeToMark?: ts.Node
): Array<InvalidNode> {
  if (!Boolean(ctx.options.deep)) {
    return [];
  }

  const typeReferenceType = checker.getTypeFromTypeNode(node);

  const invalidTypeReferenceNodesUsingNodeType =
    getInvalidTypeReferenceNodesUsingNodeType(
      node,
      typeReferenceType,
      ctx,
      checker,
      nodeToMark
    );

  if (invalidTypeReferenceNodesUsingNodeType.length > 0) {
    return invalidTypeReferenceNodesUsingNodeType;
  }

  const invalidTypeReferenceNodesUsingTypeAlias =
    getInvalidTypeReferenceNodesUsingTypeAlias(
      node,
      typeReferenceType,
      ctx,
      checker,
      nodeToMark
    );

  if (invalidTypeReferenceNodesUsingTypeAlias.length > 0) {
    return invalidTypeReferenceNodesUsingTypeAlias;
  }

  return [];
}

/**
 * Does the given type reference vialate this rule?
 * Checks against the node type.
 */
function getInvalidTypeReferenceNodesUsingNodeType(
  node: ts.TypeReferenceNode,
  nodeType: ts.Type,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  nodeToMark?: ts.Node
): Array<InvalidNode> {
  const typeReferenceTypeNode = checker.typeToTypeNode(nodeType);

  // This should never be undefined.
  // istanbul ignore next
  if (typeReferenceTypeNode === undefined) {
    return [];
  }

  if (ts.isTypeReferenceNode(typeReferenceTypeNode)) {
    return getInvalidTypeReferenceNodes(
      typeReferenceTypeNode,
      ctx,
      checker,
      failureMessageDeep,
      false,
      nodeToMark === undefined
      ? node
      : nodeToMark
    );
  }

  if (ts.isTupleTypeNode(typeReferenceTypeNode)) {
    return getInvalidTupleTypeNodes(
      typeReferenceTypeNode,
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
function getInvalidTypeReferenceNodesUsingTypeAlias(
  node: ts.TypeReferenceNode,
  nodeType: ts.Type,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  nodeToMark?: ts.Node
): Array<InvalidNode> {
  if (nodeType.aliasSymbol !== undefined) {
    return ([] as ReadonlyArray<InvalidNode>).concat(
      ...nodeType.aliasSymbol.declarations.map((declaration) =>
        (
          ts.isTypeAliasDeclaration(declaration) &&
          ts.isTypeLiteralNode(declaration.type)
        )
        ? getInvalidTypeLiteralNodes(
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

  return [];
}

/**
 * Does the given type literal vialate this rule?
 */
function getInvalidTypeLiteralNodes(
  node: ts.TypeLiteralNode,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  safeToReplace: boolean,
  nodeToMark?: ts.Node
): Array<InvalidNode> {
  return (
    ([] as ReadonlyArray<InvalidNode>).concat(
      ...node.members.map((member) =>
        ts.isPropertySignature(member)
        ? getInvalidPropertySignatureNodes(
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
function getInvalidTypeArgumentNodes(
  node: ts.TypeReferenceNode,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  failureMessage: string,
  safeToReplace: boolean,
  nodeToMark?: ts.Node
): Array<InvalidNode> {
  if (node.typeArguments === undefined) {
    return [];
  }

  return (
    ([] as ReadonlyArray<InvalidNode>).concat(
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
              getFixReplacement(safeToReplace, argument, readonlyArrayType, ctx)
            ),
            ...getInvalidTypeArgumentNodes(
              argument,
              ctx,
              checker,
              failureMessage,
              safeToReplace,
              nodeToMark
            )
          ];
        }

        return getInvalidTypeArgumentNodes(
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
function getFixReplacement(
  safeToReplace: boolean,
  invalidNode: ts.TypeReferenceNode,
  toReplace: string,
  ctx: Lint.WalkContext<RuleOptions>
): Array<Lint.Replacement> {
  return safeToReplace && invalidNode.pos >= 0
    ? [
        new Lint.Replacement(
          invalidNode.getStart(ctx.sourceFile),
          toReplace.length,
          'Array'
        )
      ]
    : [];
}
