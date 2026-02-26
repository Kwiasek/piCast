export const status = {
  online: "online",
  offline: "offline",
  checking: "checking",
  error: "error"
} as const;

export type Status = typeof status[keyof typeof status];