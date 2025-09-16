/**
 * Color Constants - Predefined color palettes for Tailwind CSS utilities
 *
 * This module provides predefined color options for text and background colors
 * used in the visual editor's color picker components. Each color includes
 * the Tailwind class name, human-readable name, and hex value for tooltips.
 */

export interface ColorOption {
  name: string;
  className: string;
  hex?: string;
}

// Predefined color palettes
export const TEXT_COLORS: ColorOption[] = [
  { name: 'Black', className: 'text-black', hex: '#000000' },
  { name: 'White', className: 'text-white', hex: '#ffffff' },
  { name: 'Gray 500', className: 'text-gray-500', hex: '#6b7280' },
  { name: 'Gray 700', className: 'text-gray-700', hex: '#374151' },
  { name: 'Red 500', className: 'text-red-500', hex: '#ef4444' },
  { name: 'Blue 500', className: 'text-blue-500', hex: '#3b82f6' },
  { name: 'Green 500', className: 'text-green-500', hex: '#10b981' },
  { name: 'Yellow 500', className: 'text-yellow-500', hex: '#eab308' },
  { name: 'Purple 500', className: 'text-purple-500', hex: '#8b5cf6' },
  { name: 'Pink 500', className: 'text-pink-500', hex: '#ec4899' },
  { name: 'Indigo 500', className: 'text-indigo-500', hex: '#6366f1' },
  { name: 'Teal 500', className: 'text-teal-500', hex: '#14b8a6' },
  { name: 'Orange 500', className: 'text-orange-500', hex: '#f97316' },
  { name: 'Slate 500', className: 'text-slate-500', hex: '#64748b' },
];

export const BACKGROUND_COLORS: ColorOption[] = [
  { name: 'White', className: 'bg-white', hex: '#ffffff' },
  { name: 'Gray 50', className: 'bg-gray-50', hex: '#f9fafb' },
  { name: 'Gray 100', className: 'bg-gray-100', hex: '#f3f4f6' },
  { name: 'Red 50', className: 'bg-red-50', hex: '#fef2f2' },
  { name: 'Red 100', className: 'bg-red-100', hex: '#fee2e2' },
  { name: 'Blue 50', className: 'bg-blue-50', hex: '#eff6ff' },
  { name: 'Blue 100', className: 'bg-blue-100', hex: '#dbeafe' },
  { name: 'Green 50', className: 'bg-green-50', hex: '#f0fdf4' },
  { name: 'Green 100', className: 'bg-green-100', hex: '#dcfce7' },
  { name: 'Yellow 50', className: 'bg-yellow-50', hex: '#fffbeb' },
  { name: 'Yellow 100', className: 'bg-yellow-100', hex: '#fef3c7' },
  { name: 'Purple 50', className: 'bg-purple-50', hex: '#faf5ff' },
  { name: 'Purple 100', className: 'bg-purple-100', hex: '#f3e8ff' },
  { name: 'Pink 50', className: 'bg-pink-50', hex: '#fdf2f8' },
  { name: 'Pink 100', className: 'bg-pink-100', hex: '#fce7f3' },
];