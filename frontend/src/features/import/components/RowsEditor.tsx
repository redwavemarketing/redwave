/**
 * RowsEditor — the JSON rows input for staging. Real Excel/CSV parse is STUBBED (§12), so rows are provided
 * as a JSON array: a Textarea (pre-fillable with the kind's template) + a stub FileUpload that reads a
 * selected `.json` file into the editor. The page parses + validates client-side (parseRows) before staging.
 * Tokens only.
 */
import { FileJson } from 'lucide-react';
import { Button, FileUpload, Textarea } from '../../../components/ui';
import { templateText } from '../import.logic';
import styles from './import.module.css';

interface Props {
  value: string;
  onChange: (v: string) => void;
  template: Record<string, unknown>[];
  error?: string | null;
}

export function RowsEditor({ value, onChange, template, error }: Props) {
  const onFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    file.text().then((text) => onChange(text)); // read the .json client-side (the backend parse is stubbed)
  };

  return (
    <div className={styles.form}>
      <div className={styles.editorHead}>
        <span className={styles.note}>Paste a JSON array of rows, or read a .json file. (Real Excel/CSV parsing is stubbed.)</span>
        <Button type="button" variant="tertiary" size="sm" leftIcon={<FileJson size={15} />} onClick={() => onChange(templateText(template))}>
          Insert template
        </Button>
      </div>
      <Textarea
        className={styles.editorArea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='[{ "mpu_id": "MPU-001" }]'
        maxHeight={360}
        rows={10}
        spellCheck={false}
      />
      <FileUpload accept=".json" multiple={false} hint="JSON file — read into the editor (parse stubbed)" onFiles={onFiles} />
      {error && <p className={styles.editorError}>{error}</p>}
    </div>
  );
}
