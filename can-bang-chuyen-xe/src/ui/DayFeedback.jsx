import { Icon } from './Icon.jsx';
import { TeachingNote } from './TeachingNote.jsx';

export function DayFeedback({ round, feedback }) {
  const positive = feedback.key === 'ok';
  return (
    <section className="day-feedback" aria-label={`Thông điệp ngày ${round}`} data-feedback={feedback.key}>
      <div className={`verdict verdict--${positive ? 'ok' : 'bad'}`}>
        <div className="verdict-heading">
          <Icon name={positive ? 'check' : 'alert'} size={26} />
          <h2 className="verdict-title">{feedback.title}</h2>
        </div>
        <p className="verdict-text">{feedback.message}</p>
      </div>
      <div className="feedback-body">
        <div className="feedback-reason">
          <h3>Vì sao?</h3>
          <p>{feedback.reason}</p>
          <p className="feedback-context">{feedback.context}</p>
        </div>
        <div className="feedback-solution">
          <h3>Hướng giải quyết</h3>
          <p>{feedback.solution}</p>
        </div>
        <TeachingNote note={feedback.theory} />
      </div>
    </section>
  );
}
