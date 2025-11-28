import React from 'react';
import { motion } from 'framer-motion';
import { X, Download } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
      >
        <X size={24} />
      </button>
      
      <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
        <motion.img
          src={src}
          alt={alt || 'Full size'}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
        <div className="absolute bottom-4 right-4">
             <a 
                href={src} 
                download 
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white flex items-center gap-2 backdrop-blur-md transition-colors"
                onClick={(e) => e.stopPropagation()}
             >
                 <Download size={20} />
             </a>
        </div>
      </div>
    </motion.div>
  );
};

export default ImageViewer;