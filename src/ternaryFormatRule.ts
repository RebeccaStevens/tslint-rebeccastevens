/**
 * TODO: desc
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

// tslint:disable-next-line:interface-over-type-literal
type RuleOptions = {};

interface ConditionalExpressionLineAndCharacterInfo {
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

/**
 * The `ternary-indentation`.
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

    const lineAndCharacterInfo = getLineAndCharacterInfo(node, ctx);

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
  lineAndCharacterInfo: ConditionalExpressionLineAndCharacterInfo
): Array<InvalidNode> {
  // tslint:disable:no-unnecessary-initializer no-let
  let siblingBeforeInfo: StartAndEndInfo | undefined = undefined;
  let foundNode = false;
  // tslint:enable:no-unnecessary-initializer no-let
  node.parent.forEachChild((child) => {
    if (child === node) {
      foundNode = true;
    } else if (!foundNode) {
      siblingBeforeInfo = {
        start: ts.getLineAndCharacterOfPosition(ctx.sourceFile, child.getStart()),
        end: ts.getLineAndCharacterOfPosition(ctx.sourceFile, child.getEnd())
      };
    }
  });

  const conditionOnSameLine =
    // tslint:disable-next-line:strict-type-predicates
    siblingBeforeInfo === undefined
      ? false
      : (siblingBeforeInfo as StartAndEndInfo).end.line === lineAndCharacterInfo.condition.start.line;

  // TODO: Make safe.
  // BODY: Possable out of bounds exception.
  const lineRanges = getLineRanges(ctx.sourceFile);
  const lineRange = conditionOnSameLine
    ? lineRanges[lineAndCharacterInfo.condition.start.line]
    : lineRanges[lineAndCharacterInfo.condition.start.line - 1];
  const line = ctx.sourceFile.text.substring(
    lineRange.pos,
    lineRange.pos + lineRange.contentLength
  );
  const indentEnd = line.search(/\S/);
  const indentation =
    indentEnd === -1
      ? 0
      : indentEnd;

  const idealCondition: StartAndEndInfo = {
    start: {
      line: lineAndCharacterInfo.condition.start.line + (conditionOnSameLine ? 1 : 0),
      character: indentation + 2
    },
    end: {
      line: lineAndCharacterInfo.condition.end.line + (conditionOnSameLine ? 1 : 0),
      character: indentation + 2 + lineAndCharacterInfo.condition.end.character - lineAndCharacterInfo.condition.start.character
    }
  };

  const idealQuestionToken: StartAndEndInfo = {
    start: {
      line: idealCondition.end.line + 1,
      character: idealCondition.start.character + 2
    },
    end: {
      line: idealCondition.end.line + 1,
      character: idealCondition.start.character + 2 + 1
    }
  };

  const whenTrueLineCount = (
      lineAndCharacterInfo.whenTrue.end.line -
      lineAndCharacterInfo.whenTrue.start.line
    ) + 1;

  const idealWhenTrue: StartAndEndInfo = {
    start: {
      line: idealQuestionToken.end.line,
      character: idealQuestionToken.end.character + 1
    },
    end: {
      line: idealQuestionToken.end.line + (whenTrueLineCount - 1),
      character: whenTrueLineCount === 1
        ? idealQuestionToken.end.character + lineAndCharacterInfo.whenTrue.end.character - lineAndCharacterInfo.whenTrue.start.character + 1
        : lineAndCharacterInfo.whenTrue.end.character
    }
  };

  const idealColonToken: StartAndEndInfo = {
    start: {
      line: idealWhenTrue.end.line + (whenTrueLineCount > 1 ? 2 : 1),
      character: idealQuestionToken.start.character
    },
    end: {
      line: idealWhenTrue.end.line + (whenTrueLineCount > 1 ? 2 : 1),
      character: idealQuestionToken.end.character
    }
  };

  const whenFalseLineCount = (
      lineAndCharacterInfo.whenFalse.end.line -
      lineAndCharacterInfo.whenFalse.start.line
    ) + 1;

  const idealWhenFalse: StartAndEndInfo = {
    start: {
      line: idealColonToken.end.line,
      character: idealColonToken.end.character + 1
    },
    end: {
      line: idealColonToken.end.line + (whenFalseLineCount - 1),
      character: whenFalseLineCount === 1
        ? idealColonToken.end.character + lineAndCharacterInfo.whenFalse.end.character - lineAndCharacterInfo.whenFalse.start.character + 1
        : lineAndCharacterInfo.whenFalse.end.character
    }
  };

  const ideal: ConditionalExpressionLineAndCharacterInfo = {
    condition: idealCondition,
    questionToken: idealQuestionToken,
    whenTrue: idealWhenTrue,
    colonToken: idealColonToken,
    whenFalse: idealWhenFalse
  };

  return compareIdealToActual(node, ctx, ideal, lineAndCharacterInfo);
}

/**
 * Compare the ideal format to the actual format.
 */
function compareIdealToActual(
  node: ts.ConditionalExpression,
  ctx: Lint.WalkContext<RuleOptions>,
  ideal: ConditionalExpressionLineAndCharacterInfo,
  actual: ConditionalExpressionLineAndCharacterInfo
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
        ctx.sourceFile,
        actual.condition.start.line,
        actual.condition.start.character
      ),
      node.getText().length,

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
  ])];
}

/**
 * Get the line and character information for the given node.
 */
function getLineAndCharacterInfo(
  node: ts.ConditionalExpression,
  ctx: Lint.WalkContext<RuleOptions>
): ConditionalExpressionLineAndCharacterInfo {
  return {
    condition: {
      start: ts.getLineAndCharacterOfPosition(ctx.sourceFile, node.condition.getStart()),
      end: ts.getLineAndCharacterOfPosition(ctx.sourceFile, node.condition.getEnd())
    },
    questionToken: {
      start: ts.getLineAndCharacterOfPosition(ctx.sourceFile, node.questionToken.getStart()),
      end: ts.getLineAndCharacterOfPosition(ctx.sourceFile, node.questionToken.getEnd())
    },
    whenTrue: {
      start: ts.getLineAndCharacterOfPosition(ctx.sourceFile, node.whenTrue.getStart()),
      end: ts.getLineAndCharacterOfPosition(ctx.sourceFile, node.whenTrue.getEnd())
    },
    colonToken: {
      start: ts.getLineAndCharacterOfPosition(ctx.sourceFile, node.colonToken.getStart()),
      end: ts.getLineAndCharacterOfPosition(ctx.sourceFile, node.colonToken.getEnd())
    },
    whenFalse: {
      start: ts.getLineAndCharacterOfPosition(ctx.sourceFile, node.whenFalse.getStart()),
      end: ts.getLineAndCharacterOfPosition(ctx.sourceFile, node.whenFalse.getEnd())
    }
  };
}
