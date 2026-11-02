import heroImage from './english_learning_hero_1790648876420.jpg';
import travelImage from './travel_english_art_1790648889488.jpg';
import businessImage from './business_english_art_1790648901506.jpg';

/**
 * Bundled artwork. Importing through Vite (instead of hard-coding
 * `/src/assets/...`) is what makes the files exist in a production build.
 */
export const IMAGES = {
  hero: heroImage,
  travel: travelImage,
  business: businessImage,
} as const;

export type ImageKey = keyof typeof IMAGES;
