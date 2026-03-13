const ALIGNS = { right: 'justify-end', left: 'justify-start', between: 'justify-between' };

export default function ModalFooter({ children, align = 'right' }) {
  return (
    <div
      className={`flex items-center gap-3 px-6 py-4 shrink-0 ${ALIGNS[align] || ALIGNS.right}`}
      style={{ borderTop: '1px solid var(--color-border)' }}
    >
      {children}
    </div>
  );
}