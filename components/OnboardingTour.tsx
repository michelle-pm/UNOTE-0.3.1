import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '../contexts/OnboardingContext';
import GlassButton from './GlassButton';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

const OnboardingTour: React.FC = () => {
  const { isActive, currentStep, nextStep, prevStep, skipTour, currentStepIndex, totalSteps } = useOnboarding();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top?: number, bottom?: number, left: number }>({ left: 0 });
  const HEADER_HEIGHT = 80; // Safe area for header

  useEffect(() => {
    if (!isActive || !currentStep) return;

    const updateRect = () => {
      const element = document.querySelector(`[data-tour="${currentStep.target}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        
        // Scroll into view if needed
        const isInViewport = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
        
        if (!isInViewport) {
             element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }

        // Calculate Tooltip Position
        const tooltipWidth = 320;
        const tooltipHeight = 200; // Approx max height
        const padding = 16;
        
        let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        // Clamp horizontal
        if (left < 10) left = 10;
        if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;

        // Vertical logic
        // Prefer the position defined in step, but flip if no space
        let preferredPos = currentStep.position || 'bottom';
        
        // Check space below
        const spaceBelow = window.innerHeight - rect.bottom;
        // Check space above (accounting for header)
        const spaceAbove = rect.top - HEADER_HEIGHT;

        let finalTop: number | undefined;
        
        if (preferredPos === 'bottom') {
            if (spaceBelow < tooltipHeight && spaceAbove > tooltipHeight) {
                // Not enough space below, force top
                finalTop = rect.top - padding - 10; 
                // We will use 'bottom' css property for this usually, but let's calculate exact top for simplicity in absolute positioning
                 setTooltipPosition({ 
                    top: rect.top - padding - 200, // This logic is simplified, let's stick to placing it above the element
                    left 
                 });
            } else {
                 setTooltipPosition({ top: rect.bottom + padding, left });
            }
        } else {
             // Prefer top
             if (spaceAbove < tooltipHeight && spaceBelow > tooltipHeight) {
                 setTooltipPosition({ top: rect.bottom + padding, left });
             } else {
                 setTooltipPosition({ top: Math.max(HEADER_HEIGHT + 10, rect.top - padding - 180), left }); // Approximate height offset
             }
        }

        // --- ROBUST COLLISION CORRECTION ---
        // If we decided to place it at 'top', ensure it's not under header
        // If we placed it at calculated 'top', does it fit?
        
        // Let's retry a simpler approach:
        // Default: Below
        let posTop = rect.bottom + padding;
        
        // If it goes off bottom screen, put it above
        if (posTop + tooltipHeight > window.innerHeight) {
            posTop = rect.top - padding - tooltipHeight; // This assumes fixed height, which is risky for dynamic content
             // Better: use bottom-up positioning if needed, but let's just shift it up
             // If placed above, check if it hits header
             if (posTop < HEADER_HEIGHT) {
                 // If it hits header, we have a problem. 
                 // If element is huge, place tooltip in the middle? No, that blocks content.
                 // Force it below and let user scroll?
                 posTop = rect.bottom + padding;
             }
        }
        
        // Final sanity check for header overlap
        if (posTop < HEADER_HEIGHT) posTop = HEADER_HEIGHT + 10;

        setTooltipPosition({ top: posTop, left });

      } else {
          setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    
    // Check periodically for layout shifts
    const interval = setInterval(updateRect, 500);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      clearInterval(interval);
    };
  }, [isActive, currentStep]);

  if (!isActive || !currentStep || !targetRect) return null;

  // Highlight Box Style
  const padding = 6;
  const highlightStyle: React.CSSProperties = {
    top: targetRect.top - padding,
    left: targetRect.left - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  };

  // Tooltip Style
  // We use the calculated position state, but we can refine it with transform translateY to be dynamic
  const isAbove = (tooltipPosition.top || 0) < targetRect.top;
  
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Dimmed Background */}
      <div className="absolute inset-0 bg-black/60 transition-opacity duration-300 pointer-events-auto" />
      
      {/* SVG Cutout (Visual Hack for better performance than huge divs) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect 
                x={highlightStyle.left} 
                y={highlightStyle.top} 
                width={highlightStyle.width} 
                height={highlightStyle.height} 
                rx="12" 
                fill="black" 
            />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#tour-mask)" />
      </svg>

      {/* Highlight Border */}
      <motion.div
        layout
        className="absolute border-2 border-accent rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] pointer-events-none"
        style={highlightStyle}
        transition={{ type: "spring", stiffness: 250, damping: 25 }}
      />

      {/* Tooltip Card */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
            opacity: 1, 
            y: 0, 
            top: tooltipPosition.top, 
            left: tooltipPosition.left 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute w-80 bg-[#1e293b] text-text-light p-5 rounded-2xl shadow-2xl border border-glass-border pointer-events-auto flex flex-col"
        style={{
            // If we determined it should be above, we shift it up by 100% of its own height using CSS transform if we didn't calculate exact height
             transform: isAbove ? 'translateY(-100%)' : 'none',
             marginTop: isAbove ? -16 : 0, // Padding from element
        }}
      >
        <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg">{currentStep.title}</h3>
            <button onClick={skipTour} className="text-text-secondary hover:text-white p-1 hover:bg-white/10 rounded-full"><X size={16} /></button>
        </div>
        <p className="text-sm text-text-secondary mb-5 leading-relaxed">
            {currentStep.content}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
            <div className="flex gap-1.5">
                 {Array.from({ length: totalSteps }).map((_, idx) => (
                     <div 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentStepIndex ? 'bg-accent' : 'bg-white/20'}`} 
                     />
                 ))}
            </div>
            <div className="flex gap-2">
                {currentStepIndex > 0 && (
                    <button 
                        onClick={prevStep} 
                        className="p-2 rounded-lg hover:bg-white/10 text-text-secondary transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
                <GlassButton onClick={nextStep} className="px-4 py-1.5 text-sm">
                    {currentStepIndex === totalSteps - 1 ? 'Готово' : 'Далее'}
                    {currentStepIndex < totalSteps - 1 && <ChevronRight size={16} className="ml-1" />}
                </GlassButton>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingTour;