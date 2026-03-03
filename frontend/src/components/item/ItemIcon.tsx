import React from "react";

interface ItemIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  className?: string;
  width?: string | number;
  height?: string | number;
}

/**
 * ItemIcon ensures icons are always contained, square, and padded consistently.
 * Uses a container div and an img styled to handle icons of any aspect ratio.
 */
const ItemIcon: React.FC<ItemIconProps> = ({ src, alt = "icon", className = "", width = "2.5rem", height = "2.5rem", ...props }) => (
  <div
    style={{ width, height }}
    className={`aspect-square flex items-center justify-center ${className}`}
    data-testid="item-icon-wrapper"
  >
    <img
      src={src}
      alt={alt}
      className="max-h-full w-full object-contain block"
      data-testid="item-icon-img"
      {...props}
    />
  </div>
);

export default ItemIcon;
