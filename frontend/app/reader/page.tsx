import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getReaderBook } from "@/lib/reader-data";
import { ReaderView } from "@/components/reader/reader-view";

function ReaderSkeleton() {
  return (
    <div className="mx-auto max-w-prose space-y-4 px-4 py-8">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/4" />
      <div className="space-y-3 pt-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-5 ${i % 3 === 0 ? "w-5/6" : i % 3 === 1 ? "w-full" : "w-4/5"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between pt-6">
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  );
}

interface ReaderPageProps {
  searchParams: Promise<{ book?: string }>;
}

async function ReaderContent({ bookId }: { bookId: string }) {
  const book = getReaderBook(bookId);
  if (!book) notFound();
  return <ReaderView book={book} />;
}

export default async function ReaderPage({ searchParams }: ReaderPageProps) {
  const params = await searchParams;
  const bookId = params.book;

  if (!bookId) notFound();

  return (
    <Suspense fallback={<ReaderSkeleton />}>
      <ReaderContent bookId={bookId} />
    </Suspense>
  );
}
