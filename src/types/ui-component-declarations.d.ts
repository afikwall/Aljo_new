/**
 * Type declarations for UI components
 *
 * These declarations allow TypeScript to compile without errors when these modules
 * are imported, even if they don't actually exist in the project.
 */

declare module '@/components/ui/toast' {
  export interface ToastProps {
    id?: string;
    className?: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    variant?: 'default' | 'destructive';
    duration?: number;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  export type ToastActionElement = React.ReactElement<{
    altText: string;
    onClick: () => void;
  }>;
}
