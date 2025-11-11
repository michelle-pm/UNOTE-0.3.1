import React, { useMemo, useContext } from 'react';
import { PieData, PieChartItem } from '../../types';
import { motion } from 'framer-motion';
import { WidgetSizeContext } from '../WidgetWrapper';


interface PieWidgetProps {
  data: PieData;
  updateData: (data: PieData) => void;
  isEditable: boolean;
  widgetId: string;
}

const PieWidget: React.FC<PieWidgetProps> = ({ data, updateData, isEditable, widgetId }) => {
  const { charts, color1, color2 } = data;
  const { width, height } = useContext(WidgetSizeContext);
  const gradientId = `gradient-${widgetId}`;

  const handleChartUpdate = (updatedChart: PieChartItem) => {
      const newCharts = [updatedChart];
      updateData({ ...data, charts: newCharts });
  };

  const chart = charts[0];

  const percentage = useMemo(() => {
      if (!chart || chart.total <= 0) return 0;
      return Math.min(Math.max((chart.part / chart.total) * 100, 0), 100);
  }, [chart]);

  const chartSize = useMemo(() => {
    if (!width || !height) return 128; // fallback for md:w-32/h-32
    return Math.min(width, height) * 0.7;
  }, [width, height]);

  const strokeWidth = 10;
  const radius = (chartSize / 2) - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const svgSize = chartSize;
  const viewBoxSize = svgSize / (radius / 50); // Keep viewBox consistent for scaling

  const handleUpdate = (field: keyof PieChartItem, value: string | number) => {
      if (!chart) return;
      let newChart = {...chart, [field]: value};
      if (field === 'part' || field === 'total') {
          newChart = {...newChart, [field]: parseFloat(value as string) || 0}
      }
      handleChartUpdate(newChart);
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => event.target.select();

  if (!chart) return <div className="text-center text-text-secondary">Нет данных для диаграммы.</div>;

  return (
    <div className="h-full w-full flex flex-col items-center justify-around p-0 relative text-sm">
        <svg width="0" height="0" className="absolute">
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={color1} />
                    <stop offset="100%" stopColor={color2} />
                </linearGradient>
            </defs>
        </svg>

        <div className="relative" style={{width: svgSize, height: svgSize}}>
            <svg className="w-full h-full" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
                <circle
                    className="text-white/10"
                    strokeWidth={strokeWidth / (svgSize / viewBoxSize)}
                    stroke="currentColor"
                    fill="transparent"
                    r={50 - (strokeWidth/2)}
                    cx={viewBoxSize/2}
                    cy={viewBoxSize/2}
                />
                <motion.circle
                    strokeWidth={strokeWidth / (svgSize / viewBoxSize)}
                    stroke={`url(#${gradientId})`}
                    fill="transparent"
                    r={50 - (strokeWidth/2)}
                    cx={viewBoxSize/2}
                    cy={viewBoxSize/2}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    strokeDasharray={`${2 * Math.PI * (50 - (strokeWidth/2))}`}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: `${2 * Math.PI * (50 - (strokeWidth/2))}` }}
                    animate={{ strokeDashoffset: `${(2 * Math.PI * (50 - (strokeWidth/2))) - (percentage / 100) * (2 * Math.PI * (50 - (strokeWidth/2)))}` }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                />
            </svg>
            <div 
              className="absolute inset-0 flex items-center justify-center font-bold"
              style={{ fontSize: `${svgSize * 0.25}px` }}
            >
                {percentage.toFixed(0)}%
            </div>
        </div>
        <div className="flex flex-col items-center w-full mt-2">
            <input 
                type="text" 
                value={chart.partLabel} 
                onChange={(e) => handleUpdate('partLabel', e.target.value)} 
                onFocus={handleFocus} disabled={!isEditable} 
                className="bg-transparent w-full text-center focus:outline-none p-1 text-text-secondary text-xs font-semibold rounded-md hover:bg-white/5 focus:bg-white/10 disabled:opacity-70 disabled:cursor-not-allowed"
            />
            <div className="flex items-baseline justify-center w-full">
                <input 
                    type="number" 
                    value={chart.part} 
                    onChange={(e) => handleUpdate('part', e.target.value)} 
                    onFocus={handleFocus} disabled={!isEditable} 
                    className="bg-transparent w-2/5 text-right focus:outline-none p-1 text-xl font-bold rounded-md hover:bg-white/5 focus:bg-white/10 disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <span className="text-text-secondary mx-1 text-lg">/</span>
                <input 
                    type="number" 
                    value={chart.total} 
                    onChange={(e) => handleUpdate('total', e.target.value)} 
                    onFocus={handleFocus} disabled={!isEditable} 
                    className="bg-transparent w-2/5 text-left focus:outline-none p-1 text-lg text-text-secondary rounded-md hover:bg-white/5 focus:bg-white/10 disabled:opacity-70 disabled:cursor-not-allowed"
                />
            </div>
        </div>
    </div>
  );
};

export default React.memo(PieWidget);