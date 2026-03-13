import { useEffect } from 'react';

const SIZES = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-3xl',
  full: 'max-w-5xl',
};

export default function Modal({ open, onClose, size = 'md', children, closeOnOverlay = true }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
      />
      <div
        className="relative rounded-2xl shadow-modal w-auto z-10 flex flex-col max-h-[90vh] modal-content"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className={`${SIZES[size] || SIZES.md} w-full`} style={{ display: 'contents' }}>
          {children}
        </div>
      </div>
    </div>
  );
}