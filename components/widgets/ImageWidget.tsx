import React, { useRef, useState, useEffect } from 'react';
import { ImageData } from '../../types';
import { Upload, X } from 'lucide-react';

interface ImageWidgetProps {
  data: ImageData;
  updateData: (data: ImageData) => void;
  isEditable: boolean;
}

const ImageWidget: React.FC<ImageWidgetProps> = ({ data, updateData, isEditable }) => {
  const { title, src } = data;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // When the src from props changes (e.g., loaded from storage), update the object URL
  useEffect(() => {
    setObjectUrl(src);
  }, [src]);

  const handleUpdate = (field: keyof ImageData, value: string | null) => {
    updateData({ ...data, [field]: value });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          // Update parent state with serializable base64 string
          handleUpdate('src', result);
          // Now that we have the permanent base64, revoke any temporary blob URLs
          if (objectUrl && objectUrl.startsWith('blob:')) {
              URL.revokeObjectURL(objectUrl);
          }
          // Update the local preview to use the base64 string for consistency
          setObjectUrl(result);
        }
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input to allow uploading the same file again
    if(event.target) {
        event.target.value = '';
    }
  };

  const triggerFileInput = () => {
    if (isEditable) {
      fileInputRef.current?.click();
    }
  };
  
  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
    }
    setObjectUrl(null);
    handleUpdate('src', null);
  }
  
  // Cleanup object URL on component unmount
  useEffect(() => {
    return () => {
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);


  return (
    <div className="h-full flex flex-col text-sm">
      <div className="flex-grow relative flex items-center justify-center rounded-xl bg-white/5 overflow-hidden">
        {objectUrl ? (
          <>
            <img src={objectUrl} alt={title} className="w-full h-full object-cover" />
            {isEditable && (
              <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Удалить изображение"
              >
                  <X size={14} />
              </button>
            )}
          </>
        ) : (
          <button
            onClick={triggerFileInput}
            disabled={!isEditable}
            className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-white/10 rounded-xl text-text-secondary disabled:cursor-not-allowed disabled:opacity-70 enabled:hover:border-accent/30 enabled:hover:text-accent transition-colors"
          >
            <Upload size={24} />
            <span className="mt-2 text-xs font-medium">{isEditable ? 'Загрузить изображение' : 'Нет изображения'}</span>
          </button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={!isEditable}
        />
      </div>
    </div>
  );
};

export default React.memo(ImageWidget);