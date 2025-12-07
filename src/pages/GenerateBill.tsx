import { BillStepper } from '../components/forms/BillStepper';
import { ErrorBoundary } from '../components/ErrorBoundary';

export const GenerateBill = () => {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Generate Bill</h2>
            <p className="text-sm text-red-700 mb-4">
              There was an error loading the bill generation page. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      }
    >
      <BillStepper />
    </ErrorBoundary>
  );
};

