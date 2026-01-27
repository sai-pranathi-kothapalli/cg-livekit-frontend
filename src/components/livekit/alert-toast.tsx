'use client';

import { ReactNode } from 'react';
import { toast as sonnerToast } from 'sonner';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import { Alert, AlertDescription, AlertTitle } from '@/components/livekit/alert';

interface ToastProps {
  id: string | number;
  title: ReactNode;
  description: ReactNode;
}

export function toastAlert(toast: Omit<ToastProps, 'id'>) {
  return sonnerToast.custom(
    (id) => <AlertToast id={id} title={toast.title} description={toast.description} />,
    { duration: 8_000 }
  );
}

export function AlertToast(props: ToastProps) {
  const { title, description, id } = props;

  return (
    <Alert 
      onClick={() => sonnerToast.dismiss(id)} 
      className="bg-accent w-[320px] max-w-[90vw] shadow-lg px-3 py-2.5 cursor-pointer hover:opacity-90 transition-opacity"
    >
      <WarningIcon weight="bold" className="shrink-0 size-4" />
      <div className="flex-1 min-w-0">
        <AlertTitle className="text-sm font-semibold leading-tight pr-2">{title}</AlertTitle>
        {description && (
          <AlertDescription className="text-xs mt-1 leading-relaxed pr-2">
            {description}
          </AlertDescription>
        )}
      </div>
    </Alert>
  );
}
