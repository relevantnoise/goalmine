import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Heart, Users, Briefcase, BookOpen, Activity, Clock, CheckCircle, TrendingUp, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

interface ProfessionalCircleSetupProps {
  onComplete: () => void;
  onBack: () => void;
}


interface CircleAllocation {
  circle_name: string;
  importance_level: number;
  current_hours_per_week: number;
  ideal_hours_per_week: number;
}

interface WorkHappiness {
  impact_current: number;
  impact_desired: number;
  fun_current: number;
  fun_desired: number;
  money_current: number;
  money_desired: number;
  remote_current: number;
  remote_desired: number;
}

const elements = [
  {
    name: 'Work',
    icon: Briefcase,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    description: 'Career, job(s) (including commute time)',
    placeholder: 'Core work, meetings, professional growth, commuting'
  },
  {
    name: 'Sleep',
    icon: Moon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200',
    description: 'Rest, recovery, sleep optimization',
    placeholder: 'Nightly sleep, naps, wind-down routines'
  },
  {
    name: 'Friends & Family',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'Relationships, social connections, quality time',
    placeholder: 'Family dinners, friend meetups, relationship time'
  },
  {
    name: 'Health & Fitness',
    icon: Activity,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    description: 'Physical health, exercise, nutrition, energy',
    placeholder: 'Exercise, meal prep, health appointments'
  },
  {
    name: 'Personal Development',
    icon: BookOpen,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    description: 'Learning, growth, skills, education',
    placeholder: 'Reading, courses, skill development'
  },
  {
    name: 'Spiritual',
    icon: Heart,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    description: 'Inner purpose, values, meaning, meditation, prayer',
    placeholder: 'Meditation, prayer, values reflection'
  }
];

export const ProfessionalCircleSetup = ({ onComplete, onBack }: ProfessionalCircleSetupProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState<'circles' | 'work'>('circles');


  const [circleAllocations, setCircleAllocations] = useState<Record<string, CircleAllocation>>({});
  const [workHappiness, setWorkHappiness] = useState<WorkHappiness>({
    impact_current: 5,
    impact_desired: 8,
    fun_current: 5,
    fun_desired: 8,
    money_current: 5,
    money_desired: 8,
    remote_current: 5,
    remote_desired: 8
  });


  // Calculate remaining hours for real-time updates
  const allocatedHours = useMemo(() => {
    return Object.values(circleAllocations).reduce(
      (sum, allocation) => sum + (allocation.ideal_hours_per_week || 0), 
      0
    );
  }, [circleAllocations]);

  const remainingHours = useMemo(() => {
    const totalWeekHours = 168; // 7 days * 24 hours
    return Math.max(0, totalWeekHours - allocatedHours);
  }, [allocatedHours]);

  const updateCircleAllocation = (circleName: string, updates: Partial<CircleAllocation>) => {
    setCircleAllocations(prev => ({
      ...prev,
      [circleName]: {
        circle_name: circleName,
        importance_level: 5,
        current_hours_per_week: 0,
        ideal_hours_per_week: 0,
        ...prev[circleName],
        ...updates
      }
    }));
  };

  const handleSubmit = async () => {
    if (!user?.email) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue.",
        duration: 8000
      });
      return;
    }

    // Ensure all elements have data
    const completeCircleAllocations = {};
    elements.forEach(element => {
      completeCircleAllocations[element.name] = {
        circle_name: element.name,
        importance_level: circleAllocations[element.name]?.importance_level || 5,
        current_hours_per_week: circleAllocations[element.name]?.current_hours_per_week || 0,
        ideal_hours_per_week: circleAllocations[element.name]?.ideal_hours_per_week || 0
      };
    });

    setIsSubmitting(true);
    
    try {
      const { data: frameworkData, error: frameworkError } = await supabase.functions.invoke('create-six-circle-framework', {
        body: {
          user_email: user.email,
          circleAllocations: completeCircleAllocations,
          workHappiness
        }
      });

      if (frameworkError) throw frameworkError;

      toast({
        title: "🎯 Life Management System Created!",
        description: "Your 6 Elements of Life™ is ready. Time to set some goals!",
        duration: 5000
      });

      onComplete();
    } catch (error) {
      console.error('❌ Error saving framework:', error);
      toast({
        title: "Setup Failed",
        description: error instanceof Error ? error.message : "Failed to save your framework. Please try again.",
        duration: 8000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isComplete = currentSection === 'work' || (currentSection === 'circles' && allocatedHours > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header onLogoClick={onBack} />
      
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            The 6 Elements of Life™ Setup
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Build your foundation for success. This comprehensive system helps high-achieving professionals 
            balance all essential life elements including work, sleep, relationships, health, growth, and purpose.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-8">
            <div className={`flex items-center ${currentSection === 'circles' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentSection === 'circles' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-green-100'
              }`}>
                {currentSection === 'circles' ? '1' : <CheckCircle className="w-5 h-5" />}
              </div>
              <span className="ml-2 font-medium">6 Life Elements</span>
            </div>
            <div className="w-24 h-px bg-gray-300"></div>
            <div className={`flex items-center ${currentSection === 'work' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentSection === 'work' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-100'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Work Happiness Assessment</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            
            {/* 6 Circles Section */}
            {currentSection === 'circles' && (
              <div className="space-y-6">
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <TrendingUp className="w-7 h-7" />
                      Your 6 Life Elements
                    </CardTitle>
                    <p className="text-blue-100">Allocate your weekly hours across these essential life elements. Focus on importance and ideal time investment.</p>
                  </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {elements.map((element) => {
                    const IconComponent = element.icon;
                    const data = circleAllocations[element.name] || {};
                    
                    return (
                      <Card key={element.name} className={`border-2 ${element.bgColor} hover:shadow-lg transition-shadow`}>
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <IconComponent className={`w-6 h-6 ${element.color}`} />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{element.name}</CardTitle>
                              <p className="text-sm text-gray-600">{element.description}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Importance Level (1-10)
                            </Label>
                            <Slider
                              value={[data.importance_level || 5]}
                              onValueChange={([value]) => updateCircleAllocation(element.name, { importance_level: value })}
                              max={10}
                              min={1}
                              step={1}
                              className="mt-2"
                            />
                            <div className="text-center text-sm text-gray-600 mt-1">
                              {data.importance_level || 5}/10
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Current Hours/Week</Label>
                              <Slider
                                value={[data.current_hours_per_week || 0]}
                                onValueChange={([value]) => updateCircleAllocation(element.name, { current_hours_per_week: value })}
                                max={100}
                                min={0}
                                step={element.name === 'Spiritual' ? 0.5 : 1}
                                className="mt-2"
                              />
                              <div className="text-center text-sm font-medium text-gray-700 mt-1">
                                {data.current_hours_per_week || 0}h
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-700">Ideal Hours/Week</Label>
                              <Slider
                                value={[data.ideal_hours_per_week || 0]}
                                onValueChange={([value]) => updateCircleAllocation(element.name, { ideal_hours_per_week: value })}
                                max={100}
                                min={0}
                                step={element.name === 'Spiritual' ? 0.5 : 1}
                                className="mt-2"
                              />
                              <div className="text-center text-sm font-medium text-blue-600 mt-1">
                                {data.ideal_hours_per_week || 0}h
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-8">
                  <Button 
                    variant="outline" 
                    onClick={onBack}
                    className="px-6 py-2"
                  >
                    ← Back to Dashboard
                  </Button>
                  <Button 
                    onClick={() => setCurrentSection('work')}
                    disabled={allocatedHours === 0}
                    className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700"
                  >
                    Continue to Work Assessment
                  </Button>
                </div>
              </div>
            )}

            {/* Work Happiness Section */}
            {currentSection === 'work' && (
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <Briefcase className="w-7 h-7" />
                    Business Happiness Assessment
                  </CardTitle>
                  <p className="text-blue-100">
                    This proven formula was developed over 10 years of coaching high-achieving professionals
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { key: 'impact', label: 'Level of Impact', description: 'Meaningful work that matters' },
                      { key: 'fun', label: 'Level of Enjoyment', description: 'Work satisfaction and engagement' },
                      { key: 'money', label: 'Satisfaction with Income', description: 'Financial compensation alignment' },
                      { key: 'remote', label: 'Work from Anywhere Ability', description: 'Location flexibility and freedom' }
                    ].map(metric => (
                      <div key={metric.key} className="space-y-6">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-1">{metric.label}</h4>
                          <p className="text-sm text-gray-600 mb-4">{metric.description}</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Current Level</Label>
                            <Slider
                              value={[workHappiness[`${metric.key}_current`]]}
                              onValueChange={([value]) => setWorkHappiness(prev => ({ ...prev, [`${metric.key}_current`]: value }))}
                              max={10}
                              min={1}
                              step={1}
                              className="mt-2"
                            />
                            <div className="text-center text-sm text-gray-600 mt-1">
                              {workHappiness[`${metric.key}_current`]}/10
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700">Desired Level</Label>
                            <Slider
                              value={[workHappiness[`${metric.key}_desired`]]}
                              onValueChange={([value]) => setWorkHappiness(prev => ({ ...prev, [`${metric.key}_desired`]: value }))}
                              max={10}
                              min={1}
                              step={1}
                              className="mt-2"
                            />
                            <div className="text-center text-sm text-blue-600 mt-1">
                              {workHappiness[`${metric.key}_desired`]}/10
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-12">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentSection('circles')}
                      className="px-6 py-2"
                    >
                      ← Back to Circles
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Creating Your Framework...
                        </>
                      ) : (
                        'Complete Setup & Start Goal Setting'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Hours Tracker */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-900 to-blue-900 text-white">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Hour Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-white/10 rounded-lg">
                    <div className="text-3xl font-bold text-blue-300">
                      168
                    </div>
                    <div className="text-sm text-blue-200">Total Weekly Hours</div>
                  </div>

                  {currentSection === 'circles' && (
                    <>
                      <div className="text-center p-4 bg-white/10 rounded-lg">
                        <div className="text-2xl font-bold text-green-300">
                          {allocatedHours}
                        </div>
                        <div className="text-sm text-green-200">Allocated</div>
                      </div>

                      <div className="text-center p-4 bg-white/10 rounded-lg">
                        <div className={`text-2xl font-bold ${
                          remainingHours > 0 ? 'text-yellow-300' : 'text-red-300'
                        }`}>
                          {remainingHours}
                        </div>
                        <div className="text-sm text-yellow-200">Remaining</div>
                      </div>

                      {remainingHours < 0 && (
                        <div className="p-3 bg-red-500/20 border border-red-400 rounded-lg">
                          <div className="text-red-200 text-sm text-center">
                            ⚠️ Over-allocated by {Math.abs(remainingHours)} hours
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="text-center text-blue-200 leading-relaxed">
                      Allocate your 168 weekly hours across all 6 essential life elements for optimal balance
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};