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
    <div className="flex h-full flex-col gap-2 overflow-hidden">
      {sections.map(section => {
        const isOpen = openSection === section.id;

        return (
          <section
            key={section.id}
            className={`flex flex-col overflow-hidden rounded-card transition-all ${
              isOpen 
                ? 'flex-1 bg-bg-900/80 border border-primary-500/50' 
                : 'bg-bg-800/60 border border-border/40'
            }`}
          >
            <button
              type="button"
              onClick={() => onChange(section.id)}
              className={`grid min-h-[56px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-all hover:bg-bg-800/80 ${
                isOpen ? 'bg-bg-800/40' : ''
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {section.icon}
              </span>
              <div className="flex items-center gap-2 font-display text-lg font-bold text-white">
                <span>{section.label}</span>
                {section.badge && (
                  <span className="rounded-pill bg-bg-700/80 px-2 py-1 text-xs font-semibold text-text-subtle">
                    {section.badge}
                  </span>
                )}
              </div>
              <div className="justify-self-end text-right text-sm font-semibold text-white">
                {section.summary}
              </div>
            </button>

            {isOpen && (
              <div className="flex-1 overflow-auto px-4 pb-4">
                {section.content}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};
