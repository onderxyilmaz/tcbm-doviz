function LoadingSpinner({ message }) {
  return (
    <div className="flex flex-col justify-center items-center py-12 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {message}
        </p>
      )}
    </div>
  );
}

export default LoadingSpinner;
