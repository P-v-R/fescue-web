import Image from 'next/image'

export const metadata = {
  title: 'Bay Setup Guide — Fescue',
}

type StepMedia = {
  src: string
  alt: string
}

type SetupStep = {
  text: string
  media?: StepMedia
}

type SetupSection = {
  id: string
  title: string
  system: string
  steps: SetupStep[]
  readyState: string
}

const SETUP_SECTIONS: SetupSection[] = [
  {
    id: 'bays-1-2',
    title: 'Bays 1–2',
    system: 'Foresight',
    steps: [
      {
        text: 'Turn on computer',
      },
      {
        text: 'Turn on launch monitor.',
      },
      {
        text: 'Turn on projector with white BenQ remote',
      },
      {
        text: 'Double-click the "GSPro" icon.',
      },
      {
        text: 'Confirm settings are correct and click OK.',
        media: {
          src: '/bay-setup/foresight-gspro-settings.png',
          alt: 'GSPro configuration settings window',
        },
      },
      {
        text: 'In Connection Manager, select the correct launch monitor (WiFi): 925 or 046. If you see it in the dropdown, select it and click Connect. If you do not see it, click Search, then select the correct launch monitor and click Connect.',
        media: {
          src: '/bay-setup/foresight-connection-manager.png',
          alt: 'Foresight Connection Manager launch monitor dropdown',
        },
      },
      {
        text: 'GSPro should be running on projector screen and you’re ready to practice, play a local round, or start a tournament!',
      },
    ],
    readyState:
      'When the ball is in the hitting zone, the launch monitor should show a solid green or blue light. You’ll get a feel for the detection area after a few shots.',
  },
  {
    id: 'bays-3-4',
    title: 'Bays 3–4',
    system: 'Uneekor',
    steps: [
      {
        text: 'Turn on computer',
      },
      {
        text: 'Turn on projector with white BenQ remote',
      },
      {
        text: 'Click the yellow Uneekor launcher icon',
        media: {
          src: '/bay-setup/desktop.icon.png',
          alt: 'Windows desktop with yellow Uneekor launcher icon',
        },
      },
      {
        text: 'After Uneekor Launcher loads, click the GSPro Launcher icon inside the Uneekor menu.',
        media: {
          src: '/bay-setup/uneekor-launcher-menu.png',
          alt: 'Uneekor Launcher menu with GSPro option',
        },
      },
      {
        text: 'Confirm settings are correct for GSPro and click OK.',
        media: {
          src: '/bay-setup/foresight-gspro-settings.png',
          alt: 'GSPro configuration settings window',
        },
      },
      {
        text: 'GSPro should be running on projector screen and you’re ready to practice, play a local round, or start a tournament!',
      },
    ],
    readyState:
      'The overhead launch monitor will light up when the ball is in the hitting zone. For Bay 3, place the ball on the middle mat on the side closest to the projector screen. For Bay 4, place the ball roughly in the center.',
  },
]

export default function BaySetupPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mb-2">
          Club Resources
        </p>
        <h1 className="font-serif text-2xl sm:text-display font-light text-navy">
          Bay Setup Guide
        </h1>
        <p className="font-sans text-sm font-light text-navy/55 mt-3 leading-relaxed max-w-prose">
          Let’s get you hitting balls.
        </p>
      </div>

      <div className="space-y-10">
        <section>
          <p className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">
            Choose Your Bay
          </p>
          <div className="bg-white border border-cream-mid px-6 py-5">
            <p className="font-sans text-sm font-light text-navy/70 leading-relaxed">
              Use the steps below for the bay you’re playing in.
            </p>
          </div>
        </section>

        {SETUP_SECTIONS.map((section) => (
          <section key={section.title} id={section.id} className="scroll-mt-10">
            <p className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">
              {section.title}
            </p>
            <div className="bg-white border border-cream-mid px-6 py-6">
              <div className="mb-6">
                <h2 className="font-serif text-2xl font-light text-navy">
                  {section.title}
                </h2>
                <p className="font-mono text-label uppercase tracking-[0.28em] text-gold mt-2">
                  {section.system}
                </p>
              </div>

              <ol className="space-y-3">
                {section.steps.map((step, index) => (
                  <li key={step.text} className="flex gap-3">
                    <span className="font-mono text-xs text-gold shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-sm font-light text-navy/70 leading-relaxed">
                        {step.text}
                      </p>
                      {step.media ? (
                        <Image
                          src={step.media.src}
                          alt={step.media.alt}
                          width={800}
                          height={500}
                          className="mt-4 w-full border border-cream-mid"
                        />
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-6 border-t border-cream-mid pt-5">
                <p className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-3">
                  What Ready To Play Looks Like
                </p>
                <p className="font-sans text-sm font-light text-navy/70 leading-relaxed">
                  {section.readyState}
                </p>
              </div>
            </div>
          </section>
        ))}

        <section>
          <p className="font-mono text-label uppercase tracking-[0.28em] text-sage mb-5">
            Still Stuck?
          </p>
          <div className="bg-white border border-cream-mid px-6 py-6">
            <p className="font-sans text-sm font-light text-navy/70 leading-relaxed">
              Don&apos;t hesitate to call:
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-serif text-2xl font-light text-navy">Zack</p>
                <p className="font-sans text-sm font-light text-navy/70 mt-1">
                  954-638-2534
                </p>
              </div>
              <div>
                <p className="font-serif text-2xl font-light text-navy">Sean</p>
                <p className="font-sans text-sm font-light text-navy/70 mt-1">
                  818-693-4971
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
