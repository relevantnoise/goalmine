import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Briefcase, 
  Users, 
  Activity, 
  BookOpen, 
  Heart, 
  Moon,
  Save, 
  X,
  Clock,
  Target,
  DollarSign,
  Home,
  Zap
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { updateFrameworkData } from "@/api/frameworkApi";
import type { FrameworkElement, WorkHappiness } from "@/api/frameworkApi";

interface EditFrameworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  frameworkData: any;
  onUpdate: () => void;
}

const pillars = [
  {
    name: 'Work',
    icon: Briefcase,
    color: 'text-blue-600',
    description: 'Career, professional development, income'
  },
  {
    name: 'Sleep',
    icon: Moon,
    color: 'text-purple-600',
    description: 'Rest, recovery, energy management'
  },
  {
    name: 'Family & Friends',
    icon: Users,
    color: 'text-green-600',
    description: 'Relationships, social connections'
  },
  {
    name: 'Health & Fitness',
    icon: Activity,
    color: 'text-red-600',
    description: 'Physical wellbeing, energy, vitality'
  },
  {
    name: 'Personal Development',
    icon: BookOpen,
    color: 'text-yellow-600',
    description: 'Learning, growth, skills'
  },
  {
    name: 'Spiritual',
    icon: Heart,
    color: 'text-pink-600',
    description: 'Inner purpose, values, meaning'
  }
];

const workHappinessFields = [
  {
    key: 'impact' as const,
    icon: Target,
    label: 'Impact',
    description: 'Your personal impact and meaningful contribution to important outcomes'
  },
  {
    key: 'fun' as const,
    icon: Zap,
    label: 'Fun/Enjoyment',
    description: 'Work satisfaction, engagement, and genuine enjoyment of your role'
  },
  {
    key: 'money' as const,
    icon: DollarSign,
    label: 'Financial Reward',
    description: 'Compensation and financial recognition that meets your lifestyle needs'
  },
  {
    key: 'remote' as const,
    icon: Home,
    label: 'Location/Schedule Flexibility',
    description: 'Flexibility in where and when you work - the foundation of work-life balance'
  }
];

export const EditFrameworkModal = ({ 
  isOpen, 
  onClose, 
  frameworkData, 
  onUpdate 
}: EditFrameworkModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'pillars' | 'work'>('pillars');
  const [saving, setSaving] = useState(false);

  // Initialize pillar states
  const [pillarData, setPillarData] = useState<Record<string, FrameworkElement>>(() => {
    const initialData: Record<string, FrameworkElement> = {};
    
    if (frameworkData?.elements) {
      frameworkData.elements.forEach((element: any) => {
        initialData[element.name] = {
          name: element.name,
          current: element.current,
          desired: element.desired,
          definition: element.definition || '',
          weeklyHours: element.weeklyHours || 0,
          priority: element.priority || 3
        };
      });
    } else {
      // Initialize with defaults if no data
      pillars.forEach(pillar => {
        initialData[pillar.name] = {
          name: pillar.name,
          current: 5,
          desired: 8,
          definition: '',
          weeklyHours: 0,
          priority: 3
        };
      });
    }
    
    return initialData;
  });

  // Initialize work happiness state
  const [workHappiness, setWorkHappiness] = useState<WorkHappiness>(() => {
    if (frameworkData?.workHappiness) {
      return frameworkData.workHappiness;
    }
    return {
      impactCurrent: 5,
      impactDesired: 8,
      funCurrent: 5,
      funDesired: 8,
      moneyCurrent: 5,
      moneyDesired: 8,
      remoteCurrent: 5,
      remoteDesired: 8
    };
  });

  const updatePillarData = (pillarName: string, field: keyof FrameworkElement, value: any) => {
    setPillarData(prev => ({
      ...prev,
      [pillarName]: {
        ...prev[pillarName],
        [field]: value
      }
    }));
  };

  const updateWorkHappiness = (field: keyof WorkHappiness, value: number) => {
    setWorkHappiness(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user?.email || !frameworkData?.framework?.id) {
      toast({
        title: "Error",
        description: "Missing user or framework data",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      // Transform pillar data to match the expected format for the API
      const elementsArray = Object.values(pillarData).map(pillar => ({
        name: pillar.name,
        current: pillar.current,
        desired: pillar.desired,
        importance: pillar.priority, // Map priority to importance
        currentHours: pillar.current,
        idealHours: pillar.desired,
        priority: pillar.priority
      }));
      
      await updateFrameworkData(
        user.email,
        frameworkData.framework.id,
        elementsArray,
        workHappiness
      );

      toast({
        title: "Framework Updated",
        description: "Your 6 Pillars assessment has been saved successfully"
      });

      onUpdate(); // Trigger refetch
      onClose();
    } catch (error: any) {
      console.error('Error updating framework:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update framework data",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const renderPillarsStep = () => (
    <div className="space-y-6">
      <div className="grid gap-6">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          const data = pillarData[pillar.name];
          const gap = data.desired - data.current;
          
          return (
            <Card key={pillar.name} className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${pillar.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{pillar.name}</h3>
                  <p className="text-sm text-muted-foreground">{pillar.description}</p>
                </div>
                <Badge variant={gap > 4 ? "destructive" : gap > 2 ? "secondary" : "default"}>
                  Gap: -{gap}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-medium">Current State (1-10)</Label>
                  <div className="mt-2">
                    <Slider
                      value={[data.current]}
                      onValueChange={([value]) => updatePillarData(pillar.name, 'current', value)}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1</span>
                      <span className="font-medium">{data.current}</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Desired State (1-10)</Label>
                  <div className="mt-2">
                    <Slider
                      value={[data.desired]}
                      onValueChange={([value]) => updatePillarData(pillar.name, 'desired', value)}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1</span>
                      <span className="font-medium">{data.desired}</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <Label className="text-sm font-medium">Personal Definition</Label>
                <Textarea
                  value={data.definition}
                  onChange={(e) => updatePillarData(pillar.name, 'definition', e.target.value)}
                  placeholder={`What does ${pillar.name} mean to you personally?`}
                  className="mt-1 text-sm"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Weekly Hours</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Slider
                      value={[data.weeklyHours]}
                      onValueChange={([value]) => updatePillarData(pillar.name, 'weeklyHours', value)}
                      min={0}
                      max={50}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-8">{data.weeklyHours}h</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Priority Level</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Slider
                      value={[data.priority]}
                      onValueChange={([value]) => updatePillarData(pillar.name, 'priority', value)}
                      min={1}
                      max={5}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-4">{data.priority}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderWorkHappinessStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Business Happiness Formula™</h3>
        <p className="text-sm text-muted-foreground">
          The 4 key factors for work satisfaction - developed over 30 years of research
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          This optimizes your Work pillar by measuring what truly drives professional happiness
        </p>
      </div>

      <div className="grid gap-6">
        {workHappinessFields.map((field) => {
          const Icon = field.icon;
          const currentKey = `${field.key}Current` as keyof WorkHappiness;
          const desiredKey = `${field.key}Desired` as keyof WorkHappiness;
          const currentValue = workHappiness[currentKey];
          const desiredValue = workHappiness[desiredKey];
          const gap = desiredValue - currentValue;
          
          return (
            <Card key={field.key} className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-blue-600">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{field.label}</h4>
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                </div>
                <Badge variant={gap > 3 ? "destructive" : gap > 1 ? "secondary" : "default"}>
                  Gap: -{gap}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Current Level</Label>
                  <div className="mt-2">
                    <Slider
                      value={[currentValue]}
                      onValueChange={([value]) => updateWorkHappiness(currentKey, value)}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1</span>
                      <span className="font-medium">{currentValue}</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Desired Level</Label>
                  <div className="mt-2">
                    <Slider
                      value={[desiredValue]}
                      onValueChange={([value]) => updateWorkHappiness(desiredKey, value)}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1</span>
                      <span className="font-medium">{desiredValue}</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Edit Your 6 Pillars Framework
          </DialogTitle>
          <DialogDescription>
            Update your pillar ratings, definitions, and work happiness assessment
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mb-6">
          <Button
            variant={currentStep === 'pillars' ? 'default' : 'outline'}
            onClick={() => setCurrentStep('pillars')}
            className="flex-1"
          >
            <Target className="w-4 h-4 mr-2" />
            6 Pillars of Life™
          </Button>
          <Button
            variant={currentStep === 'work' ? 'default' : 'outline'}
            onClick={() => setCurrentStep('work')}
            className="flex-1"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Business Happiness Formula™
          </Button>
        </div>

        <div className="min-h-[400px]">
          {currentStep === 'pillars' ? renderPillarsStep() : renderWorkHappinessStep()}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};