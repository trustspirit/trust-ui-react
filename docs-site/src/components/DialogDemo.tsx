import React, {useState} from 'react';
import {Dialog, Button} from 'trust-ui-react';

export function DialogDemo({size = 'md'}: {size?: 'sm' | 'md' | 'lg' | 'fullscreen'}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open {size} Dialog</Button>
      <Dialog open={open} onClose={() => setOpen(false)} size={size}>
        <Dialog.Title onClose={() => setOpen(false)}>
          Dialog Title ({size})
        </Dialog.Title>
        <Dialog.Content>
          This is a {size} dialog. Click the close button, press Escape, or click
          the backdrop to dismiss it.
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Confirm</Button>
        </Dialog.Actions>
      </Dialog>
    </>
  );
}
