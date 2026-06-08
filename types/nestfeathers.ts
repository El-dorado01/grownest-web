export interface FeatherMilestone {
  level: number;
  threshold: number;
  label: string;
}

export interface UserFeather {
  type: string;
  label: string;
  count: number;
  level: number;
  milestones: FeatherMilestone[];
  nextMilestone?: FeatherMilestone;
  updatedAt: string | null;
}
