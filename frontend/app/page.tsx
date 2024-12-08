export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Welcome to Your App
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          This is a sample home page. You can customize it according to your needs.
        </p>
      </div>
    </div>
  );
}
