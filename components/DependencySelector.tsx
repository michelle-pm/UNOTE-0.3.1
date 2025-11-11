import React from 'react';
import { Widget, WidgetType, DependencyDataKey, LineDataPoint } from '../types';

interface DependencySelectorProps {
  allWidgets: Widget[];
  currentWidgetId: string;
  value: LineDataPoint['dependency'];
  onChange: (dependency: LineDataPoint['dependency'] | undefined) => void;
  disabled: boolean;
}

const DependencySelector: React.FC<DependencySelectorProps> = ({ allWidgets, currentWidgetId, value, onChange, disabled }) => {
  const compatibleWidgets = allWidgets.filter(
    w =>
      w.id !== currentWidgetId &&
      (w.type === WidgetType.Plan || w.type === WidgetType.Pie)
  );

  const selectedWidget = compatibleWidgets.find(w => w.id === value?.widgetId);

  const getDataKeys = (widgetType: WidgetType | undefined): { value: DependencyDataKey; label: string }[] => {
    if (widgetType === WidgetType.Plan) {
      return [
        { value: 'current', label: 'Текущее' },
        { value: 'target', label: 'Целевое' },
      ];
    }
    if (widgetType === WidgetType.Pie) {
      return [
        { value: 'part', label: 'Часть' },
        { value: 'total', label: 'Всего' },
      ];
    }
    return [];
  };

  const availableDataKeys = selectedWidget ? getDataKeys(selectedWidget.type) : [];

  const handleWidgetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const widgetId = e.target.value;
    if (widgetId) {
      const newSelectedWidget = compatibleWidgets.find(w => w.id === widgetId);
      const newKeys = getDataKeys(newSelectedWidget?.type);
      const dataKey = newKeys.length > 0 ? newKeys[0].value : undefined;
      if (dataKey) {
        onChange({ widgetId, dataKey });
      }
    } else {
      onChange(undefined);
    }
  };

  const handleDataKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dataKey = e.target.value as DependencyDataKey;
    if (value?.widgetId && dataKey) {
      onChange({ widgetId: value.widgetId, dataKey });
    }
  };
  
  if (compatibleWidgets.length === 0) {
      return <div className="w-full h-full min-h-[26px]"></div>;
  }

  return (
    <div className="flex items-center gap-1 text-xs w-full">
      <select
        value={value?.widgetId || ''}
        onChange={handleWidgetChange}
        disabled={disabled}
        className="bg-transparent text-xs rounded-md p-1 no-drag hover:bg-white/5 focus:outline-none w-full disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        aria-label="Select widget dependency"
      >
        <option value="">Без привязки</option>
        {compatibleWidgets.map(w => (
          <option key={w.id} value={w.id}>
            {w.data.title}
          </option>
        ))}
      </select>
      {value?.widgetId && availableDataKeys.length > 0 && (
            <select
            value={value.dataKey || ''}
            onChange={handleDataKeyChange}
            disabled={disabled}
            className="bg-transparent text-xs rounded-md p-1 no-drag hover:bg-white/5 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            aria-label="Select data key dependency"
            >
            {availableDataKeys.map(key => (
                <option key={key.value} value={key.value}>
                {key.label}
                </option>
            ))}
            </select>
      )}
    </div>
  );
};

export default DependencySelector;