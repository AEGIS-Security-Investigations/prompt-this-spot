/** Decode an image source (normally the capture's data URL) for canvas use. */
export const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Couldn't load the screenshot to mark it up"));
    image.src = source;
  });
