export default function ModalBody({ children, padding = true }) {
  return (
    <div className={`flex-1 overflow-y-auto ${padding ? 'px-6 py-5' : ''}`}>
      {children}
    </div>
  );
}