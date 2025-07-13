import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function IndiaLocationNotice() {
  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="text-blue-800 dark:text-blue-200">
        <strong>Location Restriction:</strong> Currently, this service is available only for locations within India. 
        Please enter Indian cities, towns, or landmarks for accurate route planning and distance calculations.
      </AlertDescription>
    </Alert>
  );
} 