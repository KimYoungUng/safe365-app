import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Base64 Data URL이나 File 객체를 Supabase Storage에 업로드합니다.
 * @param {string|File} fileOrDataUrl - 첨부할 파일 또는 캔버스 서명의 Data URL
 * @param {string} folder - 'signatures', 'tbm_photos' 등 저장할 폴더명
 * @returns {Promise<string|null>} - 업로드된 파일의 공개 URL (실패 시 null)
 */
export async function uploadImageToSupabase(fileOrDataUrl, folder = 'general') {
  if (!fileOrDataUrl) return null;

  try {
    let fileBody;
    let fileName = `${folder}/${Date.now()}_${uuidv4()}`;
    let contentType = 'image/png';

    // Data URL인 경우 (캔버스 서명 등)
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      const arr = fileOrDataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      fileBody = new Blob([u8arr], { type: mime });
      contentType = mime;
      
      const ext = mime.split('/')[1] || 'png';
      fileName += `.${ext}`;
    } 
    // File 객체인 경우 (input type="file")
    else if (fileOrDataUrl instanceof File) {
      fileBody = fileOrDataUrl;
      contentType = fileOrDataUrl.type;
      
      const ext = fileOrDataUrl.name.split('.').pop();
      fileName += `.${ext}`;
    } else {
      // 일반 문자열 URL이거나 이미 업로드된 링크인 경우 그대로 반환
      if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('http')) {
        return fileOrDataUrl;
      }
      return null;
    }

    const { data, error } = await supabase.storage
      .from('files')
      .upload(fileName, fileBody, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('files')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;

  } catch (err) {
    console.error('Exception in uploadImageToSupabase:', err);
    return null;
  }
}
