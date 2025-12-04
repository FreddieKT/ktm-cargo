import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  Circle,
  Package,
  Calculator,
  Users,
  Gift,
  Play,
  ArrowRight,
  Mail,
  Sparkles,
} from 'lucide-react';

const onboardingSteps = [
  {
    id: 1,
    title: 'Welcome to BKK-YGN Cargo',
    description: 'Your trusted partner for shipping between Bangkok and Yangon',
    icon: Package,
    content: `Welcome aboard! We're excited to help you ship goods between Bangkok and Yangon with ease. 
    
Our services include:
• Fast cargo shipping (3-5 days standard, 1-2 days express)
• Personal shopping assistance from Thai stores
• Real-time tracking for all shipments
• Competitive rates starting at ฿85/kg`,
  },
  {
    id: 2,
    title: 'Using the Price Calculator',
    description: 'Get instant quotes for your shipments',
    icon: Calculator,
    content: `Our Price Calculator helps you estimate shipping costs instantly:

1. Select your service type (Cargo or Shopping)
2. Enter the weight of your package
3. Choose optional add-ons (insurance, professional packing)
4. Set the exchange rate for MMK conversion
5. View your detailed price breakdown

Try it now to see how affordable shipping can be!`,
  },
  {
    id: 3,
    title: 'Customer Benefits & Rewards',
    description: 'Unlock exclusive perks as you ship more',
    icon: Gift,
    content: `As a valued customer, you're automatically enrolled in our rewards program:

🥉 New Customer: Welcome discount on first shipment
🥈 Regular (5+ shipments): 5% discount on all orders
🥇 Premium (20+ shipments): 10% discount + priority handling
💎 VIP (50+ shipments): 15% discount + dedicated support

You'll also receive exclusive campaign offers and seasonal promotions!`,
  },
  {
    id: 4,
    title: 'Track Your Shipments',
    description: 'Real-time updates on your packages',
    icon: Users,
    content: `Stay informed with our tracking system:

• Receive SMS/Email notifications at each stage
• View live status: Pending → Picked Up → In Transit → Customs → Delivered
• Access your complete shipment history anytime
• Download invoices and shipping documents

Your unique tracking number will be provided for every shipment.`,
  },
];

export default function CustomerOnboarding({ customer, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  const progress = (completedSteps.length / onboardingSteps.length) * 100;
  const currentStepData = onboardingSteps[currentStep];
  const Icon = currentStepData?.icon;

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handleSkip = () => {
    onComplete?.();
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="border-0 shadow-lg overflow-hidden">
        {/* Progress Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Getting Started</span>
            </div>
            <Badge className="bg-white/20 text-white">
              Step {currentStep + 1} of {onboardingSteps.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2 bg-white/20" />

          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {onboardingSteps.map((step, idx) => (
              <div
                key={step.id}
                className={`flex items-center gap-1 text-sm ${
                  idx <= currentStep ? 'text-white' : 'text-white/50'
                }`}
              >
                {completedSteps.includes(idx) ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Circle className={`w-4 h-4 ${idx === currentStep ? 'fill-white' : ''}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{currentStepData.title}</h2>
              <p className="text-slate-500">{currentStepData.description}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 mb-6">
            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
              {currentStepData.content}
            </pre>
          </div>

          {/* Video placeholder for step 2 */}
          {currentStep === 1 && (
            <div className="bg-slate-900 rounded-xl p-8 mb-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
                <Play className="w-8 h-8 text-white" />
              </div>
              <p className="text-white font-medium">Watch: How to Use the Calculator</p>
              <p className="text-slate-400 text-sm mt-1">2 minute tutorial</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleSkip}>
              Skip Tutorial
            </Button>
            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
              {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
