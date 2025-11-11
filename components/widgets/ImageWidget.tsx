import React, { useRef, useState } from 'react';
import { ImageData } from '../../types';
import { Upload, X, Loader2 } from 'lucide-react';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

interface ImageWidgetProps {
  data: ImageData;
  updateData: (data: ImageData) => void;
  isEditable: boolean;
}

const ImageWidget: React.FC<ImageWidgetProps> = ({ data, updateData, isEditable }) => {
  const { title, src, storagePath } = data;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpdate = (updates: Partial<ImageData>) => {
    // When removing, ensure storagePath is explicitly set to undefined for clean-up
    const newData = { ...data, ...updates };
    if (updates.src === null) {
      delete (newData as Partial<ImageData>).storagePath;
    }
    updateData(newData);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && isEditable) {
      setIsUploading(true);

      // If there's an old image, remove it from storage first
      if (storagePath) {
        const oldRef = ref(storage, storagePath);
        try {
          await deleteObject(oldRef);
        } catch (error) {
          console.warn("Old image deletion failed, continuing with upload:", error);
        }
      }

      const newStoragePath = `images/${uuidv4()}-${file.name}`;
      const storageRef = ref(storage, newStoragePath);

      try {
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        handleUpdate({ src: downloadURL, storagePath: newStoragePath });
      } catch (error) {
        console.error("Error uploading image:", error);
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
    if (!storagePath) {
      handleUpdate({ src: null });
      return;
    }
    const fileRef = ref(storage, storagePath);
    try {
      await deleteObject(fileRef);
      handleUpdate({ src: null });
    } catch (error) {
      console.error("Error deleting image from storage:", error);
    }
  };

  return (
    <div className="h-full flex flex-col text-sm">
      <div className="flex-grow relative flex items-center justify-center rounded-xl bg-white/5 overflow-hidden group">
        {isUploading ? (
          <div className="flex flex-col items-center justify-center text-text-secondary">
            <Loader2 size={24} className="animate-spin" />
            <span className="mt-2 text-xs font-medium">Загрузка...</span>
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
          disabled={!isEditable || isUploading}
        />
      </div>
    </div>
  );
};

export default React.memo(ImageWidget);