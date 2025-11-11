import React, { useRef } from 'react';
import { FileData, FileObject } from '../../types';
import { Upload, X, File as FileIcon, Download, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface FileWidgetProps {
  data: FileData;
  updateData: (data: FileData) => void;
  isEditable: boolean;
}

const FileWidget: React.FC<FileWidgetProps> = ({ data, updateData, isEditable }) => {
  const { files } = data;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const filePromises = Array.from(selectedFiles).map((file: File) => {
        return new Promise<FileObject>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              id: uuidv4(),
              name: file.name,
              fileType: file.type,
              url: e.target?.result as string,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then(newFiles => {
        updateData({
          ...data,
          files: [...data.files, ...newFiles],
        });
      }).catch(error => {
        console.error("Error reading files:", error);
      });
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
  
  const removeFile = (id: string) => {
    updateData({
      ...data,
      files: data.files.filter(f => f.id !== id),
    });
  }

  return (
    <div className="h-full flex flex-col text-sm">
      <div className="flex-grow relative flex items-center justify-center rounded-xl bg-white/5 overflow-hidden">
        {files && files.length > 0 ? (
          <div className="w-full h-full flex flex-col">
            <ul className="flex-grow overflow-y-auto p-2 space-y-2">
              {files.map(file => (
                <li key={file.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <FileIcon size={20} className="flex-shrink-0 text-accent/80" />
                  <div className="flex-grow overflow-hidden">
                    <p className="font-medium truncate text-xs">{file.name}</p>
                  </div>
                  <a 
                    href={file.url} 
                    download={file.name}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/10 opacity-0 group-hover:opacity-100"
                    aria-label="Скачать файл"
                  >
                    <Download size={14} />
                  </a>
                  {isEditable && (
                    <button
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 rounded-full text-red-500/70 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
                        aria-label="Удалить файл"
                    >
                        <X size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {isEditable && (
                 <div className="absolute bottom-3 right-3">
                    <button onClick={triggerFileInput} className="flex items-center justify-center w-8 h-8 bg-accent/80 text-accent-text hover:bg-accent rounded-full shadow-lg transition-colors">
                        <Plus size={18} />
                    </button>
                 </div>
            )}
          </div>
        ) : (
          <button
            onClick={triggerFileInput}
            disabled={!isEditable}
            className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-white/10 rounded-xl text-text-secondary disabled:cursor-not-allowed disabled:opacity-70 enabled:hover:border-accent/30 enabled:hover:text-accent transition-colors"
          >
            <Upload size={24} />
            <span className="mt-2 text-xs font-medium">{isEditable ? 'Загрузить файлы' : 'Нет файлов'}</span>
          </button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          disabled={!isEditable}
        />
      </div>
    </div>
  );
};

export default React.memo(FileWidget);