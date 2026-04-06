import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

export type ScreenSize = 'small' | 'medium' | 'large';

interface ResponsiveValues {
  screenSize: ScreenSize;
  isTablet: boolean;
  isLandscape: boolean;
  width: number;
  height: number;
  columns: 1 | 2 | 3;
  contentPadding: number;
}

export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const screenSize: ScreenSize =
      width < 375 ? 'small' : width <= 768 ? 'medium' : 'large';

    const isTablet = width > 768;
    const isLandscape = width > height;

    const columns: 1 | 2 | 3 =
      width > 1024 ? 3 : width > 768 ? 2 : 1;

    const contentPadding =
      width > 1024 ? 32 : width > 768 ? 24 : 16;

    return {
      screenSize,
      isTablet,
      isLandscape,
      width,
      height,
      columns,
      contentPadding,
    };
  }, [width, height]);
}
