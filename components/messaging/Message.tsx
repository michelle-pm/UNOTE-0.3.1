import React from 'react';
import { motion } from 'framer-motion';
import { Message as MessageType } from '../../types';

interface MessageProps {
  message: MessageType;
  isOwnMessage: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isOwnMessage }) => {
  const alignment = isOwnMessage ? 'items-end' : 'items-start';
  const bubbleStyles = isOwnMessage
    ? 'bg-accent text-accent-text rounded-br-lg'
    : 'bg-white/10 text-text-light rounded-bl-lg';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`w-full flex flex-col ${alignment}`}
    >
      <div
        className={`px-4 py-2 rounded-2xl max-w-xs md:max-w-md break-words ${bubbleStyles}`}
      >
        <p className="text-sm" style={{ overflowWrap: 'break-word' }}>{message.text}</p>
      </div>
    </motion.div>
  );
};

export default Message;
