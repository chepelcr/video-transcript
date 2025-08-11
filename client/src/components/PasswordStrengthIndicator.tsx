import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRule {
  test: (password: string) => boolean;
  message: string;
}

const passwordRules: PasswordRule[] = [
  { test: (pwd) => pwd.length >= 8, message: 'At least 8 characters' },
  { test: (pwd) => /[a-z]/.test(pwd), message: 'One lowercase letter' },
  { test: (pwd) => /[A-Z]/.test(pwd), message: 'One uppercase letter' },
  { test: (pwd) => /[0-9]/.test(pwd), message: 'One number' },
  { test: (pwd) => /[^a-zA-Z0-9]/.test(pwd), message: 'One special character' },
];

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const passedRules = passwordRules.filter(rule => rule.test(password));
  const strength = passedRules.length;
  
  const getStrengthColor = () => {
    if (strength === 0) return 'bg-gray-200';
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (strength === 0) return 'Very Weak';
    if (strength <= 2) return 'Weak';
    if (strength <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Password Strength</span>
          <span className={cn(
            "font-medium",
            strength === 0 && "text-gray-500",
            strength <= 2 && "text-red-500",
            strength <= 4 && "text-yellow-600",
            strength === 5 && "text-green-600"
          )}>
            {getStrengthText()}
          </span>
        </div>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                level <= strength ? getStrengthColor() : "bg-gray-200 dark:bg-gray-700"
              )}
            />
          ))}
        </div>
      </div>

      {/* Rules Checklist */}
      <div className="space-y-2">
        {passwordRules.map((rule, index) => {
          const isValid = rule.test(password);
          return (
            <div key={index} className="flex items-center space-x-2 text-sm">
              {isValid ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
              <span className={cn(
                "transition-colors",
                isValid ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              )}>
                {rule.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}