// How long a chat's public link works (lib/chat/shares.ts), in days.
export const shareDays = { "1d": 1, "1w": 7, "1m": 30 } as const;

export type ShareDuration = keyof typeof shareDays;

export const shareDurations = Object.keys(shareDays) as ShareDuration[];

export const isShareDuration = (value: unknown): value is ShareDuration =>
  typeof value === "string" && Object.hasOwn(shareDays, value);
