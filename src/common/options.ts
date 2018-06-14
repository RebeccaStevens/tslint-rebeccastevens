/**
 * Handle rule options.
 */

// TODO: remove following tslint-disbale comment.
// tslint:disable:no-any no-let no-loop-statement no-object-mutation

export type ParseOptionsFunction<TOptions> = (ruleArguments: Array<any>) => TOptions;

export interface IOptions {
  readonly [key: string]: boolean | string;
}

export interface IMutableOptions {
  // tslint:disable-next-line:readonly-keyword
  [key: string]: boolean | string;
}

/**
 * Converts ruleArguments in format
 * ["foo-bar", {do-it: "foo"}, "do-not-do-it"]
 * to options in format
 * {fooBar: true, doIt: "foo", doNotDoIt: true}
 */
export function parseOptions<TOptions>(ruleArguments: Array<any>): TOptions {
  let options: IMutableOptions = {};
  for (const o of ruleArguments) {
    if (typeof o === 'string') {
      options[camelize(o)] = true;
    } else if (typeof o === 'object') {
      const o2: IMutableOptions = {};
      for (const key of Object.keys(o)) {
        o2[camelize(key)] = o[key];
      }
      options = { ...options, ...o2 };
    }
  }
  return options as any;
}

function camelize(text: string): string {
  const words = text.split(/[-_]/g);
  return (
    words[0].toLowerCase() +
    words
      .slice(1)
      .map(upFirst)
  );
}

function upFirst(word: string): string {
  return (
    word[0].toUpperCase() +
    word
      .toLowerCase()
      .slice(1)
  );
}
