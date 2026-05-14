import StatusPanel from '@/components/StatusPanel'
import type { CompletedExerciseSubmitState } from '../_hooks/useCompletedExerciseSubmit'
import styles from './CompletedExerciseFormFooter.module.scss'

type Props = {
  form: CompletedExerciseSubmitState
  submitLabel: string
  submittingLabel: string
}

export default function CompletedExerciseFormFooter({ form, submitLabel, submittingLabel }: Props) {
  const { message, isError, loading } = form
  return (
    <div className={styles.CompletedExerciseFormFooter}>
      {message && (
        <StatusPanel variant={isError ? 'error' : 'success'} withTopSpacing>
          {message}
        </StatusPanel>
      )}
      <button type="submit" className={styles.CompletedExerciseFormFooterSubmit} disabled={loading}>
        {loading ? submittingLabel : submitLabel}
      </button>
    </div>
  )
}
