import { buildAppearanceInitScript } from '@/lib/appearance/apply-appearance';

/**
 * Blocking inline script that restores color theme and font before first paint.
 */
export function AppearanceInitScript(): React.ReactElement {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: buildAppearanceInitScript(),
      }}
    />
  );
}
