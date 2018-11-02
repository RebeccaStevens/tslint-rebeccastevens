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
  markAsInvalidNode,
  TsSyntaxFunction,
  TsSyntaxFunctionTyped
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
  if (!(
    node.kind === ts.SyntaxKind.FunctionDeclaration ||
    node.kind === ts.SyntaxKind.FunctionExpression ||
    node.kind === ts.SyntaxKind.ArrowFunction
  )) {
    return [];
  }
  const func = node as TsSyntaxFunction;

  if (func.type === undefined) {
    return [];
  }
  const typedFunction = func as TsSyntaxFunctionTyped;

  if (typedFunction.type.kind === ts.SyntaxKind.TypeReference) {
    const invalidTypeReferenceNodes =
      getInvalidTypeReferenceNodes(
        typedFunction.type as ts.TypeReferenceNode,
        ctx,
        checker,
        failureMessageDefault
      );

    if (invalidTypeReferenceNodes.length > 0) {
      return invalidTypeReferenceNodes;
    }
  }

  if (Boolean(ctx.options.deep)) {
    const deepInvalidNodes =
      getDeepInvalidNodes(node, ctx, checker, typedFunction);

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
  _node: ts.Node,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  typedFunction: TsSyntaxFunctionTyped
): Array<InvalidNode> {
  if (typedFunction.type.kind === ts.SyntaxKind.TypeLiteral) {
    const invalidTypeLiteralNodes = getInvalidTypeLiteralNodes(
      typedFunction.type as ts.TypeLiteralNode,
      ctx,
      checker
    );

    if (invalidTypeLiteralNodes.length > 0) {
      return invalidTypeLiteralNodes;
    }
  }

  if (typedFunction.type.kind === ts.SyntaxKind.TupleType) {
    const invalidTupleTypeNodes = getInvalidTupleTypeNodes(
      typedFunction.type as ts.TupleTypeNode,
      ctx,
      checker
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
  propertySignature: ts.PropertySignature,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  nodeToMark?: ts.Node
): Array<InvalidNode> {
  if (propertySignature.type === undefined) {
    return [];
  }

  switch (propertySignature.type.kind) {
    case ts.SyntaxKind.TypeReference:
      return getInvalidTypeReferenceNodes(
        propertySignature.type as ts.TypeReferenceNode,
        ctx,
        checker,
        failureMessageDeep,
        nodeToMark
      );

    case ts.SyntaxKind.TypeLiteral:
      return getInvalidTypeLiteralNodes(
        propertySignature.type as ts.TypeLiteralNode,
        ctx,
        checker,
        nodeToMark
      );

    case ts.SyntaxKind.TupleType:
      return getInvalidTupleTypeNodes(
        propertySignature.type as ts.TupleTypeNode,
        ctx,
        checker,
        nodeToMark
      );

    default:
      return [];
  }
}

/**
 * Does the given tuple vialate this rule?
 */
function getInvalidTupleTypeNodes(
  tuple: ts.TupleTypeNode,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
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
      ...tuple.elementTypes.map((element) => {
        switch (element.kind) {
          case ts.SyntaxKind.TypeReference:
            return getInvalidTypeReferenceNodes(
              element as ts.TypeReferenceNode,
              ctx,
              checker,
              failureMessageDeep,
              nodeToMark
            );

          case ts.SyntaxKind.TypeLiteral:
            return getInvalidTypeLiteralNodes(
              element as ts.TypeLiteralNode,
              ctx,
              checker,
              nodeToMark
            );

          case ts.SyntaxKind.TupleType:
            return getInvalidTupleTypeNodes(
              element as ts.TupleTypeNode,
              ctx,
              checker,
              nodeToMark
            );

          default:
            return [];
        }
      })
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
  typeReference: ts.TypeReferenceNode,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  failureMessage: string,
  nodeToMark?: ts.Node
): Array<InvalidNode> {
  if (typeReference.typeName.kind === ts.SyntaxKind.Identifier) {
    if (typeReference.typeName.text === 'ReadonlyArray') {
      return [
        markAsInvalidNode(
          nodeToMark === undefined
          ? typeReference
          : nodeToMark,
          failureMessage
        )
      ];
    }

    if (Boolean(ctx.options.includeTypeArguments)) {
      const invalidTypeArgumentNodes = getInvalidTypeArgumentNodes(
        typeReference,
        checker,
        failureMessageType,
        nodeToMark
      );

      if (invalidTypeArgumentNodes.length > 0) {
        return invalidTypeArgumentNodes;
      }
    }

    return getInvalidTypeReferenceNodesWithTypeChecking(
      typeReference,
      ctx,
      checker,
      nodeToMark
    );
  }

  return [];
}

/**
 * Does the given type reference vialate this rule?
 * (uses typechecking)
 */
function getInvalidTypeReferenceNodesWithTypeChecking(
  typeReference: ts.TypeReferenceNode,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  nodeToMark?: ts.Node
): Array<InvalidNode> {
  if (!Boolean(ctx.options.deep)) {
    return [];
  }

  const typeReferenceType = checker.getTypeFromTypeNode(typeReference);

  const invalidTypeReferenceNodesUsingNodeType =
    getInvalidTypeReferenceNodesUsingNodeType(
      typeReference,
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
      typeReference,
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
  typeReference: ts.TypeReferenceNode,
  typeReferenceType: ts.Type,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  nodeToMark?: ts.Node
): Array<InvalidNode> {
  const typeReferenceTypeNode = checker.typeToTypeNode(typeReferenceType);

  if (typeReferenceTypeNode !== undefined) {
    switch (typeReferenceTypeNode.kind) {
      case ts.SyntaxKind.TypeReference:
        return getInvalidTypeReferenceNodes(
          typeReferenceTypeNode as ts.TypeReferenceNode,
          ctx,
          checker,
          failureMessageDeep,
          nodeToMark === undefined
          ? typeReference
          : nodeToMark
        );

      case ts.SyntaxKind.TypeLiteral:
        return getInvalidTypeLiteralNodes(
          typeReferenceTypeNode as ts.TypeLiteralNode,
          ctx,
          checker,
          nodeToMark === undefined
          ? typeReference
          : nodeToMark
        );

      case ts.SyntaxKind.TupleType:
        return getInvalidTupleTypeNodes(
          typeReferenceTypeNode as ts.TupleTypeNode,
          ctx,
          checker,
          nodeToMark === undefined
          ? typeReference
          : nodeToMark
        );

      default:
        return [];
    }
  }

  return [];
}

/**
 * Does the given type reference vialate this rule?
 * Checks against the type alias.
 */
function getInvalidTypeReferenceNodesUsingTypeAlias(
  typeReference: ts.TypeReferenceNode,
  typeReferenceType: ts.Type,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  nodeToMark?: ts.Node
): Array<InvalidNode> {
  if (typeReferenceType.aliasSymbol !== undefined) {
    return ([] as ReadonlyArray<InvalidNode>).concat(
      ...typeReferenceType.aliasSymbol.declarations.map((declaration) => {
        if (declaration.kind === ts.SyntaxKind.TypeAliasDeclaration) {
          const typeAliasDeclaration = declaration as ts.TypeAliasDeclaration;

          switch (typeAliasDeclaration.type.kind) {
            case ts.SyntaxKind.TypeLiteral:
              return getInvalidTypeLiteralNodes(
                typeAliasDeclaration.type as ts.TypeLiteralNode,
                ctx,
                checker,
                nodeToMark === undefined
                ? typeReference
                : nodeToMark
              );

            default:
              return [];
          }
        }
        return [];
      })
    );
  }

  return [];
}

/**
 * Does the given type literal vialate this rule?
 */
function getInvalidTypeLiteralNodes(
  typeLiteral: ts.TypeLiteralNode,
  ctx: Lint.WalkContext<RuleOptions>,
  checker: ts.TypeChecker,
  nodeToMark?: ts.Node
): Array<InvalidNode> {
  return (
    ([] as ReadonlyArray<InvalidNode>).concat(
      ...typeLiteral.members.map((member) => {
        switch (member.kind) {
          case ts.SyntaxKind.PropertySignature:
            return getInvalidPropertySignatureNodes(
              member as ts.PropertySignature,
              ctx,
              checker,
              nodeToMark
            );

          default:
            return [];
        }
      })
    )
  );
}

/**
 * Get the invalid nodes within the given type reference.
 */
function getInvalidTypeArgumentNodes(
  typeReference: ts.TypeReferenceNode,
  checker: ts.TypeChecker,
  failureMessage: string,
  nodeToMark?: ts.Node
): Array<InvalidNode> {
  if (typeReference.typeArguments === undefined) {
    return [];
  }

  return (
    ([] as ReadonlyArray<InvalidNode>).concat(
      ...typeReference.typeArguments.map((argument) => {
        if (argument.kind !== ts.SyntaxKind.TypeReference) {
          return [];
        }

        const typeReferenceArgument = argument as ts.TypeReferenceNode;

        if (
          typeReferenceArgument.typeName.kind === ts.SyntaxKind.Identifier &&
          typeReferenceArgument.typeName.text === 'ReadonlyArray'
        ) {
          return [
            markAsInvalidNode(
              nodeToMark === undefined
              ? typeReferenceArgument
              : nodeToMark,
              failureMessage
            ),
            ...getInvalidTypeArgumentNodes(
              typeReferenceArgument,
              checker,
              failureMessage,
              nodeToMark
            )
          ];
        }

        return getInvalidTypeArgumentNodes(
          typeReferenceArgument,
          checker,
          failureMessage,
          nodeToMark
        );
      })
    )
  );
}
