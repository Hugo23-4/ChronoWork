'use client';

/**
 * ResponsiveModal
 * ─────────────────────────────────────────────────────────
 * On desktop (≥ md / 768px): renders a centered Dialog
 * On mobile (< md):          renders a vaul bottom-sheet Drawer
 *
 * This pattern avoids the vaul iOS PWA standalone pointer-
 * passthrough bug (shadcn-ui/ui#8507), since Dialog uses a
 * proper Radix focus trap and backdrop.
 *
 * Usage:
 *   <ResponsiveModal
 *     open={open}
 *     onOpenChange={setOpen}
 *     title="Mi Modal"
 *     description="Descripción opcional"
 *     footer={<Button onClick={() => setOpen(false)}>Cerrar</Button>}
 *   >
 *     {content}
 *   </ResponsiveModal>
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';

/* ── Hook: detect mobile breakpoint ──────────────────── */
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

/* ── Props ────────────────────────────────────────────── */
export interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Content for the main scrollable area */
  children: React.ReactNode;
  /** Sticky footer (buttons, actions) */
  footer?: React.ReactNode;
  /** Extra classes on the dialog content panel */
  contentClassName?: string;
  /** Vaul snap points for the drawer — default: full height */
  snapPoints?: (number | string)[];
}

/* ── Dialog (desktop) ─────────────────────────────────── */
function DesktopDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  contentClassName,
}: ResponsiveModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop — iOS frost */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md data-[state=open]:animate-fade-in" />
        {/* Panel — iOS sheet */}
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-lg max-h-[90vh] flex flex-col',
            'bg-white dark:bg-[#1c1c1e] rounded-[20px]',
            'border border-[--color-separator] dark:border-white/8',
            'shadow-[0_24px_64px_rgba(0,0,0,0.16)] dark:shadow-none',
            'data-[state=open]:animate-scale-in',
            contentClassName
          )}
        >
          {/* Header */}
          {(title || description) && (
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[--color-separator] dark:border-white/8 shrink-0">
              <div>
                {title && (
                  <DialogPrimitive.Title className="text-[17px] font-semibold tracking-tight text-[--color-label-primary] dark:text-white leading-tight">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description && (
                  <DialogPrimitive.Description className="text-[13px] text-[--color-label-secondary] dark:text-[#aeaeb2] mt-0.5">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              <DialogPrimitive.Close className="rounded-full w-8 h-8 flex items-center justify-center text-[--color-label-secondary] dark:text-[#aeaeb2] hover:bg-systemGray-6 dark:hover:bg-white/8 transition-colors cursor-pointer border-none bg-transparent">
                <X className="w-4 h-4" />
                <span className="sr-only">Cerrar</span>
              </DialogPrimitive.Close>
            </div>
          )}
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {/* Footer */}
          {footer && (
            <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-[--color-separator] dark:border-white/8">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ── Drawer (mobile bottom-sheet) ─────────────────────── */
function MobileDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  contentClassName,
  snapPoints,
}: ResponsiveModalProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} snapPoints={snapPoints}>
      <DrawerContent className={cn('max-h-[92vh]', contentClassName)}>
        <DrawerHeader>
          {title && <DrawerTitle>{title}</DrawerTitle>}
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <DrawerBody>{children}</DrawerBody>
        {footer && <DrawerFooter>{footer}</DrawerFooter>}
        <DrawerClose className="sr-only">Cerrar</DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}

/* ── Public export ─────────────────────────────────────── */
export function ResponsiveModal(props: ResponsiveModalProps) {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileDrawer {...props} />;
  return <DesktopDialog {...props} />;
}
