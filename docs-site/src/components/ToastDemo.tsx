import React from 'react';
import {ToastProvider, useToast, Button} from 'trust-ui-react';

function ToastButtons() {
  const {toast} = useToast();

  return (
    <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
      <Button
        variant="primary"
        size="sm"
        onClick={() =>
          toast({variant: 'success', message: 'Changes saved', duration: 3000})
        }>
        Success
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={() =>
          toast({variant: 'danger', message: 'Something went wrong', duration: 3000})
        }>
        Danger
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          toast({variant: 'warning', message: 'Session expiring soon', duration: 3000})
        }>
        Warning
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          toast({
            variant: 'info',
            message: 'New update available',
            description: 'Version 0.3.0 has been released.',
            duration: 3000,
          })
        }>
        Info with description
      </Button>
    </div>
  );
}

export function ToastDemo() {
  return (
    <ToastProvider position="top-right">
      <ToastButtons />
    </ToastProvider>
  );
}
