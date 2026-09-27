import logoSvg from '../assets/logo.svg?raw';

/**
 * The supplied logo.svg is a single-colour vector (no fixed fills), so it is
 * inlined verbatim and tinted with `currentColor` — geometry and proportions
 * stay exactly as supplied; the colour follows the surface it sits on
 * (ink on paper, off-white on photographs/black).
 */
const inlineSvg = logoSvg
  .replace(/^[\s\S]*?<svg/, '<svg')
  .replace(/<\/svg>[\s\S]*$/, '</svg>');

type Props = {
  className?: string;
  label?: string;
};

export default function Logo({ className = '', label = 'Bison’s Space' }: Props) {
  return (
    <span
      className={`logo ${className}`.trim()}
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: inlineSvg }}
    />
  );
}
