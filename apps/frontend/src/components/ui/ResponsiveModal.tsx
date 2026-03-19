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
        {/* Backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-in" />
        {/* Panel */}
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-lg max-h-[90vh] bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl',
            'ring-1 ring-black/5 dark:ring-white/10 flex flex-col',
            'data-[state=open]:animate-scale-in',
            contentClassName
          )}
        >
          {/* Header */}
          {(title || description) && (
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
              <div>
                {title && (
                  <DialogPrimitive.Title className="text-lg font-bold text-navy dark:text-zinc-200 leading-none mb-1">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description && (
                  <DialogPrimitive.Description className="text-sm text-slate-500 dark:text-zinc-400">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              <DialogPrimitive.Close className="rounded-lg p-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border-none bg-transparent">
                <X className="w-4 h-4" />
                <span className="sr-only">Cerrar</span>
              </DialogPrimitive.Close>
            </div>
          )}
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          {/* Footer */}
          {footer && (
            <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
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
