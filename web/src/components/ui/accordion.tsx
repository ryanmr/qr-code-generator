import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const Accordion = BaseAccordion.Root;

export function AccordionSection({
  value,
  title,
  icon,
  summary,
  children,
}: {
  value: string;
  title: string;
  icon?: ReactNode;
  /** A short read-out of the current settings, shown while collapsed. */
  summary?: ReactNode;
  children: ReactNode;
}) {
  return (
    <BaseAccordion.Item value={value} className="border-b last:border-b-0">
      <BaseAccordion.Header>
        <BaseAccordion.Trigger className="group flex w-full items-center gap-2 py-3 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4 [&_svg]:shrink-0">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span>{title}</span>
          {summary && (
            <span className="ml-auto truncate pl-2 text-xs font-normal text-muted-foreground group-data-[panel-open]:hidden">
              {summary}
            </span>
          )}
          <ChevronDown
            className={cn(
              'text-muted-foreground transition-transform group-data-[panel-open]:rotate-180',
              !summary && 'ml-auto',
            )}
          />
        </BaseAccordion.Trigger>
      </BaseAccordion.Header>
      <BaseAccordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
        <div className="space-y-4 pb-4 pt-1">{children}</div>
      </BaseAccordion.Panel>
    </BaseAccordion.Item>
  );
}
