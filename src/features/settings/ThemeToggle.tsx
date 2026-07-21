import { RadioGroup } from '@/ui/Form/RadioGroup';
import { Icon } from '@/ui/Icon/Icon';
import { useThemePreference } from './useThemePreference';
import type { ThemeChoice } from '@/lib/theme/theme';

const OPTIONS = [
  { value: 'system' as const, label: 'System', icon: <Icon name="system" size={18} /> },
  { value: 'light' as const, label: 'Hell', icon: <Icon name="sun" size={18} /> },
  { value: 'dark' as const, label: 'Dunkel', icon: <Icon name="moon" size={18} /> },
];

/** Theme selector (System / Hell / Dunkel), design-system §18.5. */
export function ThemeToggle({ hideLegend = false }: { hideLegend?: boolean }): React.JSX.Element {
  const { themeChoice, setThemeChoice } = useThemePreference();
  return (
    <RadioGroup<ThemeChoice>
      legend="Erscheinungsbild"
      hideLegend={hideLegend}
      value={themeChoice}
      options={OPTIONS}
      onValueChange={setThemeChoice}
    />
  );
}
