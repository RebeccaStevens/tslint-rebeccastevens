/**
 * This rule ensure ternary operators are formated a certain way.
 */

import * as Lint from 'tslint';
import * as ts from 'typescript';

import deepEqual from 'deep-equal';
import { isConditionalExpression } from 'tsutils/typeguard';
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

interface StartAndEndInfo {
  readonly start: ts.LineAndCharacter;
  readonly end: ts.LineAndCharacter;
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
  if (isConditionalExpression(node)) {
    const nodeInfo = getLineAndCharacterInfo(node, ctx.sourceFile);
    const trueFlowing = isConditionalExpression(node.whenTrue);
    const falseFlowing = isConditionalExpression(node.whenFalse);

    if (!trueFlowing && !falseFlowing) {
      return {
        invalidNodes: checkNonNested(node, ctx, nodeInfo),
        skipChildren: true
      };
    }

    return {
      invalidNodes: [],
      skipChildren: true
    };
  }

  return {
    invalidNodes: [],
    skipChildren: false
  };
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

  const condition = getIdealConditionPosition(
    node,
    ctx.sourceFile,
    nodeInfo.condition
  );

  const questionToken = getIdealTokenPosition(
    condition.end.line,
    condition.start.character
  );

  const whenTrue = getIdealBranchPosition(
    nodeInfo.whenTrue,
    questionToken.end
  );

  const colonToken = getIdealTokenPosition(
    whenTrue.end.line,
    condition.start.character
  );

  const whenFalse = getIdealBranchPosition(
    nodeInfo.whenFalse,
    colonToken.end
  );

  return compareIdealToActual(
    node,
    ctx.sourceFile,
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
  sourceFile: ts.SourceFile,
  ideal: ConditionalExpressionInfo,
  actual: ConditionalExpressionInfo
): Array<InvalidNodeResult> {
  if (deepEqual(ideal, actual, { strict: true })) {
    return [];
  }

  const conditionLinesAbove = ideal.condition.start.line - actual.condition.end.line;
  const conditionSpacesBefore = conditionLinesAbove > 0 ? ideal.condition.start.character : 0;
  const questionTokenLinesAbove = ideal.questionToken.start.line - ideal.condition.end.line;
  const questionTokenSpacesBefore = ideal.questionToken.start.character - (questionTokenLinesAbove === 0 ? conditionSpacesBefore + 1 : 0);
  const whenTrueLinesAbove = ideal.whenTrue.start.line - ideal.questionToken.end.line;
  const whenTrueSpacesBefore = ideal.whenTrue.start.character - (whenTrueLinesAbove === 0 ? questionTokenSpacesBefore + 1 : 0);
  const colonTokenLinesAbove = ideal.colonToken.start.line - ideal.whenTrue.end.line;
  const colonTokenSpacesBefore = ideal.colonToken.start.character - (colonTokenLinesAbove === 0 ? whenTrueSpacesBefore + 1 : 0);
  const whenFalseLinesAbove = ideal.whenFalse.start.line - ideal.colonToken.end.line;
  const whenFalseSpacesBefore = ideal.whenFalse.start.character - (whenFalseLinesAbove === 0 ? colonTokenSpacesBefore + 1 : 0);

  return [markAsInvalidNode(node, failureMessage, [
    new Lint.Replacement(
      ts.getPositionOfLineAndCharacter(
        sourceFile,
        actual.condition.start.line,
        actual.condition.start.character
      ),
      node.getText().length,
      (
        '\n'.repeat(conditionLinesAbove) +
        ' '.repeat(conditionSpacesBefore) +
        node.condition.getText() +
        '\n'.repeat(questionTokenLinesAbove) +
        ' '.repeat(questionTokenSpacesBefore) +
        node.questionToken.getText() +
        '\n'.repeat(whenTrueLinesAbove) +
        ' '.repeat(whenTrueSpacesBefore) +
        node.whenTrue.getText() +
        '\n'.repeat(colonTokenLinesAbove) +
        ' '.repeat(colonTokenSpacesBefore) +
        node.colonToken.getText() +
        '\n'.repeat(whenFalseLinesAbove) +
        ' '.repeat(whenFalseSpacesBefore) +
        node.whenFalse.getText()
      )
    )
  ])];
}

/**
 * Get the ideal position for the condition.
 */
function getIdealConditionPosition(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  info: StartAndEndInfo
): StartAndEndInfo {
  const conditionOnSameLine = isOnSameLineAsPreviousNode(
    node,
    info.start.line,
    sourceFile
  );

  const indentAmount = getIndentationOfLine(
    sourceFile,
    info.start.line - (conditionOnSameLine ? 0 : 1)
  ) + (
    isCommentAbove(node, sourceFile)
      ? 0
      : INDENTATION.length
  );

  return {
    start: {
      line: info.start.line + (conditionOnSameLine ? 1 : 0),
      character: indentAmount
    },
    end: {
      line: info.end.line + (conditionOnSameLine ? 1 : 0),
      character: indentAmount + info.end.character - info.start.character
    }
  };
}

/**
 * Get the ideal position for the question/colon token.
 */
function getIdealTokenPosition(
  previousLine: number,
  conditionIndentation: number
): StartAndEndInfo {
  return {
    start: {
      line: previousLine + 1,
      character: conditionIndentation + INDENTATION.length
    },
    end: {
      line: previousLine + 1,
      character: conditionIndentation + INDENTATION.length + 1
    }
  };
}

/**
 * Get the ideal position for a branch.
 */
function getIdealBranchPosition(
  info: StartAndEndInfo,
  tokenPosition: ts.LineAndCharacter
): StartAndEndInfo {
  const lineCount = (info.end.line - info.start.line) + 1;

  return {
    start: {
      line: tokenPosition.line,
      character: tokenPosition.character + 1
    },
    end: {
      line: tokenPosition.line + lineCount - 1,
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
  };
}

/**
 * Get the line and character information for the given node.
 */
function getLineAndCharacterInfo(
  node: ts.ConditionalExpression,
  sourceFile: ts.SourceFile
): ConditionalExpressionInfo {
  return {
    condition: getStartAndEndInfo(node.condition, sourceFile),
    questionToken: getStartAndEndInfo(node.questionToken, sourceFile),
    whenTrue: getStartAndEndInfo(node.whenTrue, sourceFile),
    colonToken: getStartAndEndInfo(node.colonToken, sourceFile),
    whenFalse: getStartAndEndInfo(node.whenFalse, sourceFile)
  };
}

/**
 * Returns whether or not the given node is on the same line as the previous node.
 */
function isOnSameLineAsPreviousNode(
  node: ts.Node,
  nodeLine: number,
  sourceFile: ts.SourceFile
): boolean {
  const siblingBefore = getSiblingBefore(node);
  const siblingBeforeInfo =
    siblingBefore === undefined
      ? undefined
      : getStartAndEndInfo(siblingBefore, sourceFile);

  return (
    siblingBeforeInfo === undefined
      ? false
      : siblingBeforeInfo.end.line === nodeLine
  );
}

/**
 * Get the position for the given node.
 */
function getStartAndEndInfo(
  node: ts.Node,
  sourceFile: ts.SourceFile
): StartAndEndInfo {
  return ({
    start: ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()),
    end: ts.getLineAndCharacterOfPosition(sourceFile, node.getEnd())
  });
}

/**
 * Whether or not there is a comment above the given node (line-wise).
 */
function isCommentAbove(
  node: ts.Node,
  sourceFile: ts.SourceFile
): boolean {
  const leadingCommentRange = ts.getLeadingCommentRanges(sourceFile.text, node.getFullStart());
  return (
    leadingCommentRange === undefined || leadingCommentRange.length === 0
      ? false
      : Boolean(leadingCommentRange[leadingCommentRange.length - 1].hasTrailingNewLine)
  );
}

/**
 * Get the indentation of the given line.
 */
function getIndentationOfLine(
  sourceFile: ts.SourceFile,
  indentationLine: number
): number {
  const lineRanges = getLineRanges(sourceFile);
  if (indentationLine >= lineRanges.length || indentationLine < 0) {
    return 0;
  }
  const lineRange = lineRanges[indentationLine];
  const line = sourceFile.text.substring(lineRange.pos, lineRange.pos + lineRange.contentLength);
  const indentEnd = line.search(/\S/);
  return (
    indentEnd === -1
      ? 0
      : indentEnd
  );
}
