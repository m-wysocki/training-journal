import Link from 'next/link'
import type { AriaAttributes, MouseEventHandler, ReactNode } from 'react'
import styles from './ButtonSquare.module.scss'

type ButtonSquareSharedProps = AriaAttributes & {
  children: ReactNode
  className?: string
}

type ButtonSquareLinkProps = ButtonSquareSharedProps & {
  href: string
  prefetch?: boolean | null
}

type ButtonSquareButtonProps = ButtonSquareSharedProps & {
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  type?: 'button' | 'submit' | 'reset'
}

type ButtonSquareProps = ButtonSquareLinkProps | ButtonSquareButtonProps

export default function ButtonSquare({
  children,
  className,
  ...props
}: ButtonSquareProps) {
  const buttonClassName = [styles.buttonSquare, className].filter(Boolean).join(' ')

  if ('href' in props) {
    const { href, prefetch = true, ...linkProps } = props

    return (
      <Link href={href} prefetch={prefetch} {...linkProps} className={buttonClassName}>
        {children}
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
      {children}
    </button>
  )
}
