interface ContextMenuProps {
  x: number;
  y: number;
  items: { label: string; onClick: () => void; disabled?: boolean }[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  return (
    <div
      className="fixed bg-[#3D2914] border-2 border-[#5D4037] z-50"
      style={{ 
        left: x, 
        top: y,
        boxShadow: '4px 4px 0 #1a1a1a',
        minWidth: '100px'
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseLeave={onClose}
    >
      {items.map((item, index) => (
        <button
          key={index}
          className={`w-full px-4 py-2 text-left text-xs transition-colors ${
            item.disabled
              ? 'text-[#5D4037] cursor-not-allowed'
              : 'text-[#DEB887] hover:bg-[#5D4037]'
          }`}
          style={{ 
            fontFamily: '"Press Start 2P", monospace', 
            fontSize: '8px',
            borderBottom: index < items.length - 1 ? '1px solid #5D4037' : 'none'
          }}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
              onClose();
            }
          }}
          disabled={item.disabled}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
