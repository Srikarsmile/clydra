/* components/UsageBars.tsx */
import useSWR from "swr";
const fetcher = (u:string)=>fetch(u).then(r=>r.json());

export default function UsageBars() {
  const { data } = useSWR("/api/credits", fetcher);
  if (!data) return null;

  const Bar = ({ used, cap, label }: { used: number; cap: number; label: string }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-primary">{label}</span>
        <span className="text-xs text-text-muted">
          {used} / {cap}
        </span>
      </div>
      <div className="h-2 w-full bg-neutral-200 rounded">
        <div
          className="h-2 bg-secondary rounded"
          style={{ width: `${Math.min(100, (used / cap) * 100)}%` }}
        ></div>
      </div>
      <p className="text-xs text-text-muted mt-1">
        {cap - used} remaining
      </p>
    </div>
  );

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <h4 className="font-semibold text-text-main mb-4">Usage This Month</h4>
      <Bar used={data.imagesUsed} cap={data.imageCap} label="Images" />
      <Bar used={data.secondsUsed} cap={data.secondCap} label="Video Seconds" />
    </div>
  );
} 