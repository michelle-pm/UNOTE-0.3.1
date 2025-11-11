import React from 'react';
import { TextData } from '../../types';

interface TextWidgetProps {
  data: TextData;
  updateData: (data: TextData) => void;
  isEditable: boolean;
}

const TextWidget: React.FC<TextWidgetProps> = ({ data, updateData, isEditable }) => {
  const { content } = data;

  const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    event.target.select();
  };

  return (
    <div className="h-full flex flex-col">
      <textarea
        value={content}
        onChange={(e) => updateData({ ...data, content: e.target.value })}
        onFocus={handleFocus}
        disabled={!isEditable}
        className="flex-grow w-full bg-transparent resize-none text-sm text-text-primary/90 focus:outline-none leading-relaxed p-1 -m-1 rounded-md hover:bg-white/5 focus:bg-white/10 transition-colors disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        placeholder="Введите ваш текст здесь..."
      />
    </div>
  );
};

export default React.memo(TextWidget);