/**
 * CSP-compliant styling utilities
 * Provides helper functions to convert dynamic styles to CSS classes where possible
 */

// Convert dynamic width percentages to CSS classes
export function getProgressBarClass(percentage: number): string {
  const rounded = Math.round(Math.max(0, Math.min(100, percentage)));
  return `progress-bar-${rounded}`;
}

// Convert font sizes to CSS classes
export function getFontSizeClass(size: number): string {
  const sizes = [10, 12, 14, 16, 18, 20, 22, 24];
  const closest = sizes.reduce((prev, curr) =>
    Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev,
  );
  return `font-size-${closest}`;
}

// For complex positioning that can't be pre-defined, return CSS variables
export function getDynamicPositionStyle(
  x: number,
  y: number,
  width?: number,
  height?: number,
) {
  const style: Record<string, string> = {
    "--dynamic-x": `${x}px`,
    "--dynamic-y": `${y}px`,
  };

  if (width !== undefined) {
    style["--dynamic-width"] = `${width}px`;
  }

  if (height !== undefined) {
    style["--dynamic-height"] = `${height}px`;
  }

  return style;
}

// For timeline positioning
export function getTimelinePositionClass(percentage: number): string {
  const rounded = Math.round(Math.max(0, Math.min(100, percentage)));
  return `timeline-position-${rounded}`;
}

// For timeline width
export function getTimelineWidthClass(percentage: number): string {
  const rounded = Math.round(Math.max(0, Math.min(100, percentage)));
  return `timeline-width-${rounded}`;
}
