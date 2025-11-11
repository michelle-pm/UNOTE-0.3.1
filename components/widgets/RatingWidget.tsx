import React, { useMemo, useState } from 'react';
import { RatingData, RatingSource, User, Widget, WidgetType, PlanData, PieData, LineData, DependencyDataKey } from '../../types';
import { Trophy, ChevronDown } from 'lucide-react';
import Avatar from '../Avatar';
import DependencySelector from '../DependencySelector';
import { motion, AnimatePresence } from 'framer-motion';

interface RatingWidgetProps {
  data: RatingData;
  updateData: (data: RatingData) => void;
  isEditable: boolean;
  projectUsers: User[];
  allWidgets: Widget[];
  currentWidgetId: string;
}

const RatingWidget: React.FC<RatingWidgetProps> = ({ data, updateData, isEditable, projectUsers, allWidgets, currentWidgetId }) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const widgetMap = useMemo(() => new Map(allWidgets.map(w => [w.id, w])), [allWidgets]);

    const getWidgetValue = (source: RatingSource): number => {
        const sourceWidget = widgetMap.get(source.widgetId);
        if (!sourceWidget) return 0;
        
        switch(sourceWidget.type) {
            case WidgetType.Plan:
                return (sourceWidget.data as PlanData)[source.dataKey as 'current' | 'target'] || 0;
            case WidgetType.Pie:
                const pieData = sourceWidget.data as PieData;
                return pieData.charts[0]?.[source.dataKey as 'part' | 'total'] || 0;
            case WidgetType.Line:
                const lineData = sourceWidget.data as LineData;
                if (source.dataKey === 'line_sum_y') {
                    return lineData.series[0]?.data.reduce((sum, point) => sum + point.y, 0) || 0;
                }
                return 0;
            default:
                return 0;
        }
    };

    const rankedUsers = useMemo(() => {
        return projectUsers.map(user => {
            const source = data.sources.find(s => s.userId === user.uid);
            const value = source ? getWidgetValue(source) : 0;
            return { user, value };
        })
        .sort((a, b) => b.value - a.value);
    }, [projectUsers, data.sources, allWidgets]);

    const handleSourceChange = (userId: string, dependency: { widgetId: string; dataKey: DependencyDataKey; } | undefined) => {
        const newSources = [...data.sources];
        const sourceIndex = newSources.findIndex(s => s.userId === userId);

        if (dependency) { // Add or update source
            const newSource = { userId, ...dependency };
            if (sourceIndex > -1) {
                newSources[sourceIndex] = newSource;
            } else {
                newSources.push(newSource);
            }
        } else { // Remove source
            if (sourceIndex > -1) {
                newSources.splice(sourceIndex, 1);
            }
        }
        updateData({ ...data, sources: newSources });
    };
    
    const trophyColors = ['text-yellow-400', 'text-gray-400', 'text-amber-600'];

    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow overflow-y-auto pr-1">
                <ul className="space-y-3">
                    {rankedUsers.map(({ user, value }, index) => (
                        <li key={user.uid} className="flex items-center gap-3 p-1">
                            <div className="w-6 text-center font-semibold text-text-secondary">{index + 1}</div>
                            <div className="w-6 flex items-center justify-center flex-shrink-0">
                                {index < 3 ? (
                                    <Trophy size={18} className={trophyColors[index]} />
                                ) : (
                                    <div className="w-[18px]" /> // Placeholder for alignment
                                )}
                            </div>
                            <Avatar user={user} className="w-8 h-8 flex-shrink-0" />
                            <div className="flex-grow min-w-0">
                                <p className="font-semibold truncate">{user.displayName}</p>
                            </div>
                            <div className="font-bold text-right">
                                {value.toLocaleString()}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {isEditable && (
                <div className="mt-4 border-t border-glass-border pt-2 flex-shrink-0">
                    <button 
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="w-full flex justify-between items-center text-left text-xs font-bold text-text-secondary mb-2 px-1 hover:text-text-light transition-colors"
                    >
                        <span>Настройки источников</span>
                        <motion.div animate={{ rotate: isSettingsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown size={16} />
                        </motion.div>
                    </button>
                    <AnimatePresence>
                        {isSettingsOpen && (
                            <motion.div
                                key="settings-content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="max-h-40 overflow-y-auto space-y-2 pr-1 pt-1">
                                    {projectUsers.map(user => (
                                        <div key={user.uid} className="flex items-center gap-2 p-1 bg-white/5 rounded-lg">
                                            <Avatar user={user} className="w-6 h-6 flex-shrink-0" />
                                            <p className="flex-grow font-medium text-xs truncate">{user.displayName}</p>
                                            <div className="w-48">
                                                <DependencySelector
                                                    allWidgets={allWidgets}
                                                    currentWidgetId={currentWidgetId}
                                                    value={data.sources.find(s => s.userId === user.uid)}
                                                    onChange={(dep) => handleSourceChange(user.uid, dep)}
                                                    disabled={!isEditable}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default React.memo(RatingWidget);