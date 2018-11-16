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
  InvalidNode,
  markAsInvalidNode
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
const indentation = '  ';

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
): {
  readonly invalidNodes: Array<InvalidNode>;
  readonly skipChildren: boolean;
} {
  if (isConditionalExpression(node)) {
    const trueFlowing = isConditionalExpression(node.whenTrue);
    const falseFlowing = isConditionalExpression(node.whenFalse);

    const lineAndCharacterInfo = getLineAndCharacterInfo(node, ctx.sourceFile);

    if (!trueFlowing && !falseFlowing) {
      return {
        invalidNodes: checkNonNested(node, ctx, lineAndCharacterInfo),
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
): Array<InvalidNode> {
  if (Boolean(ctx.options.allowSingleLine)) {
    const onSingleLine = nodeInfo.condition.start.line === nodeInfo.whenFalse.end.line;
    if (onSingleLine) {
      return [];
    }
  }

  const condition = getIdealCondition(
    node,
    ctx.sourceFile,
    nodeInfo.condition
  );

  const questionToken = getIdealQuestionToken(
    condition.end.line,
    condition.start.character
  );

  const whenTrue = getIdealWhenTrue(
    nodeInfo.whenTrue,
    questionToken.end
  );

  const colonToken = getIdealColonToken(
    whenTrue.end.line,
    questionToken
  );

  const whenFalse = getIdealWhenFalse(
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

/**
 * Compare the ideal format to the actual format.
 */
function compareIdealToActual(
  node: ts.ConditionalExpression,
  sourceFile: ts.SourceFile,
  ideal: ConditionalExpressionInfo,
  actual: ConditionalExpressionInfo
): Array<InvalidNode> {
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
 * Get the start and end info for the given node.
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
 * Get the ideal start and end info for the condition.
 */
function getIdealCondition(
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
      : indentation.length
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
 * Get the ideal start and end info for the question token.
 */
function getIdealQuestionToken(
  conditionLine: number,
  conditionIndentation: number
): StartAndEndInfo {
  return {
    start: {
      line: conditionLine + 1,
      character: conditionIndentation + indentation.length
    },
    end: {
      line: conditionLine + 1,
      character: conditionIndentation + indentation.length + 1
    }
  };
}

/**
 * Get the ideal start and end info for the when true branch.
 */
function getIdealWhenTrue(
  info: StartAndEndInfo,
  questionTokenLineAndCharacter: ts.LineAndCharacter
): StartAndEndInfo {
  const lineCount = (info.end.line - info.start.line) + 1;

  return {
    start: {
      line: questionTokenLineAndCharacter.line,
      character: questionTokenLineAndCharacter.character + 1
    },
    end: {
      line: questionTokenLineAndCharacter.line + lineCount - 1,
      character:
        lineCount === 1
          ? (
              questionTokenLineAndCharacter.character +
              info.end.character -
              info.start.character +
              1
            )
          : info.end.character
    }
  };
}

/**
 * Get the ideal start and end info for the colon token.
 */
function getIdealColonToken(
  whenTrueLine: number,
  questionTokenInfo: StartAndEndInfo
): StartAndEndInfo {
  return {
    start: {
      line: whenTrueLine + 1,
      character: questionTokenInfo.start.character
    },
    end: {
      line: whenTrueLine + 1,
      character: questionTokenInfo.end.character
    }
  };
}

/**
 * Get the ideal start and end info for the when false branch.
 */
function getIdealWhenFalse(
  info: StartAndEndInfo,
  colonTokenLineAndCharacter: ts.LineAndCharacter
): StartAndEndInfo {
  const lineCount = (info.end.line - info.start.line) + 1;

  return {
    start: {
      line: colonTokenLineAndCharacter.line,
      character: colonTokenLineAndCharacter.character + 1
    },
    end: {
      line: colonTokenLineAndCharacter.line + lineCount - 1,
      character:
        lineCount === 1
          ? (
              colonTokenLineAndCharacter.character +
              info.end.character -
              info.start.character +
              1
            )
          : info.end.character
    }
  };
}
