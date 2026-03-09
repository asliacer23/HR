import type { FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPesoSign } from '@fortawesome/free-solid-svg-icons';

type PesoSignProps = Omit<FontAwesomeIconProps, 'icon'>;

export function PesoSign({ className, ...props }: PesoSignProps) {
  return <FontAwesomeIcon icon={faPesoSign} className={className} {...props} />;
}
