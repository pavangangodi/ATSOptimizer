export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const classes = ['button', `button--${variant}`, className].filter(Boolean).join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
