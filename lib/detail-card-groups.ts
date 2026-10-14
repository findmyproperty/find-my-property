export type DetailRow = { label: string; value: string };

export type DetailCardGroup = { title: string; rows: DetailRow[] };

const GROUP_RULES: { title: string; test: (label: string) => boolean }[] = [
  {
    title: "Pricing & availability",
    test: (l) =>
      /price|rent|deposit|lease|maintenance|negotiable|available|possession|occupancy|cost/i.test(
        l,
      ),
  },
  {
    title: "Area & layout",
    test: (l) =>
      /area|bhk|bath|balcony|floor|plot|length|width|room|built-up|carpet|super built/i.test(
        l,
      ),
  },
  {
    title: "Legal & ownership",
    test: (l) =>
      /ownership|certificate|deed|agreement|tax|allotment|conversion|loan|occupancy/i.test(
        l,
      ),
  },
  {
    title: "Parking & amenities",
    test: (l) =>
      /parking|lift|power|wifi|gym|furnish|security|water|electricity|amenities|ac |air conditioning|pet|food|laundry|warden/i.test(
        l,
      ),
  },
  {
    title: "Contact & showing",
    test: (l) => /contact|show|direction|secondary number|who will/i.test(l),
  },
];

/** Groups listing detail rows into mobile-friendly scenario cards. */
export function groupDetailRows(rows: DetailRow[]): DetailCardGroup[] {
  if (rows.length === 0) return [];

  const buckets = GROUP_RULES.map((rule) => ({
    title: rule.title,
    rows: [] as DetailRow[],
  }));
  const other: DetailRow[] = [];

  for (const row of rows) {
    const bucket = buckets.find((b) =>
      GROUP_RULES.find((r) => r.title === b.title)?.test(row.label),
    );
    if (bucket) bucket.rows.push(row);
    else other.push(row);
  }

  const groups = buckets.filter((b) => b.rows.length > 0);
  if (other.length > 0) {
    groups.push({ title: "More details", rows: other });
  }
  return groups;
}
