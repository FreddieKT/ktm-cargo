import { supabase } from '../supabaseClient';

export const uploadFile = async (file, bucket = 'uploads') => {
  if (!file) {
    throw new Error('No file provided');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file);

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return { url: publicUrl, path: filePath };
};
