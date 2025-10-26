import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Database, AlertCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const MigrationNotice = () => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <>
      <Alert className="border-blue-200 bg-blue-50/50">
        <Database className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-900">Database Migration Required</AlertTitle>
        <AlertDescription className="text-blue-800">
          <p className="mb-2">
            The ratings and reviews feature requires a database migration to create the necessary tables.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInstructions(true)}
            className="mt-2"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Migration Instructions
          </Button>
        </AlertDescription>
      </Alert>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply Database Migration</DialogTitle>
            <DialogDescription>
              Follow these steps to enable the ratings and reviews system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Step 1: Open Supabase Dashboard</h3>
              <p className="text-sm text-gray-600">
                Go to your Supabase project dashboard at{" "}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  supabase.com/dashboard
                </a>
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 2: Open SQL Editor</h3>
              <p className="text-sm text-gray-600">
                Navigate to <strong>SQL Editor</strong> in the left sidebar and click{" "}
                <strong>New Query</strong>
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 3: Run Migration SQL</h3>
              <p className="text-sm text-gray-600 mb-2">
                Open the file{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  supabase/migrations/create_ratings_reviews_system.sql
                </code>{" "}
                in your project, copy its contents, paste into the SQL Editor, and click{" "}
                <strong>Run</strong>.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded p-3">
              <h3 className="font-semibold mb-2 text-green-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                What This Creates
              </h3>
              <ul className="text-sm text-green-800 space-y-1 ml-6 list-disc">
                <li>property_reviews table (user ratings and reviews)</li>
                <li>review_replies table (partner responses)</li>
                <li>review_reports table (flagged content)</li>
                <li>property_ratings_summary view (cached statistics)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 4: Verify</h3>
              <p className="text-sm text-gray-600">
                Go to <strong>Table Editor</strong> in Supabase and confirm you see the new
                tables. Then refresh this page.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800">
                📖 Full instructions available in{" "}
                <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                  MIGRATION_INSTRUCTIONS.md
                </code>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MigrationNotice;
