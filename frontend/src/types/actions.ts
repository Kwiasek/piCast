export const Action = {
  play_toggle: "play_toggle",
  ffwd: "ffwd",
  rewind: "rewind",
  restart: "restart",
  stop: "stop"
} as const;

export type Action = typeof Action[keyof typeof Action];