
import React, { useRef, useState } from 'react';
import { ImageData } from '../../types';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';

interface ImageWidgetProps {
  data: ImageData;
  updateData: (data: ImageData) => void;
  isEditable: boolean;
}

const ImageWidget: React.FC<ImageWidgetProps> = ({ data, updateData, isEditable }) => {
  const { title, src } = data;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = (updates: Partial<ImageData>) => {
    updateData({ ...data, ...updates });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    if (file && isEditable) {
      setIsUploading(true);

      try {
        const result = await uploadToCloudinary(file, 'image');
        handleUpdate({ src: result.url });
      } catch (error: any) {
        console.error("Error uploading image:", error);
        setError("Ошибка загрузки. Проверьте настройки Cloudinary.");
      } finally {
        setIsUploading(false);
      }
    }
    // Reset file input to allow uploading the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const triggerFileInput = () => {
    if (isEditable) {
      fileInputRef.current?.click();
    }
  };

  const removeImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // При использовании Cloudinary мы просто удаляем ссылку. 
    // Для реального удаления с сервера нужен backend с секретным ключом, 
    // но для frontend-only приложения просто забываем ссылку.
    handleUpdate({ src: null });
  };

  return (
    <div className="h-full flex flex-col text-sm">
      <div className="flex-grow relative flex items-center justify-center rounded-xl bg-white/5 overflow-hidden group">
        {isUploading ? (
          <div className="flex flex-col items-center justify-center text-text-secondary">
            <Loader2 size={24} className="animate-spin" />
            <span className="mt-2 text-xs font-medium">Загрузка в облако...</span>
          </div>
        ) : src ? (
          <>
            <img src={src} alt={title} className="w-full h-full object-cover" />
            {isEditable && (
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Удалить изображение"
              >
                <X size={16} />
              </button>
            )}
          </>
        ) : (
          <button
            onClick={triggerFileInput}
            disabled={!isEditable}
            className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-white/10 rounded-xl text-text-secondary disabled:cursor-not-allowed disabled:opacity-70 enabled:hover:border-accent/30 enabled:hover:text-accent transition-colors relative"
          >
            <Upload size={24} />
            <span className="mt-2 text-xs font-medium">{isEditable ? 'Загрузить изображение' : 'Нет изображения'}</span>
            {error && <span className="absolute bottom-2 text-red-400 text-[10px] text-center px-2">{error}</span>}
          </button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={!isEditable || isUploading}
        />
      </div>
    </div>
  );
};

export default React.memo(ImageWidget);
