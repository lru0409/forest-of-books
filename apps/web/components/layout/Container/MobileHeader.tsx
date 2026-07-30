import Link from 'next/link';

export function MobileHeader() {
  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-40 flex items-center px-4 py-3 shadow-sm md:hidden">
      <Link href="/" className="text-xl font-semibold">
        책의 숲
      </Link>
    </header>
  );
}
