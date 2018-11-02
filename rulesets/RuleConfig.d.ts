export interface RuleConfig {
  readonly [key: string]: RuleConfigValue;
}

type RuleConfigValue =
  | RuleConfigBaseValue
  | RuleConfigArrayValue
  | RuleConfigObjectValue;

type RuleConfigBaseValue =
  | null
  | string
  | number
  | boolean;

type RuleConfigArrayValue = ReadonlyArray<
  | RuleConfigBaseValue
  | RuleConfigObjectValue
>;

interface RuleConfigObjectValue {
  readonly [key: string]: RuleConfigValue;
}
