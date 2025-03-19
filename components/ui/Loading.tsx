// components/ui/Loading.tsx
type LoadingProps = {
    message?: string;
  };
  
  export default function Loading({ message = 'Loading...' }: LoadingProps) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-steel-blue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    );
  }