# Project Customization Rules

- **Không tự động push lên Git**: Không thực hiện lệnh `git push` trừ khi người dùng yêu cầu rõ ràng trong yêu cầu công việc. Chỉ lưu thay đổi cục bộ (local commits) hoặc chuẩn bị sẵn để người dùng tự duyệt push.
- **Giữ mã nguồn sạch và mô-đun hóa (Clean Code & Modularity)**: Phân tách các phần giao diện phức tạp như Modals, Components lớn, hoặc các trang nghiệp vụ riêng biệt ra các tệp tin và thư mục chuyên biệt (ví dụ: `src/components/admin/`, `src/pages/CsSupport/`) thay vì viết chung dồn vào một tệp tin lớn. Điều này giúp dễ quản lý, dễ bảo trì, và dễ debug.
- **Tuyệt đối KHÔNG sử dụng dữ liệu mẫu / ảnh giả tĩnh / giá trị Fallback tĩnh (No Hardcoded Static Demo Data & Fallback)**:
  - 100% dữ liệu hiển thị (ảnh đại diện shop, thông tin sản phẩm, số dư ví, vouchers, thông tin bưu cục, địa chỉ người gửi, địa chỉ người nhận, tọa độ bản đồ...) phải được truy vấn và phân tích động từ API/CSDL thực tế.
  - Tuyệt đối không hardcode các chuỗi văn bản tĩnh giả lập vị trí (ví dụ: cấm gán cứng `Tân Bình, TP.HCM` hay `Biên Hòa Hub` vào giao diện khi chưa phân tích chuỗi địa chỉ thực).
  - Nếu thiếu dữ liệu hoặc trường rỗng: Phải phân tích chuỗi địa chỉ người dùng thực hoặc hiển thị nhãn rỗng chuẩn/loading, tuyệt đối không gán giá trị mặc định của một địa danh cụ thể nào khác gây sai lệch luồng nghiệp vụ.
