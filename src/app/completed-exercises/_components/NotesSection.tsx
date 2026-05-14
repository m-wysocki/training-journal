import { DatePicker } from '@/components/DatePicker'
import SurfaceCard from '@/components/SurfaceCard'
import styles from './NotesSection.module.scss'

type Props = {
  performedAt: string
  note: string
  setPerformedAt: (value: string) => void
  setNote: (value: string) => void
}

export default function NotesSection({ performedAt, note, setPerformedAt, setNote }: Props) {
  return (
    <SurfaceCard as="section" className={styles.NotesSection}>
      <div className={styles.NotesSectionHeader}>
        <h2 className={styles.NotesSectionTitle}>Notes</h2>
        <p className={styles.NotesSectionDescription}>Add the workout date and an optional note.</p>
      </div>
      <div className={styles.NotesSectionBody}>
        <label htmlFor="performedAt" className={styles.NotesSectionLabel}>Date</label>
        <DatePicker id="performedAt" value={performedAt} onChange={setPerformedAt} />
        <label htmlFor="note" className={styles.NotesSectionLabel}>Note</label>
        <textarea
          id="note"
          className={`${styles.NotesSectionInput} ${styles.NotesSectionTextarea}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Optional: how the workout felt, notes, observations..."
        />
      </div>
    </SurfaceCard>
  )
}
