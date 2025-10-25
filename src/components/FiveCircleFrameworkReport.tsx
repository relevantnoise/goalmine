import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Target, TrendingUp, AlertTriangle } from "lucide-react";

interface FrameworkAnalysis {
  total_ideal_time: number;
  available_time: number;
  has_time_conflict: boolean;
  circles_created: number;
  consultant_report?: string;
}

interface FiveCircleFrameworkReportProps {
  analysis: FrameworkAnalysis;
  onContinue: () => void;
}

export const FiveCircleFrameworkReport = ({ analysis, onContinue }: FiveCircleFrameworkReportProps) => {
  const formatReport = (report: string) => {
    // Split the report into sections and format with markdown-like styling
    const sections = report.split(/(?=\d\.\s?\*\*|\*\*[A-Z])/);
    
    return sections.map((section, index) => {
      if (!section.trim()) return null;
      
      // Handle headers like "**Executive Summary**"
      const headerMatch = section.match(/^\*\*(.*?)\*\*/);
      if (headerMatch) {
        const title = headerMatch[1];
        const content = section.replace(/^\*\*.*?\*\*/, '').trim();
        
        return (
          <div key={index} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              {title === 'Executive Summary' && <Target className="w-5 h-5 mr-2 text-blue-600" />}
              {title === 'Key Insights' && <TrendingUp className="w-5 h-5 mr-2 text-green-600" />}
              {title === 'Priority Recommendations' && <CheckCircle className="w-5 h-5 mr-2 text-purple-600" />}
              {title === 'Time Optimization Strategy' && <Clock className="w-5 h-5 mr-2 text-amber-600" />}
              {title === 'Success Probability Assessment' && <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />}
              {title}
            </h3>
            <div className="text-gray-700 leading-relaxed">
              {content.split('\n').map((line, lineIndex) => {
                if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                  return (
                    <div key={lineIndex} className="flex items-start mb-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>{line.replace(/^[\-•]\s*/, '')}</span>
                    </div>
                  );
                }
                return line.trim() ? <p key={lineIndex} className="mb-2">{line}</p> : null;
              })}
            </div>
          </div>
        );
      }
      
      return null;
    }).filter(Boolean);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Your 5 Circle Framework™ is Ready!
        </h1>
        <p className="text-lg text-gray-600">
          Professional analysis by Dan Lynn, Management Consultant
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{analysis.circles_created}</div>
            <div className="text-sm text-gray-600">Life Circles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{analysis.total_ideal_time}h</div>
            <div className="text-sm text-gray-600">Weekly Allocation</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center">
              {analysis.has_time_conflict ? (
                <div className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Needs Optimization
                </div>
              ) : (
                <div className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Well Balanced
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-1">Time Balance</div>
          </CardContent>
        </Card>
      </div>

      {/* Consultant Report */}
      {analysis.consultant_report && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center text-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold text-sm">DL</span>
              </div>
              Professional Assessment by Dan Lynn
            </CardTitle>
            <p className="text-blue-700 text-sm">
              30 years experience • Former AT&T Strategy • MBA Rutgers
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-blue max-w-none">
              {formatReport(analysis.consultant_report)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Ready to Create Your Goals?
          </h3>
          <p className="text-gray-600 mb-6">
            Now that we understand your life complexity, let's create specific, actionable goals for each circle.
          </p>
          <Button 
            onClick={onContinue}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
          >
            Start Goal Workshop
            <Target className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};