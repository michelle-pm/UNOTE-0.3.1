import React from 'react';
import { LineData, LineSeries, LineDataPoint, Widget } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import DependencySelector from '../DependencySelector';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  TooltipProps,
} from 'recharts';

interface LineWidgetProps {
  data: LineData;
  updateData: (data: LineData) => void;
  allWidgets: Widget[];
  currentWidgetId: string;
  isEditable: boolean;
}

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 text-xs bg-black/50 backdrop-blur-lg rounded-lg border border-glass-border shadow-lg">
          <p className="font-bold">{label}</p>
          <p style={{ color: payload[0].stroke }}>
            {`${payload[0].name}: ${payload[0].value?.toLocaleString()}`}
          </p>
        </div>
      );
    }
    return null;
};

const LineWidget: React.FC<LineWidgetProps> = ({ data, updateData, allWidgets, currentWidgetId, isEditable }) => {
  const { series, color, color2 } = data;
  
  const mainSeries = series[0] || { name: 'Серия', data: [] };

  const handleUpdate = (newData: Partial<LineData>) => {
    let update: LineData = { ...data, ...newData };
    updateData(update);
  };
  
  const updateMainSeries = (updatedSeries: Partial<LineSeries>) => {
    const newSeries = [...series];
    newSeries[0] = { ...mainSeries, ...updatedSeries };
    handleUpdate({ series: newSeries });
  };
  
  const updatePoint = (pointIndex: number, updatedPoint: Partial<LineDataPoint>) => {
      const newPoints = [...mainSeries.data];
      newPoints[pointIndex] = { ...newPoints[pointIndex], ...updatedPoint };
      updateMainSeries({ data: newPoints });
  };
  
  const addPoint = () => {
    const newPoint: LineDataPoint = { id: uuidv4(), x: 'Новая', y: Math.round(Math.random() * 50) };
    updateMainSeries({ data: [...mainSeries.data, newPoint] });
  };
  
  const deletePoint = (pointId: string) => {
      const newPoints = mainSeries.data.filter(p => p.id !== pointId);
      updateMainSeries({ data: newPoints });
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => event.target.select();
  
  return (
    <div className="h-full flex flex-col relative text-sm">
      <div className="flex-grow min-h-[120px] relative -ml-4 -mr-2 -mt-2">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={mainSeries.data}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
                <defs>
                    <linearGradient id={`gradient_${currentWidgetId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} stroke="currentColor" opacity={0.4} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} stroke="currentColor" opacity={0.4} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '3 3' }}/>
                <Area 
                    type="monotone" 
                    dataKey="y" 
                    name={mainSeries.name}
                    stroke={color2} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill={`url(#gradient_${currentWidgetId})`}
                    activeDot={{ r: 5, stroke: 'white', strokeWidth: 1.5, fill: color2 }}
                />
            </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {mainSeries.data.length > 0 && (
      <div className="flex-grow overflow-y-auto mt-2 space-y-2 pr-1">
        {mainSeries.data.map((p, pointIdx) => (
          <div key={p.id} className="grid grid-cols-[1fr_1fr_1.5fr_auto] gap-2 items-center text-xs group bg-white/5 p-1 rounded-lg">
            <input type="text" value={p.x} onChange={e => updatePoint(pointIdx, { x: e.target.value })} disabled={!isEditable} onFocus={handleFocus} className="bg-transparent rounded-md p-1 hover:bg-white/5 focus:bg-white/10 disabled:opacity-70 disabled:cursor-not-allowed w-full"/>
            <input type="number" value={p.y} onChange={e => updatePoint(pointIdx, { y: parseFloat(e.target.value) || 0 })} disabled={!isEditable || !!p.dependency} onFocus={handleFocus} className="bg-transparent rounded-md p-1 hover:bg-white/5 focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed w-full" />
            <div className="min-w-0">
              <DependencySelector allWidgets={allWidgets} currentWidgetId={currentWidgetId} value={p.dependency} onChange={dep => updatePoint(pointIdx, { dependency: dep })} disabled={!isEditable}/>
            </div>
            {isEditable && <button onClick={() => deletePoint(p.id)} className="text-text-secondary/50 hover:text-red-500 justify-self-end opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>}
          </div>
        ))}
      </div>
      )}
      
       {isEditable && <button onClick={addPoint} className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary mt-2 p-1"><Plus size={14} /> Добавить точку</button>}
    </div>
  );
};

export default React.memo(LineWidget);