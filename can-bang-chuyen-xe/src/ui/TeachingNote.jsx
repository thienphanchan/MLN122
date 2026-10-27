import { MODEL_NOTE, TEACHING_SOURCES } from '../game/teaching.js';

export function SourceLinks({ sourceIds }) {
  return (
    <ul className="learning-source-list" aria-label="Nguồn đối chiếu">
      {sourceIds.map((id) => {
        const source = TEACHING_SOURCES[id];
        return (
          <li key={id}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
            <span className="learning-source-locator">{source.locator}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function TeachingNote({ note }) {
  return (
    <details className="teaching-note">
      <summary>Cơ sở lý luận và nguồn</summary>
      <div className="teaching-note-body">
        <p>{note.text}</p>
        <SourceLinks sourceIds={note.sourceIds} />
        <p>{MODEL_NOTE}</p>
      </div>
    </details>
  );
}
