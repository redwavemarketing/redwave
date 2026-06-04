/**
 * FileUpload — design-system §6.3. Drag-and-drop zone + browse button; shows accepted types/size and a
 * per-file list with remove. (Real upload + progress wiring is per-feature; this manages selection +
 * presentation.) Tokens only.
 */
import { File as FileIcon, UploadCloud, X } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { cx } from './cx';
import { IconButton } from './IconButton';
import styles from './FileUpload.module.css';

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  hint?: string;
  onFiles?: (files: File[]) => void;
}

export function FileUpload({ accept, multiple = true, hint = 'PDF, JPG or PNG — up to 10 MB', onFiles }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = multiple ? [...files, ...Array.from(list)] : Array.from(list).slice(0, 1);
    setFiles(next);
    onFiles?.(next);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    add(e.dataTransfer.files);
  };

  const remove = (i: number) => {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    onFiles?.(next);
  };

  return (
    <div>
      <div
        className={cx(styles.zone, dragging && styles.dragging)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      >
        <UploadCloud size={24} className={styles.zoneIcon} aria-hidden />
        <p className={styles.zoneTitle}>
          Drag files here or <span className={styles.browse}>browse</span>
        </p>
        <p className={styles.hint}>{hint}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className={styles.input}
          onChange={(e) => add(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <ul className={styles.list} role="list">
          {files.map((f, i) => (
            <li className={styles.fileRow} key={`${f.name}-${i}`}>
              <FileIcon size={16} className={styles.fileIcon} aria-hidden />
              <span className={styles.fileName}>{f.name}</span>
              <span className={cx(styles.fileSize, 'mono')}>{Math.max(1, Math.round(f.size / 1024))} KB</span>
              <IconButton label={`Remove ${f.name}`} icon={<X size={15} />} size="sm" onClick={() => remove(i)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
