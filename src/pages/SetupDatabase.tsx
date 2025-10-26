import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const SetupDatabase = () => {
  const [isSetupRunning, setIsSetupRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDatabaseSetup = async () => {
    setIsSetupRunning(true);
    setResults(null);

    try {
      console.log('🔧 Calling database setup function...');
      
      const { data, error } = await supabase.functions.invoke('setup-circle-database', {
        body: {}
      });

      if (error) {
        console.error('❌ Setup error:', error);
        setResults({ error: error.message });
      } else {
        console.log('✅ Setup completed:', data);
        setResults(data);
      }
    } catch (err) {
      console.error('❌ Setup exception:', err);
      setResults({ error: err.message });
    } finally {
      setIsSetupRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Database Setup</CardTitle>
          <p className="text-muted-foreground">Set up the simplified circle framework database tables</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <Button 
              onClick={runDatabaseSetup}
              disabled={isSetupRunning}
              size="lg"
              className="w-full"
            >
              {isSetupRunning ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                  Setting up database...
                </>
              ) : (
                'Run Database Setup'
              )}
            </Button>
          </div>

          {results && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Setup Results:</h3>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <h4 className="font-medium mb-2">This will create:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>user_circle_frameworks table</li>
              <li>circle_time_allocations table</li>
              <li>work_happiness_metrics table</li>
              <li>circle_checkins table</li>
              <li>Required indexes and RLS policies</li>
              <li>circle_type column in goals table</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};