import { OK_THRESHOLD } from './simulate.js';
import { OUTCOME_CONCEPTS, TEACHING_NOTES } from './teaching.js';

const PARTY_KEYS = ['D', 'P', 'K', 'X'];

// Đủ 16 tổ hợp, kể cả các tổ hợp chưa xuất hiện với công thức hiện tại.
// Chỉ diễn giải kết quả; không thay đổi điểm, quyết định hoặc dữ liệu lưu.
const CASES = {
  ok: {
    title: 'Cả bốn bên cùng ổn',
    message: 'Trong tình huống mô phỏng này, cả bốn bên đều đạt ngưỡng ổn. Kết quả gợi mở việc phối hợp các lợi ích chính đáng, thay vì chỉ tối ưu lợi ích của một bên.',
    reason: 'Cả bốn thanh đều đạt ít nhất 50 điểm. Phần thu của nền tảng, thu nhập tài xế, trải nghiệm khách và an sinh đang đáp ứng được ngưỡng của tình huống này.',
    solution: 'Giữ nguyên tắc chia sẻ lợi ích và rủi ro, rồi đánh giá lại khi có biến cố mới. Một phương án tốt hôm nay chưa chắc phù hợp với ngày mai.',
  },
  D: {
    title: 'Tài xế đang bị thiệt',
    message: 'Ba bên còn lại đang ổn, nhưng người trực tiếp cung cấp chuyến xe chưa được bảo đảm lợi ích. Thành công của hệ thống chưa trọn vẹn.',
    reason: 'Thu nhập thực nhận của tài xế dưới ngưỡng 50. Phần thu nhập giữ lại và hỗ trợ hiện có chưa đủ trước mức chiết khấu hoặc sức ép của biến cố.',
    solution: 'Thử giảm chiết khấu, bổ sung sàn thu nhập và bảo hiểm, hoặc tăng đối thoại. Kiểm tra lại lợi nhuận nền tảng để việc bảo vệ tài xế không chuyển toàn bộ khó khăn sang bên khác.',
  },
  P: {
    title: 'Nền tảng đang bị thiệt',
    message: 'Điểm lợi nhuận nền tảng chưa đạt ngưỡng ổn của game, dù ba bên còn lại đang xanh. Cần xem xét lợi ích của bên tổ chức dịch vụ cùng với lợi ích của tài xế, khách hàng và xã hội.',
    reason: 'Lợi nhuận nền tảng dưới ngưỡng 50. Trong mô phỏng, nguồn thu phụ thuộc cả chiết khấu lẫn mức sẵn sàng của tài xế, đồng thời phải bù chi phí chính sách và sức ép cạnh tranh.',
    solution: 'Thử mức chiết khấu vừa bảo đảm nguồn thu vừa duy trì tài xế tham gia. Khi chiết khấu đã cao mà nguồn tài xế yếu, tăng tỷ lệ thu thêm nữa có thể tiếp tục làm điểm lợi nhuận giảm trong mô phỏng.',
  },
  K: {
    title: 'Khách hàng đang bị thiệt',
    message: 'Kinh doanh và thu nhập có thể còn ổn, nhưng khách chưa được phục vụ tương xứng. Lợi ích của người sử dụng dịch vụ cũng phải được tính đến.',
    reason: 'Điểm trải nghiệm khách dưới ngưỡng 50. Trong mô phỏng, mức sẵn sàng của tài xế chi phối trải nghiệm; tài xế vừa đủ ổn vẫn có thể chưa đủ đáp ứng giờ cao điểm.',
    solution: 'Cải thiện thu nhập và mức sẵn sàng của tài xế bằng chiết khấu phù hợp cùng chính sách hỗ trợ. Đánh giá cả thời gian chờ và chất lượng phục vụ, thay vì chỉ chú ý giá rẻ.',
  },
  X: {
    title: 'Lợi ích xã hội chưa được bảo đảm',
    message: 'Từng bên trong giao dịch đang ổn, nhưng lợi ích chung vẫn bị bỏ lại. Ba thanh xanh chưa đủ để kết luận hệ thống đã cân bằng.',
    reason: 'Điểm xã hội dưới ngưỡng 50 vì an sinh và ổn định còn phụ thuộc vào mức thu nhập, trải nghiệm khách, chính sách bảo vệ và đối thoại. Ba bên đạt ngưỡng riêng chưa bảo đảm lợi ích chung đạt ngưỡng.',
    solution: 'Cân nhắc sàn thu nhập, bảo hiểm và đối thoại để củng cố an sinh. Phối hợp Nhà nước, nền tảng và tài xế, đồng thời kiểm tra chi phí thực hiện để nền tảng vẫn duy trì được dịch vụ.',
  },
  DP: {
    title: 'Tài xế yếu, nền tảng cũng yếu',
    message: 'Tài xế và nền tảng đều đang bị thiệt. Giành phần chia lớn hơn không giúp nền tảng thắng nếu người cung cấp dịch vụ không còn động lực.',
    reason: 'Thu nhập tài xế thấp kéo mức sẵn sàng cung cấp chuyến xe xuống; nguồn thu nền tảng giảm theo. Hai bên có mâu thuẫn khi chia lợi ích nhưng cũng phụ thuộc vào nhau để tạo ra lợi ích.',
    solution: 'Ưu tiên phục hồi thu nhập và nguồn tài xế bằng mức chiết khấu hợp lý, kết hợp hỗ trợ và đối thoại. Cần tăng phần lợi ích cùng tạo ra, thay vì chỉ chuyển phần thiệt từ bên này sang bên kia.',
  },
  DK: {
    title: 'Thiếu động lực, thiếu chuyến xe',
    message: 'Tài xế và khách hàng cùng bị thiệt. Khi người chạy xe không được bảo đảm lợi ích, người cần xe cũng khó có trải nghiệm tốt.',
    reason: 'Mức thu nhập dưới ngưỡng làm nguồn cung tài xế yếu đi. Trong mô phỏng, điểm khách phụ thuộc vào nguồn cung này và còn chịu thêm sức ép chờ xe vào giờ cao điểm.',
    solution: 'Giảm áp lực chiết khấu lên tài xế, cân nhắc sàn thu nhập và đối thoại để giữ người chạy xe. Sau đó kiểm tra khả năng phục vụ khách và lợi nhuận nền tảng để duy trì phương án lâu dài.',
  },
  DX: {
    title: 'Thu nhập giảm, an sinh giảm',
    message: 'Tài xế và xã hội cùng bị thiệt, dù nền tảng và khách hàng còn ổn. Lợi ích trong một giao dịch chưa phản ánh đủ tác động lên người lao động và cộng đồng.',
    reason: 'Thu nhập tài xế và điểm an sinh đều dưới ngưỡng. Khi sinh kế chưa được bảo đảm, thiếu cơ chế bảo vệ hoặc chia sẻ rủi ro có thể làm khó khăn của một bên trở thành vấn đề chung.',
    solution: 'Kết hợp điều chỉnh chiết khấu với sàn thu nhập, bảo hiểm và đối thoại. Mục tiêu là nâng đỡ tài xế, củng cố an sinh và vẫn giữ nguồn lực để nền tảng phục vụ khách.',
  },
  PK: {
    title: 'Kinh doanh yếu, khách vẫn thiệt',
    message: 'Nền tảng và khách hàng cùng bị thiệt. Lợi nhuận thấp không có nghĩa khách tự động được lợi, và khách chịu thiệt cũng không có nghĩa nền tảng đang thắng.',
    reason: 'Cả lợi nhuận lẫn trải nghiệm khách đều dưới ngưỡng. Hai kết quả này còn phụ thuộc vào nguồn tài xế và chi phí vận hành, nên thay đổi cách chia tiền không tự bảo đảm dịch vụ tốt hơn.',
    solution: 'Tìm mức chiết khấu cân bằng giữa nguồn thu và khả năng duy trì tài xế; rà lại chi phí của các chính sách đang bật. Kết hợp đối thoại để cải thiện phục vụ, tránh chỉ tăng chiết khấu hoặc ép giá.',
  },
  PX: {
    title: 'Lợi nhuận và an sinh cùng giảm',
    message: 'Nền tảng và xã hội đều đang bị thiệt. Dịch vụ vừa thiếu nguồn lực duy trì, vừa chưa tạo được sự ổn định cần thiết.',
    reason: 'Nguồn thu của nền tảng chưa đạt ngưỡng, còn cơ chế bảo đảm lợi ích chung chưa đủ hiệu quả. Việc các bên khác tạm ổn không tự giải quyết được chi phí vận hành và nhu cầu an sinh.',
    solution: 'Điều chỉnh chiết khấu để nền tảng có nguồn thu mà không làm tài xế suy yếu; phối hợp sàn thu nhập với đối thoại và tính chi phí thực hiện. Tránh cắt sạch chính sách chỉ để cứu lợi nhuận ngắn hạn.',
  },
  KX: {
    title: 'Chờ xe lâu, lợi ích chung giảm',
    message: 'Khách hàng và xã hội cùng bị thiệt. Thu nhập và lợi nhuận tạm ổn vẫn chưa đủ nếu dịch vụ không đáp ứng tốt nhu cầu đi lại.',
    reason: 'Trải nghiệm khách và điểm xã hội đều dưới ngưỡng. Khi nguồn tài xế chỉ vừa đủ hoặc thiếu trong giờ cao điểm, thời gian chờ tăng và chất lượng dịch vụ kéo lợi ích chung xuống.',
    solution: 'Cải thiện động lực tham gia của tài xế để tăng khả năng phục vụ khách. Kết hợp chính sách an sinh và đối thoại, đồng thời theo dõi lợi nhuận nền tảng để việc cải thiện dịch vụ có thể duy trì.',
  },
  DPK: {
    title: 'Dịch vụ mất cân bằng',
    message: 'Tài xế, nền tảng và khách hàng đều bị thiệt. Điểm xã hội còn xanh không thay thế được lợi ích của ba bên trực tiếp tạo ra và sử dụng dịch vụ.',
    reason: 'Thu nhập tài xế yếu làm nguồn cung và trải nghiệm khách giảm, đồng thời thu hẹp nguồn thu nền tảng. Chính sách có thể đang giữ điểm xã hội nhưng chưa đủ phục hồi hoạt động của dịch vụ.',
    solution: 'Điều chỉnh lại mức chiết khấu để phục hồi tài xế, phối hợp hỗ trợ có tính đến chi phí của nền tảng. Dùng đối thoại để thống nhất cách chia sẻ khó khăn và kiểm tra lại cả bốn thanh.',
  },
  DPX: {
    title: 'Sinh kế và ổn định cùng suy yếu',
    message: 'Tài xế, nền tảng và xã hội cùng bị thiệt. Khách hàng còn ổn hôm nay chưa có nghĩa dịch vụ sẽ được duy trì lâu dài.',
    reason: 'Thu nhập thấp khiến nguồn tài xế suy yếu, lợi nhuận giảm theo, trong khi an sinh và ổn định cũng không đạt ngưỡng. Lợi ích của người cung cấp và người tổ chức dịch vụ đang cùng gặp khó khăn.',
    solution: 'Phối hợp giảm áp lực chiết khấu, bảo đảm thu nhập và mở đối thoại. Không dồn toàn bộ chi phí sang tài xế hoặc nền tảng; cần phương án vừa phục hồi hoạt động vừa củng cố an sinh.',
  },
  DKX: {
    title: 'Lợi nhuận chưa phải tất cả',
    message: 'Tài xế, khách hàng và xã hội đều bị thiệt, dù nền tảng còn ổn. Tối ưu lợi ích riêng chưa phải là hài hòa lợi ích của cả hệ thống.',
    reason: 'Thu nhập tài xế, trải nghiệm khách và an sinh đều dưới ngưỡng. Việc nền tảng giữ được lợi nhuận không bù được sự suy yếu của người cung cấp dịch vụ, người sử dụng và lợi ích chung.',
    solution: 'Chia sẻ lại nguồn lợi để nâng thu nhập tài xế và cải thiện phục vụ khách; kết hợp bảo hiểm và đối thoại. Theo dõi cả lợi nhuận nền tảng để sự điều chỉnh không tạo thêm một bên bị thiệt.',
  },
  PKX: {
    title: 'Thu nhập riêng chưa đủ',
    message: 'Nền tảng, khách hàng và xã hội cùng bị thiệt, dù tài xế còn ổn. Bảo đảm lợi ích một bên cần đi cùng khả năng duy trì lợi ích của các bên khác.',
    reason: 'Lợi nhuận, chất lượng phục vụ và an sinh đều dưới ngưỡng. Thu nhập tài xế đạt mức ổn chưa đủ để khẳng định chi phí được chia hợp lý hoặc nhu cầu khách và lợi ích chung đã được đáp ứng.',
    solution: 'Đánh giá lại mức chiết khấu và chi phí chính sách để nền tảng có nguồn lực phục vụ khách. Giữ bảo vệ tài xế, đồng thời dùng đối thoại để tìm cách phân chia lợi ích và trách nhiệm phù hợp hơn.',
  },
  DPKX: {
    title: 'Cả hệ thống cùng bị thiệt',
    message: 'Cả tài xế, nền tảng, khách hàng và xã hội đều dưới ngưỡng ổn. Không bên nào có thể thắng lâu dài khi cả quan hệ lợi ích đang mất cân bằng.',
    reason: 'Thu nhập yếu kéo nguồn tài xế xuống, làm giảm trải nghiệm khách và nguồn thu nền tảng; an sinh cũng suy giảm. Các tác động nối tiếp nhau khiến khó khăn của một bên lan sang cả hệ thống.',
    solution: 'Điều chỉnh đồng thời mức chiết khấu và chính sách: phục hồi thu nhập tài xế, duy trì nguồn thu nền tảng, bảo đảm an sinh và tổ chức đối thoại. Tránh cực đoan chỉ cứu một thanh rồi bỏ mặc các thanh khác.',
  },
};

function eventContext({ round, floor, dialogue, result }) {
  switch (round) {
    case 1:
      return 'Ngày thường không có cú sốc bên ngoài; kết quả chủ yếu phản ánh mức chiết khấu và hai chính sách bạn đã chọn.';
    case 2:
      return 'Xăng tăng gây sức ép lên thu nhập tài xế, rồi ảnh hưởng các bên còn lại. ' + (floor
        ? 'Sàn thu nhập đang hỗ trợ tài xế nhưng nền tảng chịu thêm chi phí chính sách.'
        : 'Chưa bật sàn thu nhập nên chưa có phần hỗ trợ từ chính sách này.');
    case 3:
      return 'Đối thủ khuyến mãi khiến nền tảng chịu thêm sức ép lợi nhuận. Trong mô phỏng, sức ép này lớn hơn khi trải nghiệm khách chưa đủ tốt để giữ khách.';
    case 4:
      if (dialogue) return 'Đối thoại đang giúp giảm căng thẳng giữa các bên, hỗ trợ tài xế và ổn định xã hội, đồng thời tránh việc tắt app hàng loạt trong mô phỏng.';
      return result.strike
        ? 'Không có đối thoại và thu nhập quá thấp đã dẫn đến tài xế tắt app hàng loạt trong mô phỏng, làm nguồn cung và ổn định xã hội giảm mạnh.'
        : 'Chưa có đối thoại nên căng thẳng làm điểm xã hội giảm; tình huống hiện tại chưa kích hoạt tắt app hàng loạt trong mô phỏng.';
    case 5:
      return result.D < 55
        ? 'Nguồn tài xế chưa đủ đáp ứng giờ cao điểm nên khách chịu thêm phần thiệt do chờ xe lâu. Ngay cả khi tài xế vừa đạt ngưỡng ổn, khách vẫn có thể bị đỏ.'
        : 'Nguồn tài xế đủ đáp ứng giờ cao điểm nên khách không chịu thêm phần thiệt do chờ xe trong mô phỏng.';
    default:
      return '';
  }
}

export function getDayFeedback(game) {
  const key = PARTY_KEYS.filter((party) => game.result[party] < OK_THRESHOLD).join('') || 'ok';
  return { key, ...CASES[key], context: eventContext(game), theory: TEACHING_NOTES[OUTCOME_CONCEPTS[key]] };
}
