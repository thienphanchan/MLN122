import { useState } from 'react';

export function Quiz({ questions, storageKey, disabled, onSubmit }) {
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey));
      if (Array.isArray(saved) && saved.length === 5 && saved.every((value) => value === null || (Number.isInteger(value) && value >= 0 && value < 4))) return saved;
    } catch { /* Vẫn cho làm bài khi trình duyệt chặn lưu. */ }
    return Array(5).fill(null);
  });
  const answered = answers.filter((value) => value !== null).length;
  function choose(index, value) {
    const next = answers.map((answer, i) => i === index ? value : answer);
    setAnswers(next);
    try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Lựa chọn vẫn ở trong bộ nhớ. */ }
  }
  return (
    <section className="room-quiz" aria-labelledby="screen-title">
      <div className="room-heading"><h1 id="screen-title" tabIndex={-1}>Trắc nghiệm cuối hành trình</h1><p>5 câu hỏi · mỗi câu đúng 10 điểm · chỉ nộp một lần. Đáp án được mở khi phòng kết thúc.</p></div>
      <form onSubmit={(e) => { e.preventDefault(); if (answered === 5 && !disabled) onSubmit(answers); }}>
        {questions.map((question, index) => (
          <fieldset className="quiz-question" key={question.id} disabled={disabled}>
            <legend>Câu {index + 1}. {question.text}</legend>
            <div className="quiz-options">
              {question.options.map((option, optionIndex) => (
                <label key={option} className="quiz-option"><input type="radio" name={question.id} value={optionIndex} checked={answers[index] === optionIndex} onChange={() => choose(index, optionIndex)} /><span>{option}</span></label>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="quiz-submit"><p role="status">Đã chọn {answered}/5 câu.</p><button className="btn btn--primary btn--large" type="submit" disabled={disabled || answered !== 5}>Nộp trắc nghiệm</button></div>
      </form>
    </section>
  );
}

export function QuizReview({ review }) {
  return <section className="quiz-review" aria-labelledby="review-title"><h2 id="review-title">Đáp án và giải thích</h2><ol>{review.map((question) => <li key={question.id}><h3>{question.text}</h3><p><strong>Đáp án đúng: </strong>{question.options[question.correctIndex]}</p><p><strong>Bạn chọn: </strong>{question.selected === null ? 'Chưa nộp' : question.options[question.selected]}</p><p>{question.explanation}</p></li>)}</ol></section>;
}
