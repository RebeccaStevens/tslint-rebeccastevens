import 'jest';

import {
  createNodeRule,
  createNodeTypedRule,
  parseOptions
} from '../../src/common/nodeRuleHelpers';

describe('nodeRuleHelpers', () => {

  it('can create a rule', () => {
    const rule = createNodeRule<{}>(
      () => ({
        invalidNodes: [],
        skipChildren: false
      })
    );

    expect(rule.name).toStrictEqual('Rule');
  });

  it('can create a typed rule', () => {
    const rule = createNodeTypedRule<{}>(
      () => ({
        invalidNodes: [],
        skipChildren: false
      })
    );

    expect(rule.name).toStrictEqual('Rule');
  });

  it('can parse rule options', () => {
    interface Options {
      readonly fooBar?: boolean;
      readonly doIt?: string;
      readonly thisAsWell?: {
        readonly hello: number;
        readonly world: number;
      };
      readonly doNotDoIt?: boolean;
    }

    const parsed: Options = parseOptions<Options>([
      'foo-bar',
      {
        'do-it': 'foo',
        'this-as-well': {
          hello: 42,
          world: 777
        }
      },
      'do-not-do-it'
    ]);

    expect(parsed).toMatchObject({
      fooBar: true,
      doIt: 'foo',
      thisAsWell: {
        hello: 42,
        world: 777
      },
      doNotDoIt: true
    });
  });
});
