import { Suspense } from 'react'
import { BarChart3, ClipboardList, SquarePen } from 'lucide-react'
import AccessPanel from '@/components/AccessPanel'
import NavigationCard from '@/components/NavigationCard'
import PageContainer from '@/components/PageContainer'
import { routes } from '@/lib/routes'
import { getCurrentUserContext } from '@/lib/supabase/auth'
import styles from './page.module.scss'

const routeIcons = {
  '/completed-exercises/new': SquarePen,
  '/completed-exercises': ClipboardList,
  '/stats': BarChart3,
} as const

async function HomeContent() {
  const { supabase, user } = await getCurrentUserContext()

  if (!user) {
    return (
      <AccessPanel
        title="Sign in to see your training data"
        description="Create an account or sign in to add exercise categories, log exercises, and review your workouts."
        action={{ href: '/login', label: 'Sign In or Create Account' }}
      />
    )
  }

  const { data: userAccess } = await supabase
    .from('user_access')
    .select('approved')
    .eq('user_id', user.id)
    .maybeSingle()
  const accessStatus = userAccess?.approved ? 'approved' : 'pending'

  if (accessStatus === 'pending') {
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
          />
        )
      })}
    </div>
  )
}

export default function Home() {
  return (
    <PageContainer className={styles.Home}>
      <h1 className={styles.HomeTitle}>Training Journal</h1>
      <Suspense fallback={<HomeRoutes />}>
        <HomeContent />
      </Suspense>
    </PageContainer>
  )
}
