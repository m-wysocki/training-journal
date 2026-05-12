import { DatePicker } from '@/components/DatePicker'
import FormDialog from '@/components/FormDialog'
import { formatWeekdayDate } from '@/lib/trainingFormatters'
import type { CopyCategoryTarget } from '../_helpers/CompletedExercisesHelper'
import styles from './CompletedExerciseDialogs.module.scss'

type CompletedExerciseDialogsProps = {
  deleteOpen: boolean
  deleteLoading: boolean
  copyOpen: boolean
  copyLoading: boolean
  copyTarget: CopyCategoryTarget | null
  copyDate: string
  isCopyDateSameAsSource: boolean
  onCloseDelete: () => void
  onConfirmDelete: () => void
  onCloseCopyCategory: () => void
  onConfirmCopyCategory: () => void
  onSetCopyDate: (value: string) => void
}

export default function CompletedExerciseDialogs({
  deleteOpen,
  deleteLoading,
  copyOpen,
  copyLoading,
  copyTarget,
  copyDate,
  isCopyDateSameAsSource,
  onCloseDelete,
  onConfirmDelete,
  onCloseCopyCategory,
  onConfirmCopyCategory,
  onSetCopyDate,
}: CompletedExerciseDialogsProps) {
  return (
    <>
      <FormDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) onCloseDelete()
        }}
        size="small"
        title="Delete entry?"
        description="This action cannot be undone."
        primaryActionLabel={deleteLoading ? 'Deleting…' : 'Delete'}
        onPrimaryAction={onConfirmDelete}
        primaryActionDisabled={deleteLoading}
        primaryActionTone="danger"
      >
        <></>
      </FormDialog>

      <FormDialog
        open={copyOpen}
        onOpenChange={(open) => {
          if (!open) onCloseCopyCategory()
        }}
        size="small"
        title="Copy exercises"
        description={copyTarget
          ? `Copy ${copyTarget.categoryName} from ${formatWeekdayDate(copyTarget.sourceDate)} to another date.`
          : 'Choose a date to copy these exercises.'}
        primaryActionLabel={copyLoading ? 'Copying...' : 'Copy'}
        onPrimaryAction={onConfirmCopyCategory}
        primaryActionDisabled={copyLoading || !copyDate || isCopyDateSameAsSource}
      >
        <div className={styles.CompletedExercisesDialogForm}>
          <div className={styles.CompletedExercisesField}>
            <label htmlFor="copyDate" className={styles.CompletedExercisesLabel}>
              New date
            </label>
            <DatePicker
              id="copyDate"
              value={copyDate}
              onChange={onSetCopyDate}
            />
            {isCopyDateSameAsSource ? (
              <p className={styles.CompletedExercisesFieldHint}>Choose a different date than the source workout.</p>
            ) : null}
          </div>
        </div>
      </FormDialog>
    </>
  )
}
