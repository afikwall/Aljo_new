import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';

const textVariants = cva('', {
  variants: {
    variant: {
      'display-lg': 'text-6xl font-semibold font-inter-tight',
      heading1: 'text-5xl font-medium font-inter-tight',
      heading2: 'text-4xl font-medium font-inter-tight',
      heading3: 'text-2xl font-medium font-inter-tight',
      heading4: 'text-xl font-semibold font-inter-tight',
      paragraph: 'text-base font-normal font-inter',
      blockquote: 'text-base font-semibold italic font-inter',
      large: 'text-lg font-semibold font-inter',
      'paragraph-medium': 'text-base font-medium font-inter',
      'paragraph-bold': 'text-base font-semibold font-inter',
      'inline-code': 'font-mono bg-secondary',
      small: 'text-sm font-normal font-inter',
      'small-medium': 'text-sm font-medium font-inter',
      'small-bold': 'text-sm font-semibold font-inter',
      detail: 'text-xs font-normal font-inter',
      'detail-medium': 'text-xs font-medium font-inter',
      'detail-bold': 'text-xs font-semibold font-inter',
    },
  },
  defaultVariants: {
    variant: 'paragraph', // Changed default to paragraph instead of primary-filled
  },
});

export type TextVariantsType = VariantProps<typeof textVariants>['variant'];

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  asChild?: boolean;
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = useMemo(() => {
      if (asChild) {
        return Slot;
      }

      switch (variant) {
        case 'display-lg':
          return 'h1';
        case 'heading1':
          return 'h1';
        case 'heading2':
          return 'h2';
        case 'heading3':
          return 'h3';
        case 'heading4':
          return 'h4';
        case 'blockquote':
          return 'blockquote';
        case 'paragraph':
          return 'p';
        default:
          return 'span';
      }
    }, [variant, asChild]);

    return (
      <Comp
        className={cn(textVariants({ variant, className }))}
        ref={ref as any}
        {...props}
      />
    );
  },
);
Text.displayName = 'Text';

export { Text, textVariants };
