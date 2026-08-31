/**
 * Extract a color palette from an image using median-cut quantization.
 * Based on: https://dev.to/producthackers/creating-a-color-palette-with-javascript-44ip
 */

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert RGB to Hex string
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b]
    .map((x) => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('')
    .toUpperCase();
};

/**
 * Convert Hex string to RGB
 */
export const hexToRgb = (hex: string): RGBColor | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Calculate relative luminance (perceived brightness) of an RGB color.
 * Uses the sRGB luminance formula.
 */
export const getLuminance = (color: RGBColor): number => {
  const normalize = (c: number) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * normalize(color.r) + 0.7152 * normalize(color.g) + 0.0722 * normalize(color.b);
};

/**
 * Generate the complementary (opposite) color by inverting each channel.
 */
export const getComplementary = (color: RGBColor): RGBColor => {
  return {
    r: 255 - color.r,
    g: 255 - color.g,
    b: 255 - color.b,
  };
};

/**
 * Convert the flat Uint8ClampedArray from getImageData into an array of RGB objects.
 * Skips fully transparent pixels.
 */
const buildRgb = (imageData: Uint8ClampedArray): RGBColor[] => {
  const rgbValues: RGBColor[] = [];
  // Step by 1 pixel for quality; sampleSize skips pixels externally
  for (let i = 0; i < imageData.length; i += 4) {
    const a = imageData[i + 3];
    if (a < 64) continue; // skip transparent pixels
    rgbValues.push({
      r: imageData[i],
      g: imageData[i + 1],
      b: imageData[i + 2],
    });
  }
  return rgbValues;
};

/**
 * Find the color channel (r, g, or b) with the biggest range in the pixel array.
 */
const findBiggestColorRange = (rgbValues: RGBColor[]): 'r' | 'g' | 'b' => {
  let rMin = Number.MAX_VALUE, gMin = Number.MAX_VALUE, bMin = Number.MAX_VALUE;
  let rMax = Number.MIN_VALUE, gMax = Number.MIN_VALUE, bMax = Number.MIN_VALUE;

  for (const pixel of rgbValues) {
    rMin = Math.min(rMin, pixel.r);
    gMin = Math.min(gMin, pixel.g);
    bMin = Math.min(bMin, pixel.b);
    rMax = Math.max(rMax, pixel.r);
    gMax = Math.max(gMax, pixel.g);
    bMax = Math.max(bMax, pixel.b);
  }

  const rRange = rMax - rMin;
  const gRange = gMax - gMin;
  const bRange = bMax - bMin;
  const biggestRange = Math.max(rRange, gRange, bRange);

  if (biggestRange === rRange) return 'r';
  if (biggestRange === gRange) return 'g';
  return 'b';
};

/**
 * Median-cut color quantization.
 * Recursively splits the color space along the channel with the largest range
 * until we reach the desired depth. Each leaf bucket produces one averaged color.
 *
 * @param rgbValues - Array of pixel RGB values
 * @param depth - Current recursion depth
 * @param maxDepth - Maximum depth (produces 2^maxDepth colors)
 */
const quantize = (rgbValues: RGBColor[], depth: number, maxDepth: number): RGBColor[] => {
  // Base case: average the colors in this bucket
  if (depth === maxDepth || rgbValues.length === 0) {
    if (rgbValues.length === 0) {
      return [];
    }
    const sum = rgbValues.reduce(
      (prev, curr) => {
        prev.r += curr.r;
        prev.g += curr.g;
        prev.b += curr.b;
        return prev;
      },
      { r: 0, g: 0, b: 0 }
    );
    return [
      {
        r: sum.r / rgbValues.length,
        g: sum.g / rgbValues.length,
        b: sum.b / rgbValues.length,
      },
    ];
  }

  // Find the channel with the biggest range and sort by it
  const componentToSortBy = findBiggestColorRange(rgbValues);
  rgbValues.sort((a, b) => a[componentToSortBy] - b[componentToSortBy]);

  const mid = Math.floor(rgbValues.length / 2);
  return [
    ...quantize(rgbValues.slice(0, mid), depth + 1, maxDepth),
    ...quantize(rgbValues.slice(mid), depth + 1, maxDepth),
  ];
};

/**
 * Sort colors by luminance (darkest first).
 */
const sortByLuminance = (colors: RGBColor[]): RGBColor[] => {
  return [...colors].sort((a, b) => getLuminance(a) - getLuminance(b));
};

/**
 * Extract a color palette from an image using median-cut quantization.
 *
 * @param imageSrc - URL or data URL of the image
 * @param maxColors - Desired number of palette colors (default 8)
 * @param sampleSize - Sample every Nth pixel (default 2, higher = faster but less accurate)
 * @returns Array of hex color strings, sorted by luminance
 */
export const extractColorsFromImage = (
  imageSrc: string,
  maxColors: number = 8,
  sampleSize: number = 2
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new globalThis.Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Unable to get canvas context'));
          return;
        }

        // Scale down large images for performance (max 300px on longest side)
        const maxDimension = 300;
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);

        // Sample pixels (skip every sampleSize pixels for performance)
        const sampledData = new Uint8ClampedArray(Math.ceil(imageData.data.length / sampleSize) * 4);
        let sampledIndex = 0;
        for (let i = 0; i < imageData.data.length; i += sampleSize * 4) {
          sampledData[sampledIndex] = imageData.data[i];
          sampledData[sampledIndex + 1] = imageData.data[i + 1];
          sampledData[sampledIndex + 2] = imageData.data[i + 2];
          sampledData[sampledIndex + 3] = imageData.data[i + 3];
          sampledIndex += 4;
        }

        // Build RGB array
        const rgbValues = buildRgb(sampledData);

        if (rgbValues.length === 0) {
          resolve(['#808080']);
          return;
        }

        // Calculate max depth from desired color count (power of 2)
        const maxDepth = Math.max(1, Math.ceil(Math.log2(maxColors)));
        const maxTheoreticalColors = Math.pow(2, maxDepth);

        // Run median-cut quantization
        const quantized = quantize(rgbValues, 0, maxDepth);

        // If we have more colors than requested, trim to the most vibrant
        let palette = quantized;
        if (palette.length > maxColors) {
          // Prefer colors with higher saturation (variance from gray)
          palette.sort((a, b) => {
            const satA = Math.max(a.r, a.g, a.b) - Math.min(a.r, a.g, a.b);
            const satB = Math.max(b.r, b.g, b.b) - Math.min(b.r, b.g, b.b);
            return satB - satA;
          });
          palette = palette.slice(0, maxColors);
        }

        // Sort by luminance for a nice gradient display
        palette = sortByLuminance(palette);

        // Convert to hex
        const hexColors = palette.map((c) => rgbToHex(c.r, c.g, c.b));

        resolve(hexColors.length > 0 ? hexColors : ['#808080']);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageSrc;
  });
};
