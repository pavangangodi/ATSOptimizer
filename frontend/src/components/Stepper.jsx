import { Check } from 'lucide-react';

export default function Stepper({ steps, activeStep, onStepChange, canVisitStep }) {
  return (
    <nav className="stepper" aria-label="Resume builder steps">
      {steps.map((step, index) => {
        const isActive = activeStep === index;
        const isComplete = activeStep > index;
        const isDisabled = !canVisitStep(index);
        const state = isActive ? 'active' : isComplete ? 'complete' : 'upcoming';

        return (
          <button
            key={step.title}
            type="button"
            className={`stepperItem is-${state}`}
            onClick={() => onStepChange(index)}
            disabled={isDisabled}
            aria-current={isActive ? 'step' : undefined}
          >
            <span className="stepIndex" aria-hidden="true">
              {isComplete ? <Check size={14} /> : index + 1}
            </span>
            <span>
              <strong>{step.title}</strong>
              <small>{step.description}</small>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
