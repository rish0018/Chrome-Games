import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'green' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      data-variant={variant === 'primary' ? undefined : variant}
      className={`px-btn ${className}`}
      {...props}
    />
  )
}

export function Modal({
  title,
  children,
  labelledBy = 'modal-title',
}: {
  title: ReactNode
  children: ReactNode
  labelledBy?: string
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className="px-box animate-pop w-full max-w-md p-6 text-center sm:p-8">
        <h2 id={labelledBy} className="text-lg sm:text-xl">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}

/** Small uppercase pixel-font label. */
export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`font-pixel text-[10px] uppercase leading-relaxed tracking-wide ${className}`}>{children}</p>
}
