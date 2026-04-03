import React from "react";

interface SummaryBoxProps {
  summary: string;
}

export const SummaryBox: React.FC<SummaryBoxProps> = ({ summary }) => {
  return (
    <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
      <h4 className="text-orange-500 font-bold text-sm uppercase tracking-wider mb-4">
        Summary & Insights
      </h4>
      <div className="text-white/80 whitespace-pre-wrap">
        {summary}
      </div>
    </div>
  );
};
