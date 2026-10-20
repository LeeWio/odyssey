export const STATUS_PROGRESS = {
  abandoned: 0,
  completed: 100,
  in_progress: 60,
  planned: 20,
} as const;

export function StatusMeter({
  label,
  status,
  value,
}: {
  label: string;
  status?: keyof typeof STATUS_PROGRESS;
  value?: number;
}) {
  const now = value ?? (status ? STATUS_PROGRESS[status] : 0);

  return <Meter filled={Math.round(now / 20)} label={label} max={100} now={now} />;
}

export function ProgressMeter({
  completed,
  label,
  total,
}: {
  completed: number;
  label: string;
  total: number;
}) {
  const value = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex max-w-xs flex-col gap-2">
      <div className="flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-medium tabular-nums">
          {completed} / {total}
        </span>
      </div>
      <Meter filled={Math.round(value / 20)} label={label} max={total} now={completed} />
    </div>
  );
}

function Meter({
  filled,
  label,
  max,
  now,
}: {
  filled: number;
  label: string;
  max: number;
  now: number;
}) {
  return (
    <div
      aria-label={label}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={now}
      className="grid grid-cols-5 gap-1"
      role="meter"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className="h-1.5 rounded-full"
          style={{
            backgroundColor: index < filled ? "var(--chart-3)" : "var(--surface-tertiary)",
          }}
        />
      ))}
    </div>
  );
}
