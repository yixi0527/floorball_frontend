export function checkFileType(file: File, accepts: string[]) {
  let reg;
  if (!accepts || accepts.length === 0) {
    reg = /.(jpg|jpeg|png|gif|webp)$/i;
  } else {
    const newTypes = accepts.join('|');
    reg = new RegExp('\\.(' + newTypes + ')$', 'i');
  }
  return reg.test(file.name);
}

export function checkImgType(file: File) {
  return isImgTypeByName(file.name);
}

export function checkVideoType(file: File) {
  return isVideoTypeByName(file.name);
}

export function isImgTypeByName(name: string) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
}

export function isVideoTypeByName(name: string) {
  return /\.(mp4|mov|avi|rmvb|flv|mkv)$/i.test(name);
}

export function getBase64WithFile(file: File) {
  return new Promise<{
    result: string;
    file: File;
  }>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve({ result: reader.result as string, file });
    reader.onerror = (error) => reject(error);
  });
}

export function getVideoThumbnail(file: File): Promise<{ result: string; file: File }> {
  return new Promise<{
    result: string; 
    file: File 
  }>((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      resolve({ result: '', file });
      return;
    }
    video.src = URL.createObjectURL(file);
    video.onloadeddata = () => {
      // 设置 canvas 大小为视频的尺寸
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      // 抓取视频的第一帧
      video.currentTime = 1;
      video.onseeked = () => {
        // 将视频帧绘制到 canvas 上
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbUrl = canvas.toDataURL('image/png'); // 转为图片 URL
        resolve({ result: thumbUrl as string, file }); // 返回缩略图 URL 和文件
      };
    };
    video.onerror = () => {
      resolve({ result: '', file }); // 如果视频加载失败，返回 null 和文件
    };
  });
}
