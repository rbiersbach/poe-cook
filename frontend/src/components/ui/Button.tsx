export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  "data-variant"?: string;
  "data-size"?: string;
  "data-color"?: string;
  iconRight?: React.ReactNode;
  iconLeft?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  "data-variant": dataVariant,
  "data-size": dataSize,
  "data-color": dataColor = "default",
  iconRight,
  iconLeft,
  className = "",
  ...rest
}) => {
  const baseClass = `button ${className}`;

  return (
    <button
      className={baseClass}
      data-variant={dataVariant}
      data-size={dataSize}
      data-color={dataColor}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
};
