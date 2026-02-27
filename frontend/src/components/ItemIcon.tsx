import React from "react";

interface ItemIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  className?: string;
}

/**
 * ItemIcon ensures icons are always contained, square, and padded consistently.
 * Uses a container div and an img styled to handle icons of any aspect ratio.
 */
const ItemIcon: React.FC<ItemIconProps> = ({ src, alt = "icon", className = "", ...props }) => (
  <div
    style={{
      aspectRatio: "1 / 1",
      width: "2.5rem",
      height: "2.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "none",
    }}
    className={className}
    data-testid="item-icon-wrapper"
  >
    <img
      src={src}
      alt={alt}
      style={{
        maxHeight: "100%",
        width: "100%",
        objectFit: "contain",
        paddingBlock: "var(--s1)",
        display: "block",
      }}
      data-testid="item-icon-img"
      {...props}
    />
  </div>
);

export default ItemIcon;
