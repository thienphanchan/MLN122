import { QUESTIONS } from '../src/room/questions.js';

const KEY = [
  { correctIndex: 1, explanation: 'Quan hệ lợi ích có cả mặt thống nhất và mâu thuẫn. Cần phối hợp lợi ích riêng với lợi ích chung và thích ứng theo biến cố.' },
  { correctIndex: 2, explanation: 'Chia sẻ rủi ro cần cân nhắc khả năng của nền tảng, bảo vệ tài xế và đối thoại giữa các bên liên quan.' },
  { correctIndex: 0, explanation: 'Giá rẻ có chi phí: nền tảng, tài xế hoặc khách hàng qua chất lượng dịch vụ có thể phải chịu phần chi phí đó.' },
  { correctIndex: 3, explanation: 'Một hành động đơn lẻ hoặc màu điểm không đủ để phân loại mâu thuẫn. Cần phân tích lợi ích cơ bản trong quan hệ xã hội cụ thể.' },
  { correctIndex: 1, explanation: 'Lợi ích của khách hàng gắn với các bên cung cấp dịch vụ. Động lực của tài xế ảnh hưởng đến nguồn xe và thời gian chờ.' },
];

export function gradeQuiz(answers) {
  if (!Array.isArray(answers) || answers.length !== QUESTIONS.length
    || !answers.every((answer) => Number.isInteger(answer) && answer >= 0 && answer < 4)) {
    throw new Error('Hãy chọn một đáp án cho đủ 5 câu hỏi.');
  }
  return answers.reduce((score, answer, index) => score + (answer === KEY[index].correctIndex ? 10 : 0), 0);
}

export function reviewQuiz(answers) {
  return QUESTIONS.map((question, index) => ({
    ...question, ...KEY[index], selected: answers?.[index] ?? null,
  }));
}
