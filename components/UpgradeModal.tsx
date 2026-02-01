import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { Plan } from '../types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: Plan) => void;
  currentPlan: Plan;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade, currentPlan }) => {
  if (!isOpen) return null;

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '0',
      currency: 'lei',
      period: 'mo',
      desc: 'Get started with AI',
      features: [
        '100 Credits per week',
        'Max 3 images per 10 hours',
        'Standard Flash Model',
        'Limited Context'
      ],
      btnText: 'Current Plan',
      disabled: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '29.99',
      currency: 'lei',
      period: 'mo',
      desc: 'More credits for creators',
      features: [
        '500 Credits per week',
        'Create more images (10 credits/img)',
        'Expanded context window',
        'Priority access'
      ],
      btnText: 'Upgrade to Pro',
      highlight: false
    },
    {
      id: 'plus',
      name: 'Plus',
      price: '59.99',
      currency: 'lei',
      period: 'mo',
      desc: 'Heavy usage power user',
      features: [
        '1000 Credits per week',
        'High limits on image generation',
        'Access to advanced tools',
        'Faster response times'
      ],
      btnText: 'Upgrade to Plus',
      highlight: true,
      popular: true
    },
    {
      id: 'agent',
      name: 'Agent',
      price: '99.99',
      currency: 'lei',
      period: 'mo',
      desc: 'Ultimate AI Experience',
      features: [
        '1500 Credits per week',
        'Access to Agent Mode',
        'Nano Banana Pro (High Res Images)',
        'Maximum Context & Reasoning'
      ],
      btnText: 'Upgrade to Agent',
      highlight: false
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-[1200px] bg-[#171717] rounded-3xl min-h-[600px] flex flex-col p-8 md:p-12 border border-gray-800">
        
        <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
        >
            <X size={24} />
        </button>

        <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-2">Choose your plan</h2>
            <p className="text-gray-400 mb-6">1 Message = 1 Credit • 1 Image = 10 Credits</p>
            <div className="inline-flex bg-[#2f2f2f] p-1 rounded-full">
                <button className="px-6 py-1.5 rounded-full bg-[#424242] text-white text-sm font-medium">Monthly</button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {plans.map((plan) => {
                // Handle legacy 'free' mapped to 'basic'
                const normalizedCurrentPlan = currentPlan === 'free' ? 'basic' : currentPlan;
                const isCurrent = normalizedCurrentPlan === plan.id;
                const isPlus = plan.id === 'plus';
                const isAgent = plan.id === 'agent';
                
                return (
                    <div 
                        key={plan.id}
                        className={`flex flex-col p-6 rounded-2xl border ${isAgent ? 'bg-[#1e1e2d] border-purple-500/50 relative' : isPlus ? 'bg-[#1e1e2d] border-[#5865F2]/50 relative' : 'bg-[#0d0d0d] border-gray-800'}`}
                    >
                        {plan.popular && (
                            <div className="absolute top-4 right-4 bg-[#5865F2] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                Popular
                            </div>
                        )}
                        {isAgent && (
                             <div className="absolute top-4 right-4 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                Best
                            </div>
                        )}

                        <h3 className="text-xl font-medium mb-4">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-sm text-gray-400">{plan.currency}</span>
                            <span className="text-4xl font-semibold">{plan.price}</span>
                            <span className="text-xs text-gray-400 ml-1">RON /<br/>month</span>
                        </div>
                        
                        <p className="text-sm text-gray-300 mt-4 mb-8 min-h-[40px]">{plan.desc}</p>

                        <button
                            disabled={isCurrent}
                            onClick={() => onUpgrade(plan.id as Plan)}
                            className={`w-full py-2.5 rounded-full text-sm font-medium transition-colors mb-8 ${
                                isCurrent 
                                    ? 'bg-[#2f2f2f] text-gray-400 cursor-default'
                                    : isAgent
                                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                        : isPlus 
                                            ? 'bg-[#5865F2] hover:bg-[#4752c4] text-white'
                                            : 'bg-white text-black hover:bg-gray-200'
                            }`}
                        >
                            {isCurrent ? 'Your current plan' : plan.btnText}
                        </button>

                        <div className="flex-1 space-y-3">
                            {plan.features.map((feature, i) => (
                                <div key={i} className="flex gap-3 text-sm text-gray-300 leading-tight">
                                    <Sparkles size={16} className={`flex-shrink-0 ${isAgent ? 'text-purple-500' : isPlus ? 'text-[#5865F2]' : 'text-gray-500'}`} />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
