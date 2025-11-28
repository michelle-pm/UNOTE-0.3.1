
// Вставьте ваши данные из Cloudinary Dashboard здесь
const CLOUD_NAME = "dmkbe5jaj"; 
const UPLOAD_PRESET = "ml_default"; // ВАЖНО: Создайте этот пресет в настройках Cloudinary (Settings -> Upload) и сделайте его "Unsigned"

export const uploadToCloudinary = async (file: File, resourceType: 'image' | 'raw' | 'auto' = 'auto'): Promise<{ url: string; name: string; type: string }> => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary не настроен. Пожалуйста, укажите Cloud Name и Upload Preset в utils/cloudinary.ts");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Cloudinary error details:", errorData);
      
      if (errorData.error?.message?.includes("preset")) {
         throw new Error("Ошибка Cloudinary: Неверный Upload Preset. Зайдите в настройки Cloudinary -> Upload, создайте пресет 'ml_default' и выберите Mode: 'Unsigned'.");
      }
      
      throw new Error(errorData.error?.message || 'Ошибка загрузки в Cloudinary');
    }

    const data = await response.json();
    
    // Cloudinary возвращает http версию, лучше сразу использовать https
    const secureUrl = data.secure_url;

    return {
        url: secureUrl,
        name: data.original_filename,
        type: data.format || data.resource_type
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};
