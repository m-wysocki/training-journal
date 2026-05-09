import Link from 'next/link'
import type { AriaAttributes, MouseEventHandler } from 'react'
import type { LucideIcon } from 'lucide-react'
import styles from './IconButton.module.scss'

type IconButtonSharedProps = AriaAttributes & {
  icon: LucideIcon
  iconSize?: number
  iconStrokeWidth?: number
  className?: string
}

type IconButtonLinkProps = IconButtonSharedProps & {
  href: string
  prefetch?: boolean | null
}

type IconButtonButtonProps = IconButtonSharedProps & {
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  type?: 'button' | 'submit' | 'reset'
}

type IconButtonProps = IconButtonLinkProps | IconButtonButtonProps

export default function IconButton({
  icon: Icon,
  iconSize = 18,
  iconStrokeWidth = 1.9,
  className,
  ...props
}: IconButtonProps) {
  const buttonClassName = [styles.IconButton, className].filter(Boolean).join(' ')

  if ('href' in props) {
    const { href, prefetch, ...linkProps } = props

    return (
      <Link href={href} prefetch={prefetch} {...linkProps} className={buttonClassName}>
        <Icon size={iconSize} strokeWidth={iconStrokeWidth} aria-hidden="true" />
      </Link>
    )
  }

  const { disabled, onClick, type = 'button', ...buttonProps } = props

  return (
    <button
      {...buttonProps}
      type={type}
      className={buttonClassName}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon size={iconSize} strokeWidth={iconStrokeWidth} aria-hidden="true" />
    </button>
  )
}
