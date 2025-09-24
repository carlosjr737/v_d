import React from 'react';

type SectionId = 'mode' | 'intensity' | 'players';

interface SetupAccordionSection {
  id: SectionId;
  icon: React.ReactNode;
  label: string;
  summary: React.ReactNode;
  badge?: string;
  content: React.ReactNode;
}

interface SetupAccordionProps {
  sections: SetupAccordionSection[];
  openSection: SectionId;
  onChange: (section: SectionId) => void;
}

export const SetupAccordion: React.FC<SetupAccordionProps> = ({
  sections,
  openSection,
  onChange,
}) => {
  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden max-[390px]:gap-2">
      {sections.map(section => {
        const isOpen = openSection === section.id;

        return (
          <section
            key={section.id}
            className="flex flex-col overflow-hidden rounded-[22px] border border-[var(--color-border)]/60 bg-[var(--color-bg-900)]/60"
          >
            <button
              type="button"
              onClick={() => onChange(section.id)}
              className="grid min-h-[60px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg-800)]/60 max-[390px]:min-h-[52px]"
            >
              <span className="text-xl" aria-hidden>
                {section.icon}
              </span>
              <div className="flex items-center gap-2 text-[clamp(16px,4.5vw,18px)] font-semibold">
                <span>{section.label}</span>
                {section.badge && (
                  <span className="rounded-full border border-[var(--color-border)] px-2 py-[3px] text-[10px] uppercase tracking-[0.28em] text-text-subtle/80">
                    {section.badge}
                  </span>
                )}
              </div>
              <div className="justify-self-end text-right text-[clamp(13px,3.2vw,15px)] font-medium text-text-subtle">
                {section.summary}
              </div>
            </button>

            {isOpen && (
              <div className="space-y-3 px-4 pb-4 text-sm text-text-subtle">
                {section.content}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};
