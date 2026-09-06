export type PersonId = "jero" | "flor" | "liz";
export type Status = "pendiente" | "mirando" | "visto";
export type Kind = "Serie" | "Película";
export type StatsVariant = "v1" | "v2" | "v3";
export type Screen = "gate" | "tracker" | "detail" | "discover" | "stats";
export type KindFilter = "todo" | Kind;
export type StatusFilter = "todos" | Status;

export interface Person {
  id: PersonId;
  name: string;
  short: string;
  initial: string;
  color: string;
  colorSoft: string;
  tint: string;
  tag: string;
  streak: string;
}

export interface Critic {
  score: string;
  quote: string;
}

export interface Title {
  id: string;
  title: string;
  orig: string;
  year: number;
  kind: Kind;
  ep: number;
  epTotal: number;
  platform: string;
  tags: string[];
  status: Status;
  synopsis: string;
  critic: Critic;
  ratings: Partial<Record<PersonId, number>>;
  comments: Partial<Record<PersonId, string>>;
  when: Partial<Record<PersonId, string>>;
}

export interface DiscoverItem {
  id: string;
  title: string;
  year: number;
  kind: Kind;
  why: string;
}

export interface StatusMeta {
  label: string;
  dot: string;
  line: string;
}
