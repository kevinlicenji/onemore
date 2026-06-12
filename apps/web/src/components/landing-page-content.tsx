import { Button } from '@onemore/ui';
import Link from 'next/link';

interface LandingPageContentProps {
  locale: string;
  alternateLocale: string;
  labels: {
    switchLanguage: string;
    title: string;
    tagline: string;
    featurePrograms: string;
    featureWorkout: string;
    featureProgress: string;
    getStarted: string;
    login: string;
    freeForAthletes: string;
  };
}

/**
 * Public landing page — responsive desktop hero without client hooks.
 */
export function LandingPageContent({
  locale,
  alternateLocale,
  labels,
}: LandingPageContentProps): React.ReactElement {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-between gap-10 p-6 pb-12 lg:max-w-5xl lg:gap-16 lg:px-12 lg:py-16">
      <div className="flex justify-end">
        <Button asChild size="sm" variant="ghost">
          <Link href={`/${alternateLocale}`}>
            {labels.switchLanguage}: {alternateLocale === 'it' ? 'IT' : 'EN'}
          </Link>
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="flex flex-col gap-6 text-center lg:text-left">
          <div>
            <h1 className="text-4xl font-bold tracking-tight lg:text-display">{labels.title}</h1>
            <p className="mt-3 text-lg text-muted-foreground lg:mt-4 lg:text-xl">{labels.tagline}</p>
          </div>

          <ul className="space-y-3 text-left text-sm text-muted-foreground lg:text-base">
            <li className="rounded-lg border p-4 lg:p-5">{labels.featurePrograms}</li>
            <li className="rounded-lg border p-4 lg:p-5">{labels.featureWorkout}</li>
            <li className="rounded-lg border p-4 lg:p-5">{labels.featureProgress}</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 lg:max-w-md lg:justify-center lg:justify-self-end">
          <Button asChild className="min-h-11 w-full lg:min-h-12" size="lg">
            <Link href={`/${locale}/register`}>{labels.getStarted}</Link>
          </Button>
          <Button asChild className="min-h-11 w-full lg:min-h-12" size="lg" variant="outline">
            <Link href={`/${locale}/login`}>{labels.login}</Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground lg:text-sm">{labels.freeForAthletes}</p>
        </div>
      </div>
    </main>
  );
}
