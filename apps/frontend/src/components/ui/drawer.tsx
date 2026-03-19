'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { cn } from '@/lib/utils';

/* ── Root ─────────────────────────────────────────────── */
function Drawer({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return (
    <DrawerPrimitive.Root
      shouldScaleBackground={shouldScaleBackground}
      {...props}
    />
  );
}
Drawer.displayName = 'Drawer';

/* ── Primitives re-exported ───────────────────────────── */
const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal  = DrawerPrimitive.Portal;
const DrawerClose   = DrawerPrimitive.Close;

/* ── Overlay ─────────────────────────────────────────── */
function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      className={cn('fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]', className)}
      {...props}
    />
  );
}
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

/* ── Content ─────────────────────────────────────────── */
function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  // Detect current theme to pass into the vaul portal (which renders outside the html root)
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex h-auto flex-col rounded-t-[24px]',
          'ring-1 ring-black/5 dark:ring-white/[0.06] shadow-[0_-8px_40px_rgba(15,23,42,0.1)] dark:shadow-[0_-8px_40px_rgba(0,0,0,0.7)]',
          'pb-[env(safe-area-inset-bottom)]',
          isDark ? 'bg-zinc-950' : 'bg-white',
          className
        )}
        {...props}
      >
        {/* Drag handle pill */}
        <div className="mx-auto mt-3 mb-1 h-1.5 w-10 rounded-full bg-gray-200/80 dark:bg-zinc-700 shrink-0" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}
DrawerContent.displayName = 'DrawerContent';

/* ── Header ──────────────────────────────────────────── */
function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 px-6 pt-4 pb-3 border-b border-gray-100 dark:border-zinc-800', className)}
      {...props}
    />
  );
}
DrawerHeader.displayName = 'DrawerHeader';

/* ── Title ───────────────────────────────────────────── */
function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      className={cn('text-lg font-bold leading-none tracking-tight text-navy dark:text-zinc-200', className)}
      {...props}
    />
  );
}
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

/* ── Description ─────────────────────────────────────── */
function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      className={cn('text-sm text-slate-500 dark:text-zinc-400', className)}
      {...props}
    />
  );
}
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

/* ── Footer ──────────────────────────────────────────── */
function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 px-6 pt-2 pb-4 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}
DrawerFooter.displayName = 'DrawerFooter';

/* ── Body (scrollable zone) ──────────────────────────── */
function DrawerBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex-1 overflow-y-auto px-6', className)}
      {...props}
    />
  );
}
DrawerBody.displayName = 'DrawerBody';

export {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerClose,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerBody,
};
