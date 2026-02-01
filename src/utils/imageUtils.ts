/**
 * Pöörab pildi 90 kraadi kui see on landscape formaadis
 * Et dokumendid oleksid alati püstises formaadis
 */
export const rotateImageIfNeeded = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            // Kui pilt on laiem kui kõrgem (landscape), siis pöörame 90 kraadi
            if (img.width > img.height) {
                const canvas = document.createElement('canvas');
                canvas.width = img.height;
                canvas.height = img.width;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.rotate((90 * Math.PI) / 180);
                    ctx.drawImage(img, -img.width / 2, -img.height / 2);
                    resolve(canvas.toDataURL('image/jpeg', 0.9));
                    return;
                }
            }
            resolve(base64Str);
        };
    });
};

/**
 * Konverteerib base64 pildi Blob-iks
 */
export const base64ToBlob = async (base64: string): Promise<Blob> => {
    const response = await fetch(base64);
    return response.blob();
};

/**
 * Genereerib faili nime kuupäeva põhjal
 */
export const generateFileName = (prefix: string = 'Dokument', ext: string = 'jpg'): string => {
    const dateStr = new Date().toISOString().split('T')[0];
    const randomNum = Math.floor(Math.random() * 1000);
    return `${prefix}_${dateStr}_${randomNum}.${ext}`;
};
