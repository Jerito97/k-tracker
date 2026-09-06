import { ACTIVITY, CREW, MONTHS, STATUS, TITLES, kindColor } from "../data";
import type { Person, PersonId, Status, Title } from "../types";

export interface TitleOverride {
  status?: Status;
  ep?: number;
  ratings?: Partial<Record<PersonId, number>>;
}
export type Overrides = Record<string, TitleOverride>;

export function mergeTitles(overrides: Overrides): Title[] {
  return TITLES.map((t) => {
    const o = overrides[t.id];
    if (!o) return t;
    return {
      ...t,
      status: o.status ?? t.status,
      ep: o.ep ?? t.ep,
      ratings: o.ratings ? { ...t.ratings, ...o.ratings } : t.ratings,
    };
  });
}

/** A title counts as watched by someone the moment they've rated it —
 *  rating implies they finished it, independent of the group's own status. */
export function watchedBy(titles: Title[], personId: PersonId): number {
  return titles.filter((t) => (t.ratings[personId] ?? 0) > 0).length;
}

export function avgRatingLabel(titles: Title[], personId: PersonId): string {
  const rs = titles.map((t) => t.ratings[personId] ?? 0).filter((n) => n > 0);
  if (!rs.length) return "—";
  return (rs.reduce((a, b) => a + b, 0) / rs.length).toFixed(1);
}

export interface CardView {
  id: string;
  title: string;
  kind: string;
  kindColor: string;
  dot: string;
  platform: string;
  statusLine: string;
  watching: boolean;
  pct: number;
  marks: { label: string; bg: string; fg: string; border: string }[];
}

export function buildCards(
  titles: Title[],
  statusFilter: string,
  kindFilter: string,
): CardView[] {
  return titles
    .filter(
      (t) =>
        (statusFilter === "todos" || t.status === statusFilter) &&
        (kindFilter === "todo" || t.kind === kindFilter),
    )
    .map((t) => ({
      id: t.id,
      title: t.title,
      kind: t.kind,
      kindColor: kindColor(t.kind),
      dot: STATUS[t.status].dot,
      platform: t.platform,
      statusLine: t.status === "mirando" ? `Ep ${t.ep}/${t.epTotal}` : STATUS[t.status].line,
      watching: t.status === "mirando",
      pct: t.epTotal ? Math.round((t.ep / t.epTotal) * 100) : 0,
      marks: CREW.map((c) => {
        const r = t.ratings[c.id] ?? 0;
        return {
          label: r > 0 ? String(r) : c.initial,
          bg: r > 0 ? c.color : "transparent",
          fg: r > 0 ? "#161826" : "rgba(236,234,240,.3)",
          border: r > 0 ? c.color : "rgba(236,234,240,.16)",
        };
      }),
    }));
}

export interface NoteView {
  id: PersonId;
  name: string;
  initial: string;
  color: string;
  tint: string;
  scoreLabel: string;
  pct: number;
  comment?: string;
  when?: string;
}

export interface DetailView {
  id: string;
  title: string;
  orig: string;
  year: number;
  kind: string;
  kindColor: string;
  status: Status;
  synopsis: string;
  critic: Title["critic"];
  avg: string;
  chips: string[];
  notes: NoteView[];
  myScore: number;
  myScoreLabel: string;
  watching: boolean;
  ep: number;
  epTotal: number;
  pct: number;
}

export function buildDetail(titles: Title[], detailId: string | null, me: PersonId): DetailView {
  const d = titles.find((t) => t.id === detailId) ?? titles[0];
  const scores = CREW.map((c) => d.ratings[c.id] ?? 0).filter((n) => n > 0);
  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
  return {
    id: d.id,
    title: d.title,
    orig: d.orig,
    year: d.year,
    kind: d.kind,
    kindColor: kindColor(d.kind),
    status: d.status,
    synopsis: d.synopsis,
    critic: d.critic,
    avg,
    chips: [d.epTotal ? `${d.epTotal} episodios` : "Película", d.platform, ...d.tags],
    notes: CREW.map((c) => {
      const r = d.ratings[c.id] ?? 0;
      return {
        id: c.id,
        name: c.name,
        initial: c.initial,
        color: c.color,
        tint: c.tint,
        scoreLabel: r > 0 ? `${r}/10` : "sin nota",
        pct: r * 10,
        comment: d.comments[c.id],
        when: d.when[c.id],
      };
    }),
    myScore: d.ratings[me] ?? 0,
    myScoreLabel: (d.ratings[me] ?? 0) > 0 ? `${d.ratings[me]}/10` : "—",
    watching: d.status === "mirando",
    ep: d.ep,
    epTotal: d.epTotal,
    pct: d.epTotal ? Math.round((d.ep / d.epTotal) * 100) : 0,
  };
}

export interface PersonStats extends Person {
  watched: number;
  pct: number;
  avgLabel: string;
  streakLabel: string;
  ring: string;
  heat: { label: number; bg: string; fg: string }[];
}

const HEAT_RGB: Record<string, string> = {
  jero: "240,96,74",
  flor: "226,164,75",
  liz: "214,132,155",
};

export function buildPeopleStats(titles: Title[]): PersonStats[] {
  const watchedCounts = CREW.map((c) => watchedBy(titles, c.id));
  const maxWatched = Math.max(...watchedCounts, 1);
  return CREW.map((c, i) => {
    const w = watchedCounts[i];
    const pct = Math.round((w / maxWatched) * 100);
    return {
      ...c,
      watched: w,
      pct,
      avgLabel: `promedio ${avgRatingLabel(titles, c.id)}`,
      streakLabel: c.streak,
      ring: `conic-gradient(${c.color} 0 ${pct}%, rgba(236,234,240,.09) 0 100%)`,
      heat: ACTIVITY[c.id].map((n) => ({
        label: n,
        bg: `rgba(${HEAT_RGB[c.id]},${0.14 + 0.2 * n})`,
        fg: n >= 3 ? "#161826" : "rgba(236,234,240,.7)",
      })),
    };
  });
}

export interface MonthCol {
  label: string;
  segs: { color: string; h: number }[];
  stack: { color: string; h: number }[];
}

export function buildMonthCols(): MonthCol[] {
  const maxMonth = Math.max(...CREW.map((c) => Math.max(...ACTIVITY[c.id])));
  return MONTHS.map((label, i) => {
    const total = CREW.reduce((sum, c) => sum + ACTIVITY[c.id][i], 0);
    return {
      label,
      segs: CREW.map((c) => ({ color: c.color, h: Math.round((ACTIVITY[c.id][i] / maxMonth) * 100) })),
      stack: CREW.map((c) => ({ color: c.color, h: Math.round((ACTIVITY[c.id][i] / total) * 100) })),
    };
  });
}

export interface PodiumEntry extends PersonStats {
  place: string;
  h: number;
}

export function buildPodium(people: PersonStats[]): PodiumEntry[] {
  return people
    .slice()
    .sort((a, b) => b.watched - a.watched)
    .map((p, i) => ({ ...p, place: ["1º", "2º", "3º"][i], h: [104, 78, 56][i] }));
}
