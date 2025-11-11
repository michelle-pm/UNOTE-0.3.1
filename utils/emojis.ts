export const projectEmojis = [
  '🚀', '💼', '💡', '📈', '🎯', '📚', '🎨', '🧪', '🌐', '🛠️',
  '📅', '💰', '🧑‍💻', '🏠', '🔗', '🔒', '☁️', '⚙️', '📦', '🎁'
];

export const getRandomEmoji = (): string => {
  return projectEmojis[Math.floor(Math.random() * projectEmojis.length)];
};
