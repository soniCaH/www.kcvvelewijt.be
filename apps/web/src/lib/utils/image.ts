/**
 * Get image dimensions with fallback defaults
 * @param width - Image width
 * @param height - Image height
 */
export const getImageDimensions = (width?: number, height?: number) => {
  return {
    width: width || 1200,
    height: height || 800,
  };
};

/**
 * Calculate aspect ratio from width and height
 */
export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
};
