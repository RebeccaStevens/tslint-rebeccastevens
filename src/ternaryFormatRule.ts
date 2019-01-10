/**
 * This rule ensure ternary operators are formated a certain way.
 */

import * as assert from 'assert';
import deepEqual from 'deep-equal';
import * as Lint from 'tslint';
import {
  isCallExpression,
  isConditionalExpression
} from 'tsutils/typeguard';
import { getLineRanges } from 'tsutils/util';
import ts from 'typescript';

import {
  createNodeRule,
  InvalidNodeResult,
  markAsInvalidNode,
  RuleFunctionResult
} from './common/nodeRuleHelpers';
import * as Options from './common/options';
import { getSiblingBefore } from './common/util';

type RuleOptions =
  & Options.AllowSingleLine;

interface ConditionalExpressionInfo {
  readonly condition: StartAndEndInfo;
  readonly questionToken: StartAndEndInfo;
  readonly whenTrue: StartAndEndInfo;
  readonly colonToken: StartAndEndInfo;
  readonly whenFalse: StartAndEndInfo;
}

interface IdealConditionalExpression {
  readonly condition: IdealPosition;
  readonly questionToken: IdealPosition;
  readonly whenTrue: IdealPosition;
  readonly colonToken: IdealPosition;
  readonly whenFalse: IdealPosition;
}

interface StartAndEndInfo {
  readonly start: ts.LineAndCharacter;
  readonly end: ts.LineAndCharacter;
}

interface IdealPosition {
  readonly leadingComment?: CommentInfo;
  readonly trailingComment?: CommentInfo;
  readonly position: StartAndEndInfo;
  readonly nested?: IdealConditionalExpression;
}

type CommentInfo  =
 | {
      readonly comment: string;
      readonly lines: number;
      readonly pos: number;
      readonly end: number;
      readonly hasTrailingNewLine: boolean;
    }
  | {
      readonly comment: undefined;
      readonly lines: 0;
      readonly pos: undefined;
      readonly end: undefined;
      readonly hasTrailingNewLine: false;
    };

/**
 * The possible branches.
 */
const enum Branch {
  True,
  False
}

const failureMessage = 'Incorrectly formatted ternary operator.';
const INDENTATION = '  ';

/**
 * The `ternary-format`.
 */
export const Rule = createNodeRule<RuleOptions>(ruleEntryPoint);

/**
 * Check this rule.
 */
function ruleEntryPoint(
  node: ts.Node,
  ctx: Lint.WalkContext<RuleOptions>
): RuleFunctionResult {
  if (!isConditionalExpression(node)) {
    return {
      invalidNodes: [],
      skipChildren: false
    };
  }

  const actual = getConditionalExpressionInfo(node);
  const ideal = getIdealConditionalExpression(node, ctx, actual);

  return {
    invalidNodes: compareIdealToActual(node, ideal, actual),
    skipChildren: true
  };
}

/**
 * Get the ideal conditional expression.
 */
function getIdealConditionalExpression(
  node: ts.ConditionalExpression,
  ctx: Lint.WalkContext<RuleOptions>,
  nodeInfo: ConditionalExpressionInfo,
  branch?: Branch,
  hasMixedParent: boolean = false
): IdealConditionalExpression {
  const trueFlowing = isConditionalExpression(node.whenTrue);
  const falseFlowing = isConditionalExpression(node.whenFalse);

  if (trueFlowing && falseFlowing) {
    return getIdealMixedFlowing(node, ctx, nodeInfo, branch, hasMixedParent);
  }

  if (trueFlowing && !falseFlowing) {
    return getIdealTrueFlowing(node, ctx, nodeInfo, branch, hasMixedParent);
  }

  if (!trueFlowing && falseFlowing) {
    return getIdealFalseFlowing(node, ctx, nodeInfo, branch, hasMixedParent);
  }

  return getIdealNonFlowing(node, ctx, nodeInfo, branch, hasMixedParent);
}

/**
 * Get the ideal conditional expression for a mixed-flowing ternary operator.
 */
function getIdealMixedFlowing(
  node: ts.ConditionalExpression,
  ctx: Lint.WalkContext<RuleOptions>,
  nodeInfo: ConditionalExpressionInfo,
  branch: Branch | undefined,
  hasMixedParent: boolean
): IdealConditionalExpression {
  const condition = getIdealConditionPosition(
    node.condition,
    nodeInfo.condition,
    branch === undefined,
    hasMixedParent ? INDENTATION.length : 0
  );

  const questionToken = getIdealTokenPosition(
    node.questionToken,
    condition.position.end.line,
    condition.position.start.character
  );

  const whenTrue = {
    ...getIdealBranchPosition(node.whenTrue, nodeInfo.whenTrue, questionToken.position.end),
    nested: getIdealConditionalExpression(
      node.whenTrue as ts.ConditionalExpression,
      ctx,
      getConditionalExpressionInfo(node.whenTrue as ts.ConditionalExpression),
      Branch.True,
      true
    )
  };

  const colonToken = getIdealTokenPosition(
    node.colonToken,
    whenTrue.position.end.line,
    condition.position.start.character
  );

  const whenFalse = {
    ...getIdealBranchPosition(node.whenFalse, nodeInfo.whenFalse, colonToken.position.end),
    nested: getIdealConditionalExpression(
      node.whenFalse as ts.ConditionalExpression,
      ctx,
      getConditionalExpressionInfo(node.whenFalse as ts.ConditionalExpression),
      Branch.False,
      true
    )
  };

  return {
    condition,
    questionToken,
    whenTrue,
    colonToken,
    whenFalse
  };
}

/**
 * Get the ideal conditional expression for a true-flowing ternary operator.
 */
function getIdealTrueFlowing(
  node: ts.ConditionalExpression,
  ctx: Lint.WalkContext<RuleOptions>,
  nodeInfo: ConditionalExpressionInfo,
  branch: Branch | undefined,
  hasMixedParent: boolean
): IdealConditionalExpression {
  const condition = getIdealConditionPosition(
    node.condition,
    nodeInfo.condition,
    branch === undefined,
    hasMixedParent ? 0 : INDENTATION.length
  );

  const questionToken = getIdealTokenPosition(
    node.questionToken,
    condition.position.end.line,
    condition.position.start.character,
    hasMixedParent ? 0 : -INDENTATION.length
  );

  const whenTrueNotTrueFlowing = getIdealBranchPosition(node.whenTrue, nodeInfo.whenTrue, questionToken.position.end);
  const whenTrue = {
    ...whenTrueNotTrueFlowing,
    position: {
      start: {
        line: whenTrueNotTrueFlowing.position.start.line,
        character: whenTrueNotTrueFlowing.position.start.character + INDENTATION.length
      },
      end: {
        line: whenTrueNotTrueFlowing.position.end.line,
        character:
          whenTrueNotTrueFlowing.position.end.character +
          (
            whenTrueNotTrueFlowing.position.end.line === whenTrueNotTrueFlowing.position.start.line
            ? INDENTATION.length
            : 0
          )
      }
    },
    nested: getIdealConditionalExpression(
      node.whenTrue  as ts.ConditionalExpression,
      ctx,
      getConditionalExpressionInfo(node.whenTrue  as ts.ConditionalExpression),
      Branch.True,
      hasMixedParent
    )
  };

  const colonToken = getIdealTokenPosition(
    node.colonToken,
    whenTrue.position.end.line,
    condition.position.start.character,
    hasMixedParent ? 0 : -INDENTATION.length
  );

  const whenFalse = getIdealBranchPosition(
    node.whenFalse,
    nodeInfo.whenFalse,
    colonToken.position.end
  );

  return {
    condition,
    questionToken,
    whenTrue,
    colonToken,
    whenFalse
  };
}

/**
 * Get the ideal conditional expression for a  false-flowing ternary operator.
 */
function getIdealFalseFlowing(
  node: ts.ConditionalExpression,
  ctx: Lint.WalkContext<RuleOptions>,
  nodeInfo: ConditionalExpressionInfo,
  branch: Branch | undefined,
  hasMixedParent: boolean
): IdealConditionalExpression {
  const condition = getIdealConditionPosition(
    node.condition,
    nodeInfo.condition,
    branch === undefined,
    INDENTATION.length
  );

  const questionToken = getIdealTokenPosition(
    node.questionToken,
    condition.position.end.line,
    condition.position.start.character,
    INDENTATION.length * (hasMixedParent ? 1 : -1)
  );

  const whenTrue = getIdealBranchPosition(
    node.whenTrue,
    nodeInfo.whenTrue,
    questionToken.position.end
  );

  const colonToken = getIdealTokenPosition(
    node.colonToken,
    whenTrue.position.end.line,
    condition.position.start.character,
    INDENTATION.length * (hasMixedParent ? 1 : -1)
  );

  const whenFalse = {
    ...getIdealBranchPosition(node.whenFalse, nodeInfo.whenFalse, colonToken.position.end),
    nested: getIdealConditionalExpression(
      node.whenFalse as ts.ConditionalExpression,
      ctx,
      getConditionalExpressionInfo(node.whenFalse as ts.ConditionalExpression),
      Branch.False,
      hasMixedParent
    )
  };

  return {
    condition,
    questionToken,
    whenTrue,
    colonToken,
    whenFalse
  };
}

/**
 * Get the ideal conditional expression for a non-flowing ternary operator.
 */
function getIdealNonFlowing(
  node: ts.ConditionalExpression,
  ctx: Lint.WalkContext<RuleOptions>,
  nodeInfo: ConditionalExpressionInfo,
  branch: Branch | undefined,
  hasMixedParent: boolean
): IdealConditionalExpression {
  if (branch === undefined && Boolean(ctx.options.allowSingleLine)) {
    const onSingleLine = nodeInfo.condition.start.line === nodeInfo.whenFalse.end.line;
    if (onSingleLine) {
      return conditionalExpressionInfoToIdealConditionalExpression(nodeInfo);
    }
  }

  const condition = getIdealConditionPosition(
    node.condition,
    nodeInfo.condition,
    branch === undefined,
    INDENTATION.length * (
        hasMixedParent
      ? 0
      : branch === Branch.True
      ? 2
      : branch === Branch.False
      ? 1
      : 0
    )
  );

  const questionToken = getIdealTokenPosition(
    node.questionToken,
    condition.position.end.line,
    condition.position.start.character,
    INDENTATION.length * (
        hasMixedParent
      ? 2
      : branch === undefined
      ? 1
      : branch === Branch.False
      ? -1
      : 0
    )
  );

  const whenTrue = getIdealBranchPosition(
    node.whenTrue,
    nodeInfo.whenTrue,
    questionToken.position.end
  );

  const colonToken = getIdealTokenPosition(
    node.colonToken,
    whenTrue.position.end.line,
    condition.position.start.character,
    INDENTATION.length * (
        hasMixedParent
      ? 2
      : branch === undefined
      ? 1
      : branch === Branch.False
      ? -1
      : 0
    )
  );

  const whenFalse = getIdealBranchPosition(
    node.whenFalse,
    nodeInfo.whenFalse,
    colonToken.position.end
  );

  return {
    condition,
    questionToken,
    whenTrue,
    colonToken,
    whenFalse
  };
}

/**
 * Compare the ideal format to the actual format.
 */
function compareIdealToActual(
  node: ts.ConditionalExpression,
  idealInfo: IdealConditionalExpression,
  actualPosition: ConditionalExpressionInfo,
  _branch?: Branch,
  hasMixedParent: boolean = false
): Array<InvalidNodeResult> {
  const isMixed =
    hasMixedParent ||
    (
      idealInfo.whenTrue.nested !== undefined &&
      idealInfo.whenFalse.nested !== undefined
    );

  const trueNestedInvalidNodes =
    idealInfo.whenTrue.nested === undefined
      ? []
      : compareIdealToActual(
          node.whenTrue as ts.ConditionalExpression,
          idealInfo.whenTrue.nested,
          getConditionalExpressionInfo(node.whenTrue as ts.ConditionalExpression),
          Branch.True,
          isMixed
        );

  const falseNestedInvalidNodes =
    idealInfo.whenFalse.nested === undefined
      ? []
      : compareIdealToActual(
          node.whenFalse as ts.ConditionalExpression,
          idealInfo.whenFalse.nested,
          getConditionalExpressionInfo(node.whenFalse as ts.ConditionalExpression),
          Branch.False,
          isMixed
        );

  if (
    deepEqual(
      {
        condition: idealInfo.condition.position,
        questionToken: idealInfo.questionToken.position,
        whenTrue: idealInfo.whenTrue.position,
        colonToken: idealInfo.colonToken.position,
        whenFalse: idealInfo.whenFalse.position
      },
      actualPosition,
      { strict: true }
    )
  ) {
    return [
      ...trueNestedInvalidNodes,
      ...falseNestedInvalidNodes
    ];
  }

  const idealCode = getIdealCode(
    node,
    actualPosition,
    idealInfo
  );

  // console.log(node.getText());
  // console.log(JSON.stringify({
  //   actual: actualPosition,
  //   ideal: {
  //     condition: idealInfo.condition.position,
  //     questionToken: idealInfo.questionToken.position,
  //     whenTrue: idealInfo.whenTrue.position,
  //     colonToken: idealInfo.colonToken.position,
  //     whenFalse: idealInfo.whenFalse.position
  //   }
  // }, undefined, 2));

  return [
    markAsInvalidNode(
      node,
      failureMessage,
      [
        new Lint.Replacement(
          node.getStart(),
          node.getWidth(),
          idealCode
        )
      ]
    )
  ];
}

/**
 * Get the ideal position for the condition.
 */
function getIdealConditionPosition(
  node: ts.Expression,
  info: StartAndEndInfo,
  insertLeadingNewLine: boolean,
  indentOffset: number = 0
): IdealPosition {
  const siblingBefore = getSiblingBefore(node.parent);

  const conditionOnSameLineAsPreviousSibling =
    siblingBefore === undefined
      ? false
      : isOnLine(siblingBefore, info.start.line);

  const {
    hasTrailingNewLine: leadingCommentHasTrailingNewLine
  } = getLeadingCommentInfo(node);

  const trailingComment = getTrailingCommentInfo(node);

  const siblingIndent = getIndentationOfLine(
    info.start.line - (conditionOnSameLineAsPreviousSibling ? 0 : 1),
    node.getSourceFile()
  );

  const indentAmount =
    indentOffset +
    (
      siblingIndent + (
        insertLeadingNewLine && !(
          leadingCommentHasTrailingNewLine ||
          (
            // Ternaries in call expressions should not be indented more than
            // the previous line unless it is the first argument.
            !conditionOnSameLineAsPreviousSibling &&
            isCallExpression(node.parent.parent) &&
            node.parent.parent.arguments[0] !== node.parent
          )
        )
          ? INDENTATION.length
          : 0
      )
    );

  const lineOffset =
    conditionOnSameLineAsPreviousSibling && insertLeadingNewLine
      ? 1
      : 0;

  return {
    trailingComment,
    position: {
      start: {
        line: info.start.line + lineOffset,
        character: indentAmount
      },
      end: {
        line: info.end.line + lineOffset,
        character: indentAmount + info.end.character - info.start.character
      }
    }
  };
}

/**
 * Get the ideal position for the question/colon token.
 */
function getIdealTokenPosition(
  node: ts.Token<ts.SyntaxKind.QuestionToken> | ts.Token<ts.SyntaxKind.ColonToken>,
  previousLine: number,
  conditionIndentation: number,
  indentOffset: number = 0
): IdealPosition {
  const leadingComment = getLeadingCommentInfo(node);

  const trailingComment = getTrailingCommentInfo(node);

  return {
    leadingComment,
    trailingComment,
    position: {
      start: {
        line: previousLine + leadingComment.lines + 1,
        character: conditionIndentation + indentOffset
      },
      end: {
        line: previousLine + leadingComment.lines + 1,
        character: conditionIndentation + indentOffset + 1
      }
    }
  };
}

/**
 * Get the ideal position for a branch.
 */
function getIdealBranchPosition(
  node: ts.Expression,
  info: StartAndEndInfo,
  tokenPosition: ts.LineAndCharacter,
  indentOffset: number = 0
): IdealPosition {
  const lineCount = (info.end.line - info.start.line) + 1;
  const leadingComment = getLeadingCommentInfo(node);
  const trailingComment = getTrailingCommentInfo(node);

  return {
    leadingComment,
    trailingComment,
    position: {
      start: {
        line: tokenPosition.line,
        character: tokenPosition.character + indentOffset + 1
      },
      end: {
        line: tokenPosition.line + leadingComment.lines + lineCount - 1,
        character:
          lineCount === 1
            ? (
                indentOffset +
                tokenPosition.character +
                info.end.character -
                info.start.character +
                1
              )
            : info.end.character
      }
    }
  };
}

/**
 * Get the line and character information for the given node.
 */
function getConditionalExpressionInfo(
  node: ts.ConditionalExpression
): ConditionalExpressionInfo {
  return {
    condition: getStartAndEndInfo(node.condition),
    questionToken: getStartAndEndInfo(node.questionToken),
    whenTrue: getStartAndEndInfo(node.whenTrue),
    colonToken: getStartAndEndInfo(node.colonToken),
    whenFalse: getStartAndEndInfo(node.whenFalse)
  };
}

/**
 * Returns whether or not the given node is on the given line.
 */
function isOnLine(
  node: ts.Node,
  lineNumber: number
): boolean {
  const nodeInfo = getStartAndEndInfo(node);

  return nodeInfo.end.line === lineNumber;
}

/**
 * Get the position for the given node.
 */
function getStartAndEndInfo(node: ts.Node): StartAndEndInfo  {
  const sourceFile = node.getSourceFile();

  return ({
    start: ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()),
    end: ts.getLineAndCharacterOfPosition(sourceFile, node.getEnd())
  });
}

/**
 * Get the indentation of the given line.
 */
function getIndentationOfLine(
  lineNumber: number,
  sourceFile: ts.SourceFile
): number {
  const lineRanges = getLineRanges(sourceFile);

  if (lineNumber >= lineRanges.length || lineNumber < 0) {
    return 0;
  }

  const lineRange = lineRanges[lineNumber];
  const line = sourceFile.text.substring(lineRange.pos, lineRange.pos + lineRange.contentLength);
  const indentEnd = line.search(/\S/);

  return (
    indentEnd === -1
      ? 0
      : indentEnd
  );
}

/**
 * Get the comment leading the given node.
 */
function getLeadingCommentInfo(node: ts.Node): CommentInfo {
  const sourceFile = node.getSourceFile();

  return getCommentInfo(
    ts.getLeadingCommentRanges(sourceFile.text, node.getFullStart()),
    sourceFile
  );
}

/**
 * Get the comment trailing the given node.
 */
function getTrailingCommentInfo(node: ts.Node): CommentInfo {
  const sourceFile = node.getSourceFile();

  return getCommentInfo(
    ts.getTrailingCommentRanges(sourceFile.text, node.getEnd()),
    sourceFile
  );
}

/**
 * Get the comment info from the given range.
 */
function getCommentInfo(
  range: ReadonlyArray<ts.CommentRange> | undefined,
  sourceFile: ts.SourceFile
): CommentInfo {
  if (range === undefined || range.length === 0) {
    return {
      comment: undefined,
      lines: 0,
      pos: undefined,
      end: undefined,
      hasTrailingNewLine: false
    };
  }

  const hasTrailingNewLine = Boolean(range[range.length - 1].hasTrailingNewLine);

  const comment = sourceFile.text.substring(
      range[0].pos,
      range[range.length - 1].end
    ) + (hasTrailingNewLine ? '\n' : '');

  const lines = range.length - 1 + (hasTrailingNewLine ? 1 : 0);

  return {
    comment,
    lines,
    pos: range[0].pos,
    end: range[range.length - 1].end,
    hasTrailingNewLine
  };
}

/**
 * Create an IdealConditionalExpression from a ConditionalExpressionInfo.
 */
function conditionalExpressionInfoToIdealConditionalExpression(
  conditionalExpressionInfo: ConditionalExpressionInfo
): IdealConditionalExpression {
  return {
    condition: {
      position: conditionalExpressionInfo.condition
    },
    questionToken: {
      position: conditionalExpressionInfo.questionToken
    },
    whenTrue: {
      position: conditionalExpressionInfo.whenTrue
    },
    colonToken: {
      position: conditionalExpressionInfo.colonToken
    },
    whenFalse: {
      position: conditionalExpressionInfo.whenFalse
    }
  };
}

/**
 * Format the given code.
 */
function formatCode(
  code: string | ReadonlyArray<InvalidNodeResult>,
  indent: number
): string {
  if (typeof code === 'string') {
    return `${' '.repeat(indent)}${code}`;
  }

  assert.strictEqual(code.length, 1);
  assert.strictEqual(code[0].replacements.length, 1);

  return (
    ' '.repeat(indent) +
    code[0].replacements[0].text
  );
}

/**
 * Format the given comment.
 */
function formatComment(
  commentInfo: CommentInfo | undefined,
  indent: number,
  insertTrailingNewLine?: boolean
): string {
  return (
    commentInfo === undefined || commentInfo.comment === undefined
      ? ''
      : ' '.repeat(indent) +
        commentInfo.comment.trim() +
        (
          insertTrailingNewLine === true ||
          (insertTrailingNewLine === undefined && commentInfo.hasTrailingNewLine)
            ? '\n'
            : ''
          )
  );
}

interface IdealCode {
  readonly code: string;
  readonly info: {
    readonly line: number;
    readonly endLine: number;
    readonly startCharacter: number;
    readonly endCharacter: number;
    readonly unInsertedComments: ReadonlyArray<CommentInfo>;
  };
}

/**
 * Get the ideal code from the ideal info.
 */
function getIdealCode(
  node: ts.ConditionalExpression,
  originalInfo: ConditionalExpressionInfo,
  idealInfo: IdealConditionalExpression
): string {
  const idealConditionCode = getIdealCodePartial(
    node.condition,
    originalInfo.condition,
    idealInfo.condition,
    {
      line: originalInfo.condition.start.line,
      endLine: originalInfo.condition.start.line,
      startCharacter: originalInfo.condition.start.character,
      endCharacter: originalInfo.condition.start.character,
      unInsertedComments: []
    }
  );
  const idealQuestionTokenCode = getIdealCodePartial(
    node.questionToken,
    originalInfo.questionToken,
    idealInfo.questionToken,
    idealConditionCode.info
  );
  const idealTrueBranchCode = getIdealCodePartial(
    node.whenTrue,
    originalInfo.whenTrue,
    idealInfo.whenTrue,
    idealQuestionTokenCode.info
  );
  const idealColonTokenCode = getIdealCodePartial(
    node.colonToken,
    originalInfo.colonToken,
    idealInfo.colonToken,
    idealTrueBranchCode.info
  );
  const idealFalseBranchCode = getIdealCodePartial(
    node.whenFalse,
    originalInfo.whenFalse,
    idealInfo.whenFalse,
    idealColonTokenCode.info
  );

  console.log(
    `"${idealConditionCode.code
    }${idealQuestionTokenCode.code
    }${idealTrueBranchCode.code
    }${idealColonTokenCode.code
    }${idealFalseBranchCode.code}"`.replace(/\n/g, '↲\n')
  );

  return (
    `${idealConditionCode.code
    }${idealQuestionTokenCode.code
    }${idealTrueBranchCode.code
    }${idealColonTokenCode.code
    }${idealFalseBranchCode.code}`
  );
}

/**
 * Get the ideal code.
 */
function getIdealCodePartial(
  node: ts.Expression | ts.Token<ts.SyntaxKind.QuestionToken | ts.SyntaxKind.ColonToken>,
  _originalInfo: StartAndEndInfo,
  idealInfo: IdealPosition,
  previousPartialInfo: IdealCode['info']
): IdealCode {
  const linesToInsertAbove =
    idealInfo.position.start.line < previousPartialInfo.line
      ? 0
      : idealInfo.position.start.line - previousPartialInfo.line;

  const startLine =
    previousPartialInfo.endLine +
    linesToInsertAbove;

  const spacesToInsertBefore =
    Math.max(
      startLine === previousPartialInfo.endLine
        ? idealInfo.position.start.character > previousPartialInfo.endCharacter
          ? idealInfo.position.start.character - previousPartialInfo.endCharacter
          : previousPartialInfo.startCharacter + INDENTATION.length
        : linesToInsertAbove > 0
          ? idealInfo.position.start.character
          : 0,
      0
    );
  // if (onSameLine) {
  console.log(idealInfo.position.start.character, previousPartialInfo.endCharacter);
  // }
  const leadingComment = formatComment(idealInfo.leadingComment, spacesToInsertBefore, true);
  const leadingCommentNewLines = leadingComment.match(/\n/g);
  const leadingCommentNewLineCount =
    leadingCommentNewLines === null
      ? 0
      : leadingCommentNewLines.length;

  const trailingComment = formatComment(idealInfo.trailingComment, 1, true);
  const trailingCommentNewLines = trailingComment.match(/\n/g);
  const trailingCommentNewLineCount =
    trailingCommentNewLines === null
      ? 0
      : trailingCommentNewLines.length;

  const endLine =
    startLine +
    (idealInfo.position.end.line - idealInfo.position.start.line) +
    leadingCommentNewLineCount;

  const unInsertedComments =
    (
      linesToInsertAbove > 0
        ? []
        : previousPartialInfo.unInsertedComments
    ).concat(
      idealInfo.trailingComment === undefined
        ? []
        : [idealInfo.trailingComment]
    );

  const extraLinesToInsertAbove =
    Math.max(
      linesToInsertAbove -
      (leadingCommentNewLineCount > 0 ? 1 : 0),
      0
    );

  const line =
    previousPartialInfo.line +
    extraLinesToInsertAbove +
    trailingCommentNewLineCount +
    (endLine - startLine);

  return {
    code: `${'\n'.repeat(extraLinesToInsertAbove)
          }${leadingComment
          }${formatCode(node.getText(), spacesToInsertBefore)
          }${trailingComment}`,
    info: {
      line,
      endLine,
      startCharacter: idealInfo.position.start.character,
      endCharacter: idealInfo.position.end.character,
      unInsertedComments
    }
  };
}
