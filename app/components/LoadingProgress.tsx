export default function LoadingProgress({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
      <p className="text-gray-700 font-medium">{message}</p>
      <p className="text-gray-500 text-sm mt-2">This may take a few moments...</p>
    </div>
  );
}
