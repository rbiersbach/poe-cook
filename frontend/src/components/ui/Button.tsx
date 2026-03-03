export interface ButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  title?: string;
  "data-variant"?: string;
  "data-size"?: string;
  iconRight?: React.ReactNode;
  iconLeft?: React.ReactNode;
  as?: "a" | "button";
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler;
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  href,
  target,
  rel,
  title,
  "data-variant": dataVariant,
  "data-size": dataSize,
  iconRight,
  iconLeft,
  as = "a",
  type = "button",
  onClick,
  disabled,
  className = "",
  ...rest
}) => {
  const baseClass = `button ${className}`;

  if (as === "button" || !href) {
    return (
      <button
        type={type}
        className={baseClass}
        title={title}
        data-variant={dataVariant}
        data-size={dataSize}
        onClick={onClick}
        disabled={disabled}
        {...rest}
      >
        {iconLeft}
        {children}
        {iconRight}
      </button>
    );
  }
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={baseClass}
      title={title}
      data-variant={dataVariant}
      data-size={dataSize}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </a>
  );
};
