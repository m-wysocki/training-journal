'use client'

import { BarChart3, ClipboardList, SquarePen } from 'lucide-react'
import AccessPanel from '@/components/AccessPanel'
import NavigationCard from '@/components/NavigationCard'
import { routes } from '@/lib/routes'
import type { HomeAccessState } from './homeActions'
import styles from './page.module.scss'

const routeIcons = {
  '/completed-exercises/new': SquarePen,
  '/completed-exercises': ClipboardList,
  '/stats': BarChart3,
} as const

const routeIconTones = {
  '/completed-exercises/new': 'sage',
  '/completed-exercises': 'sand',
  '/stats': 'mist',
} as const

function HomeRoutes() {
  return (
    <div className={styles.HomeList}>
      {routes.map((route) => {
        const RouteIcon = routeIcons[route.path as keyof typeof routeIcons]

        return (
          <NavigationCard
            key={route.path}
            href={route.path}
            title={route.name}
            description={route.description}
            icon={RouteIcon}
            iconTone={routeIconTones[route.path as keyof typeof routeIconTones]}
          />
        )
      })}
    </div>
  )
}

type HomeClientProps = {
  accessState: HomeAccessState
}

export default function HomeClient({ accessState }: HomeClientProps) {
  if (accessState === 'signed-out') {
    return (
      <AccessPanel
        title="Sign in to see your training data"
        description="Create an account or sign in to add exercise categories, log exercises, and review your workouts."
        action={{ href: '/login', label: 'Sign In or Create Account' }}
      />
    )
  }

  if (accessState === 'pending') {
    return (
      <AccessPanel
        title="Account pending approval"
        description="Your account was created successfully. You will be able to use the journal after admin approval."
        variant="muted"
      />
    )
  }

  return <HomeRoutes />
}
