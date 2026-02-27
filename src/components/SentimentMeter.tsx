import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface SentimentMeterProps {
  score: number; // -100 to 100
  size?: number;
}

export const SentimentMeter: React.FC<SentimentMeterProps> = ({ score, size = 200 }) => {
  // Map -100...100 to 0...100 for the gauge
  const normalizedScore = ((score + 100) / 200) * 100;
  
  const data = [
    { value: normalizedScore },
    { value: 100 - normalizedScore },
  ];

  const getColor = (s: number) => {
    if (s < -50) return '#ef4444'; // Red
    if (s < -10) return '#f87171'; // Light Red
    if (s <= 10) return '#94a3b8'; // Slate
    if (s <= 50) return '#4ade80'; // Light Green
    return '#22c55e'; // Green
  };

  const color = getColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size / 1.5 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="80%"
            startAngle={180}
            endAngle={0}
            innerRadius="60%"
            outerRadius="90%"
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="#e2e8f0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-[15%] flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {score > 0 ? `+${score}` : score}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
          Sentiment
        </span>
      </div>
    </div>
  );
};
