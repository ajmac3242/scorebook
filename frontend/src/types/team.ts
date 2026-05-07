/**
 * @file team.ts
 * @description Interface representing a basketball team.
 */

export interface Team {
  id?: string;
  name: string;
  description?: string;
  periodType: "QUARTERS" | "HALVES";
  logoUrl?: string;
  primaryColor?: string;
  fouls?: number;
  deletedAt?: string;
  synced?: number;
  isFavorite?: number; // 0 or 1
  defaultPeriodLength?: number;
  defaultTimeoutLimit?: number;
  defaultFoulLimit?: number;
  defaultOvertimeLength?: number;
  maxStintDuration?: number; // In minutes
  playbook?: string[];
  foulWarningThresholds?: Record<string, number>;
}
