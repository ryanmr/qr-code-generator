import { Slider as BaseSlider } from '@base-ui/react/slider';
import { cn } from '@/lib/utils';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
  'aria-label'?: string;
}

export function Slider({ value, onChange, min, max, step = 1, className, ...aria }: SliderProps) {
  return (
    <BaseSlider.Root
      value={value}
      onValueChange={(v) => onChange(Array.isArray(v) ? (v[0] ?? min) : (v as number))}
      min={min}
      max={max}
      step={step}
      className={cn('w-full', className)}
    >
      <BaseSlider.Control className="flex h-5 w-full touch-none items-center select-none">
        <BaseSlider.Track className="relative h-1.5 w-full rounded-full bg-secondary">
          <BaseSlider.Indicator className="rounded-full bg-primary" />
          <BaseSlider.Thumb
            aria-label={aria['aria-label']}
            className="size-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
