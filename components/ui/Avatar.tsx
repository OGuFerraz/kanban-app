'use client'
import { getInitials } from '@/lib/utils'
import { User } from '@/types'

interface AvatarProps {
  user: Pick<User, 'name' | 'color' | 'avatarUrl'>
  size?: 'sm' | 'md' | 'lg'
  title?: string
}

const sizes = { sm: 24, md: 28, lg: 36 }
const textSizes = { sm: '10px', md: '11px', lg: '14px' }

export default function Avatar({ user, size = 'md', title }: AvatarProps) {
  const px = sizes[size]
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={user.name}
        title={title ?? user.name}
        style={{ width: px, height: px, borderRadius: '50%', objectFit: 'cover' }}
      />
    )
  }
  return (
    <div
      title={title ?? user.name}
      style={{
        width: px, height: px,
        borderRadius: '50%',
        background: user.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: textSizes[size],
        fontWeight: 600,
        color: 'white',
        flexShrink: 0,
      }}
    >
      {getInitials(user.name)}
    </div>
  )
}
