/**
 * This rule ensure ternary operators are formated a certain way.
 */

import * as Lint from 'tslint';
import * as ts from 'typescript';

import deepEqual from 'deep-equal';
import {
  isCallExpression,
  isConditionalExpression
} from 'tsutils/typeguard';
import { getLineRanges } from 'tsutils/util';

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
  readonly leadingComment?: string;
  readonly trailingComment?: string;
  readonly position: StartAndEndInfo;
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

  const nodeInfo = getLineAndCharacterInfo(node);
  const trueFlowing = isConditionalExpression(node.whenTrue);
  const falseFlowing = isConditionalExpression(node.whenFalse);

  if (trueFlowing && falseFlowing) {
    return {
      invalidNodes: checkMixedNested(node, ctx, nodeInfo),
      skipChildren: true
    };
  }

  if (trueFlowing && !falseFlowing) {
    return {
      invalidNodes: checkTrueFlowingNested(node, ctx, nodeInfo),
      skipChildren: true
    };
  }

  if (!trueFlowing && falseFlowing) {
    return {
      invalidNodes: checkFalseFlowingNested(node, ctx, nodeInfo),
      skipChildren: true
    };
  }

  return {
    invalidNodes: checkNonNested(node, ctx, nodeInfo),
    skipChildren: true
  };
}

/**
 * Check a non nested ternary operator.
 */
function checkMixedNested(
  _node: ts.ConditionalExpression,
  _ctx: Lint.WalkContext<RuleOptions>,
  _nodeInfo: ConditionalExpressionInfo
): Array<InvalidNodeResult> {
  // TODO: Implement.
  // BODY: Implement mixed nested case.
  return [];
}

/**
 * Check a non nested ternary operator.
 */
function checkTrueFlowingNested(
  _node: ts.ConditionalExpression,
  _ctx: Lint.WalkContext<RuleOptions>,
  _nodeInfo: ConditionalExpressionInfo
): Array<InvalidNodeResult> {
  // TODO: Implement.
  // BODY: Implement true flowing nested case.
  return [];
}

/**
 * Check a non nested ternary operator.
 */
function checkFalseFlowingNested(
  _node: ts.ConditionalExpression,
  _ctx: Lint.WalkContext<RuleOptions>,
  _nodeInfo: ConditionalExpressionInfo
): Array<InvalidNodeResult> {
  // TODO: Implement.
  // BODY: Implement false flowing nested case.
  return [];
}

/**
 * Check a non nested ternary operator.
 */
function checkNonNested(
  node: ts.ConditionalExpression,
  ctx: Lint.WalkContext<RuleOptions>,
  nodeInfo: ConditionalExpressionInfo
): Array<InvalidNodeResult> {
  if (Boolean(ctx.options.allowSingleLine)) {
    const onSingleLine = nodeInfo.condition.start.line === nodeInfo.whenFalse.end.line;
    if (onSingleLine) {
      return [];
    }
  }

  const condition = getIdealNonNestedConditionPosition(
    node,
    node.condition,
    nodeInfo.condition
  );

  const questionToken = getIdealNonNestedTokenPosition(
    node.questionToken,
    condition.position.end.line,
    condition.position.start.character
  );

  const whenTrue = getIdealNonNestedBranchPosition(
    node.whenTrue,
    nodeInfo.whenTrue,
    questionToken.position.end
  );

  const colonToken = getIdealNonNestedTokenPosition(
    node.colonToken,
    whenTrue.position.end.line,
    condition.position.start.character
  );

  const whenFalse = getIdealNonNestedBranchPosition(
    node.whenFalse,
    nodeInfo.whenFalse,
    colonToken.position.end
  );

  return compareIdealToActual(
    node,
    {
      condition,
      questionToken,
      whenTrue,
      colonToken,
      whenFalse
    },
    nodeInfo
  );
}

/**
 * Compare the ideal format to the actual format.
 */
function compareIdealToActual(
  node: ts.ConditionalExpression,
  idealInfo: IdealConditionalExpression,
  actualPosition: ConditionalExpressionInfo
): Array<InvalidNodeResult> {
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
    return [];
  }

  const conditionLinesAbove =
    idealInfo.condition.position.start.line - actualPosition.condition.end.line;
  const conditionSpacesBefore =
    conditionLinesAbove > 0 ? idealInfo.condition.position.start.character : 0;

  const questionTokenLinesAbove =
    idealInfo.questionToken.position.start.line - idealInfo.condition.position.end.line;
  const questionTokenSpacesBefore =
    idealInfo.questionToken.position.start.character -
    (questionTokenLinesAbove === 0 ? conditionSpacesBefore + 1 : 0);

  const colonTokenLinesAbove =
    idealInfo.colonToken.position.start.line - idealInfo.whenTrue.position.end.line;
  const colonTokenSpacesBefore =
    idealInfo.colonToken.position.start.character - (colonTokenLinesAbove === 0 ? INDENTATION.length : 0);

  const formatCode = (
    code: string,
    indent: number
  ): string => {
    return (
      ' '.repeat(indent) + code
    );
  };

  const formatComment = (
    comment: string | undefined,
    indent: number = 1,
    trailingNewLine: boolean = false
  ): string => {
    return (
      comment === undefined
        ? ''
        : (
          ' '.repeat(indent) + comment.trim() + (trailingNewLine ? '\n' : '')
        )
    );
  };

  return [
    markAsInvalidNode(
      node,
      failureMessage, [
      new Lint.Replacement(
        node.getStart(),
        node.getWidth(),
        (
          `${'\n'.repeat(conditionLinesAbove)
          }${formatCode(node.condition.getText(), conditionSpacesBefore)
          }${formatComment(idealInfo.condition.trailingComment)

          }${'\n'
          }${formatComment(idealInfo.questionToken.leadingComment, questionTokenSpacesBefore, true)
          }${formatCode(node.questionToken.getText(), questionTokenSpacesBefore)

          }${formatCode(node.whenTrue.getText(), 1)
          }${formatComment(idealInfo.questionToken.trailingComment)
          }${formatComment(idealInfo.whenTrue.leadingComment)
          }${formatComment(idealInfo.whenTrue.trailingComment)

          }${'\n'
          }${formatComment(idealInfo.colonToken.leadingComment, colonTokenSpacesBefore, true)
          }${formatCode(node.colonToken.getText(), colonTokenSpacesBefore)

          }${formatCode(node.whenFalse.getText(), 1)
          }${formatComment(idealInfo.colonToken.trailingComment)
          }${formatComment(idealInfo.whenFalse.leadingComment)}`
        )
      )
    ])
  ];
}

/**
 * Get the ideal position for the condition when non-nested.
 */
function getIdealNonNestedConditionPosition(
  conditionalExpression: ts.ConditionalExpression,
  node: ts.Expression,
  info: StartAndEndInfo
): IdealPosition {
  const siblingBefore = getSiblingBefore(conditionalExpression);

  const conditionOnSameLineAsPreviousSibling =
    siblingBefore === undefined
      ? false
      : isOnLine(siblingBefore, info.start.line);

  const {
    hasTrailingNewLine: leadingCommentHasTrailingNewLine
  } = getLeadingCommentInfo(node);

  const {
    comment: trailingComment
  } = getTrailingCommentInfo(node);

  const needsIndentation = !(
    leadingCommentHasTrailingNewLine ||
    (
      // Ternaries in call expressions should not be indented more than the previous
      // line unless it is the first argument.
      !conditionOnSameLineAsPreviousSibling &&
      isCallExpression(conditionalExpression.parent) &&
      conditionalExpression.parent.arguments[0] !== conditionalExpression
    )
  );

  const indentAmount = getIndentationOfLine(
    info.start.line - (conditionOnSameLineAsPreviousSibling ? 0 : 1),
    node.getSourceFile()
  ) + (
    needsIndentation
      ? INDENTATION.length
      : 0
  );

  return {
    trailingComment,
    position: {
      start: {
        line: info.start.line + (conditionOnSameLineAsPreviousSibling ? 1 : 0),
        character: indentAmount
      },
      end: {
        line: info.end.line + (conditionOnSameLineAsPreviousSibling ? 1 : 0),
        character: indentAmount + info.end.character - info.start.character
      }
    }
  };
}

/**
 * Get the ideal position for the question/colon token when non-nested.
 */
function getIdealNonNestedTokenPosition(
  node: ts.Token<ts.SyntaxKind.QuestionToken> | ts.Token<ts.SyntaxKind.ColonToken>,
  previousLine: number,
  conditionIndentation: number
): IdealPosition {
  const {
    comment: leadingComment,
    lines: leadingCommentLines
  } = getLeadingCommentInfo(node);

  const {
    comment: trailingComment
  } = getTrailingCommentInfo(node);

  return {
    leadingComment,
    trailingComment,
    position: {
      start: {
        line: previousLine + leadingCommentLines + 1,
        character: conditionIndentation + INDENTATION.length
      },
      end: {
        line: previousLine + leadingCommentLines + 1,
        character: conditionIndentation + INDENTATION.length + 1
      }
    }
  };
}

/**
 * Get the ideal position for a branch when non-nested.
 */
function getIdealNonNestedBranchPosition(
  node: ts.Expression,
  info: StartAndEndInfo,
  tokenPosition: ts.LineAndCharacter
): IdealPosition {
  const lineCount = (info.end.line - info.start.line) + 1;

  const {
    comment: leadingComment,
    lines: leadingCommentLines
  } = getLeadingCommentInfo(node);

  const {
    comment: trailingComment
  } = getTrailingCommentInfo(node);

  return {
    leadingComment,
    trailingComment,
    position: {
      start: {
        line: tokenPosition.line,
        character: tokenPosition.character + leadingCommentLines + 1
      },
      end: {
        line: tokenPosition.line + leadingCommentLines + lineCount - 1,
        character:
          lineCount === 1
            ? (
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
function getLineAndCharacterInfo(
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
