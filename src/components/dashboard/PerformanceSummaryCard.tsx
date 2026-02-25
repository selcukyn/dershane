import type { AnalyticsResult, ScoreClassification } from "@/types/analytics";
import { formatLgsScore } from "@/lib/analytics";

interface PerformanceSummaryCardProps {
  analytics: AnalyticsResult;
}

const CLASSIFICATION_COLORS: Record<ScoreClassification, string> = {
  Mükemmel: "text-emerald-400 bg-emerald-950 border-emerald-800",
  "Çok İyi": "text-blue-400 bg-blue-950 border-blue-800",
  İyi: "text-sky-400 bg-sky-950 border-sky-800",
  Orta: "text-yellow-400 bg-yellow-950 border-yellow-800",
  Geliştirilmeli: "text-orange-400 bg-orange-950 border-orange-800",
};

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;

  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5">
        → Değişim yok
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border ${
        isPositive
          ? "text-emerald-400 bg-emerald-950 border-emerald-800"
          : "text-red-400 bg-red-950 border-red-800"
      }`}
    >
      {isPositive ? "↑" : "↓"} {isPositive ? "+" : ""}
      {formatLgsScore(delta)}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-white font-bold text-xl leading-tight">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export function PerformanceSummaryCard({
  analytics,
}: PerformanceSummaryCardProps) {
  const {
    latestScore,
    classification,
    delta,
    strongestSubjectLabel,
    weakestSubjectLabel,
    percentileDisplay,
    totalExams,
  } = analytics;

  if (latestScore === null) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Performans Özeti
        </h2>
        <p className="text-slate-500 text-sm">
          Henüz sınav eklenmemiş. İlk sınavı ekleyerek başlayın.
        </p>
      </div>
    );
  }

  const classificationStyle = classification
    ? CLASSIFICATION_COLORS[classification]
    : "text-slate-400 bg-slate-800 border-slate-700";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Performans Özeti</h2>
        {classification && (
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${classificationStyle}`}
          >
            {classification}
          </span>
        )}
      </div>

      {/* Main score */}
      <div className="flex items-end gap-3 mb-6">
        <div>
          <p className="text-slate-400 text-sm mb-1">Son LGS Puanı</p>
          <p className="text-5xl font-bold text-white tabular-nums">
            {formatLgsScore(latestScore)}
          </p>
        </div>
        <div className="mb-2">
          <DeltaBadge delta={delta} />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Toplam Sınav" value={String(totalExams)} />

        {percentileDisplay ? (
          <StatCard
            label="Yüzdelik Dilim"
            value={percentileDisplay}
            sub="Son sınav"
          />
        ) : (
          <StatCard label="Yüzdelik Dilim" value="—" sub="Veri yok" />
        )}

        {strongestSubjectLabel ? (
          <StatCard label="En Güçlü Ders" value={strongestSubjectLabel} />
        ) : (
          <StatCard label="En Güçlü Ders" value="—" />
        )}

        {weakestSubjectLabel ? (
          <StatCard label="Geliştirilecek Ders" value={weakestSubjectLabel} />
        ) : (
          <StatCard label="Geliştirilecek Ders" value="—" />
        )}
      </div>
    </div>
  );
}
