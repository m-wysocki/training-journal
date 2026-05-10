import { Tags } from 'lucide-react'
import BackLink from '@/components/BackLink'
import NavigationCard from '@/components/NavigationCard'
import PageContainer from '@/components/PageContainer'
import PageHeader from '@/components/PageHeader'
import styles from './page.module.scss'

const settingsRoutes = [
  {
    path: '/settings/exercise-categories',
    name: 'Exercise Categories',
    description: 'Manage your exercise categories',
    icon: Tags,
  },
]

export default function SettingsPage() {
  return (
    <PageContainer className={styles.Settings}>
      <BackLink href="/" label="Back to Home" />
      <PageHeader
        title="Settings"
        description="Manage account-related options and exercise setup."
      />
      <div className={styles.SettingsList}>
        {settingsRoutes.map((route) => (
          <NavigationCard
            key={route.path}
            href={route.path}
            title={route.name}
            description={route.description}
            icon={route.icon}
          />
        ))}
      </div>
    </PageContainer>
  )
}
