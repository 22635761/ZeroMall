const { Pool } = require('pg');
const crypto = require('crypto');

// Kết nối PostgreSQL tới schema auth và product
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/zeromall'
});

// Kho ảnh chất lượng cao theo từng ngành hàng (Unsplash CDN bản quyền mở)
const CATEGORY_IMAGES = {
  'thoi-trang-nam': [
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf',
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5',
    'https://images.unsplash.com/photo-1542272604-787c3835535d',
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a',
    'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f',
    'https://images.unsplash.com/photo-1576995853123-5a10305d93c0',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf'
  ],
  'thoi-trang-nu': [
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec515c7',
    'https://images.unsplash.com/photo-1539008835657-9e8e9680c956',
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b',
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1',
    'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03',
    'https://images.unsplash.com/photo-1554412933-514a83d2f3c8',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c',
    'https://images.unsplash.com/photo-1485968579580-b6d095142e6e'
  ],
  'giay-dep-nam': [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77',
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a',
    'https://images.unsplash.com/photo-1539185441755-769473a23570',
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5',
    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2',
    'https://images.unsplash.com/photo-1607522370275-f14206abe5d3'
  ],
  'giay-dep-nu': [
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2',
    'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95',
    'https://images.unsplash.com/photo-1562273138-f46be4ebdf33',
    'https://images.unsplash.com/photo-1511556532299-8f662fc26c06',
    'https://images.unsplash.com/photo-1581101767113-1677fc2beaa8',
    'https://images.unsplash.com/photo-1596703264627-72064dc9892d'
  ],
  'phu-kien-nu': [
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
    'https://images.unsplash.com/photo-1611591475152-478d13b9996a',
    'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6',
    'https://images.unsplash.com/photo-1534483509719-3feaee7c30da'
  ],
  'tui-vi-nu': [
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa',
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7',
    'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d',
    'https://images.unsplash.com/photo-1594223274512-ad4803739b7c',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62'
  ],
  'dong-ho': [
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
    'https://images.unsplash.com/photo-1524805444758-089113d48a6d',
    'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
    'https://images.unsplash.com/photo-1533139502658-0198f920d8e8'
  ],
  'dien-thoai-phu-kien': [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505',
    'https://images.unsplash.com/photo-1585338107529-13afc5f02586',
    'https://images.unsplash.com/photo-1609081219094-a31f24021574',
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0'
  ],
  'thiet-bi-dien-tu': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b',
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46',
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3',
    'https://images.unsplash.com/photo-1545454675-3531b543be5d'
  ],
  'may-tinh-laptop': [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2',
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9'
  ],
  'may-anh': [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd',
    'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39',
    'https://images.unsplash.com/photo-1495707902641-75cac588d2e9',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f'
  ],
  'gia-dung': [
    'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736',
    'https://images.unsplash.com/photo-1578643463396-0997cb5328c1',
    'https://images.unsplash.com/photo-1585659722983-3a675dabf23d',
    'https://images.unsplash.com/photo-1544816155-12df9643f363',
    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7'
  ],
  'nha-cua': [
    'https://images.unsplash.com/photo-1610701596007-11502861dcfa',
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8',
    'https://images.unsplash.com/photo-1588854337236-6889d631faa8',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f'
  ],
  'the-thao': [
    'https://images.unsplash.com/photo-1518611012118-696072aa579a',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155',
    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61'
  ],
  'me-va-be': [
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4',
    'https://images.unsplash.com/photo-1555252333-9f8e92e65df9',
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1',
    'https://images.unsplash.com/photo-1522771930-78848d9293e8',
    'https://images.unsplash.com/photo-1584839554749-6236d787c538'
  ],
  'sac-dep': [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b',
    'https://images.unsplash.com/photo-1512290900672-1f062d73347b',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03'
  ],
  'suc-khoe': [
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae',
    'https://images.unsplash.com/photo-1550572017-ed260e0a5c2d',
    'https://images.unsplash.com/photo-1584017911766-d451b3d0e843',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d'
  ],
  'sach-vpp': [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6',
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8'
  ]
};

// Dữ liệu mẫu sản phẩm và biến thể tiêu đề cho từng ngành
const CATEGORY_PRODUCTS_TEMPLATES = {
  'thoi-trang-nam': [
    { base: 'Áo Sơ Mi Trắng Nam Dài Tay', modifiers: ['Oxford Chống Nhăn', 'Vải Cotton Lụa Cao Cấp', 'Form Slimfit Công Sở', 'Vải Bamboo Kháng Khuẩn', 'Dáng Suông Rộng Phong Cách Hàn Quốc'], priceRange: [180000, 260000], brand: 'Routine' },
    { base: 'Áo Thun Nam Cổ Tròn Trơn Basic', modifiers: ['Cotton 100% Co Giãn 4 Chiều', 'Thoáng Khí Thấm Hút Mồ Hôi', 'Form Rộng Tay Lỡ Unisex', 'Chống Nhăn Bền Màu', 'Vải Dày Dặn Đứng Phom'], priceRange: [120000, 190000], brand: 'Coolmate' },
    { base: 'Áo Polo Nam Phối Cổ Trẻ Trung', modifiers: ['Vải Cá Sấu Cotton Mềm Mát', 'Thiết Kế Thể Thao Năng Động', 'Công Sở Lịch Lãm Sang Trọng', 'Co Giãn Chống Nhăn', 'Phom Chuẩn Ôm Dáng'], priceRange: [190000, 290000], brand: 'Aristino' },
    { base: 'Áo Khoác Bomber Nam Cực Ngầu', modifiers: ['Nỉ Ngoại Dày Dặn 2 Lớp', 'Chất Vải Gió Chống Nước', 'Phong Cách Đường Phố Streetwear', 'Bo Chun Cổ Tay Chắc Chắn', 'Lót Lụa Mềm Nhẹ Thoải Mái'], priceRange: [280000, 420000], brand: 'No Brand' },
    { base: 'Quần Jean Nam Dáng Ống Suông', modifiers: ['Denim Cao Cấp Không Co Rút', 'Màu Xanh Cổ Điển Wash Nhẹ', 'Phong Cách Vintage Unisex', 'Chất Bò Dày Dặn Co Giãn', 'Cạp Vừa Tôn Dáng'], priceRange: [290000, 450000], brand: 'Levi\'s' },
    { base: 'Quần Jogger Nam Thể Thao', modifiers: ['Nỉ Chân Cua Co Giãn Tốt', 'Bo Gấu Năng Động Đi Chơi Đi Tập', 'Vải Kaki Dày Dặn Túi Hộp', 'Dáng Thể Thao Ôm Chân', 'Thấm Hút Mồ Hôi Siêu Mát'], priceRange: [195000, 320000], brand: 'No Brand' },
    { base: 'Quần Tây Nam Công Sở Dáng Đứng', modifiers: ['Vải Tuyết Mưa Cao Cấp Chống Nhăn', 'Xếp Ly Tinh Tế Chuẩn Phom', 'Cạp Cao Co Giãn Nhẹ', 'Màu Đen Ghi Lịch Sự Đi Làm', 'Dáng Hàn Quốc Trẻ Trung'], priceRange: [260000, 390000], brand: 'An Phước' },
    { base: 'Áo Hoodie Nam Nữ In Họa Tiết', modifiers: ['Nỉ Bông Ấm Áp Mùa Đông', 'Mũ 2 Lớp Form Rộng Unisex', 'Họa Tiết Đơn Giản Tinh Tế', 'Túi Trước Bụng Tiện Lợi', 'Vải Cotton Mềm Mịn Không Xù'], priceRange: [220000, 350000], brand: 'No Brand' },
    { base: 'Áo Blazer Nam Phong Cách Hàn Quốc', modifiers: ['Dáng Rộng 1 Khuy Thanh Lịch', 'Vải Dạ Mịn Cao Cấp Có Lót', 'Phù Hợp Đi Tiệc Và Đi Làm', 'Form Đứng Vai Đệm Nhẹ', 'Chống Nhăn Giữ Phom Suốt Ngày'], priceRange: [450000, 750000], brand: 'Biluxury' },
    { base: 'Quần Short Đùi Nam Mặc Nhà Đi Chơi', modifiers: ['Kaki Mềm Mát Co Giãn', 'Thun Lưng Dây Rút Tiện Lợi', 'Vải Gió Thể Thao Nhanh Khô', 'Túi Sâu Khóa Kéo An Toàn', 'Phong Cách Đi Biển Trẻ Trung'], priceRange: [99000, 175000], brand: 'No Brand' }
  ],
  'thoi-trang-nu': [
    { base: 'Váy Hoa Nhí Dáng Xòe Điệu Đà', modifiers: ['Chất Voan Tơ Tằm 2 Lớp', 'Cổ Vuông Tay Bồng Duyên Dáng', 'Thắt Eo Tôn Dáng Mùa Hè', 'Họa Tiết Cúc Họa Mi Xinh Xắn', 'Dáng Dài Qua Gối Tiểu Thư'], priceRange: [230000, 360000], brand: 'Dottie' },
    { base: 'Đầm Dự Tiệc Nữ Sang Trọng', modifiers: ['Thiết Kế Cổ Yếm Quyến Rũ', 'Chất Vải Tafta Cao Cấp Đứng Phom', 'Đính Nơ Vai Thanh Lịch', 'Dáng Ôm Body Tôn Đường Cong', 'Màu Đỏ Rượu Quyến Rũ'], priceRange: [380000, 590000], brand: 'Elise' },
    { base: 'Chân Váy Chữ A Lưng Cao Nữ', modifiers: ['Kèm Quần Trong Tiện Lợi', 'Chất Kaki Đứng Dáng Co Giãn', 'Xếp Ly Năng Động Phong Cách Hàn', 'Cạp Cao Tôn Eo Thon', 'Vải Dày Dặn Không Nhăn'], priceRange: [145000, 240000], brand: 'Gumac' },
    { base: 'Áo Sơ Mi Nữ Tay Phồng Cổ Bèo', modifiers: ['Vải Tơ Ánh Kim Mềm Rủ', 'Họa Tiết Chấm Bi Thanh Lịch', 'Công Sở Đi Làm Tinh Tế', 'Dễ Phối Chân Váy Quần Tây', 'Vải Lụa Hàn Không Nhăn'], priceRange: [195000, 310000], brand: 'Nem' },
    { base: 'Áo Croptop Nữ Ôm Body Cổ Tròn', modifiers: ['Thun Gân Tăm Co Giãn Siêu Tốt', 'Mặc Lót Hoặc Phối Blazer Cực Xinh', 'Tôn Vòng Eo Thon Gọn', 'Chất Vải Mát Không Hầm Bí', 'Màu Sắc Trẻ Trung Dễ Thương'], priceRange: [85000, 160000], brand: 'No Brand' },
    { base: 'Quần Jean Nữ Cạp Cao Ống Rộng', modifiers: ['Hack Dáng Chân Dài Miên Man', 'Chất Bò Dày Dặn Mềm Mại', 'Rách Gối Nhẹ Cá Tính', 'Màu Xanh Khói Thời Thượng', 'Đường Chỉ May Tỉ Mỉ Chắc Chắn'], priceRange: [260000, 390000], brand: 'No Brand' },
    { base: 'Áo Cardigan Len Dệt Kim Mỏng', modifiers: ['Cúc Cài Phối Viền Cổ Retro', 'Mặc Thu Đông Hoặc Phòng Máy Lạnh', 'Chất Len Mềm Không Ngứa', 'Màu Pastel Ngọt Ngào Dễ Thương', 'Form Rộng Rãi Thoải Mái'], priceRange: [175000, 280000], brand: 'Marc' },
    { base: 'Váy Yếm Kaki Nữ Dáng Suông', modifiers: ['Phong Cách Vintage Dễ Thương', 'Túi Trước Tiện Lợi Phối Áo Thun', 'Dây Điều Chỉnh Chiều Dài Linh Hoạt', 'Chất Kaki Dày Dặn Bền Đẹp', 'Màu Be Nâu Nhẹ Nhàng'], priceRange: [210000, 320000], brand: 'No Brand' },
    { base: 'Đầm Maxi Đi Biển Nữ Bay Bổng', modifiers: ['Chất Vải Đũi Tơ Mềm Mát', 'Hở Lưng Đan Dây Quyến Rũ', 'Tùng Váy Xòe Rộng Chụp Ảnh Siêu Đẹp', 'Cổ V Sâu Gợi Cảm', 'Màu Trắng Tinh Khôi'], priceRange: [290000, 450000], brand: 'Ivy Moda' },
    { base: 'Set Đồ Bộ Nữ Mặc Nhà Cao Cấp', modifiers: ['Lụa Satin Mềm Mại Thoáng Mát', 'Tay Ngắn Quần Dài Thanh Lịch', 'Viền Bèo Nữ Tính Sang Trọng', 'Không Nhăn Nhàu Sau Khi Giặt', 'Họa Tiết Dễ Thương Dịu Mắt'], priceRange: [165000, 270000], brand: 'No Brand' }
  ],
  'giay-dep-nam': [
    { base: 'Giày Sneaker Nam Thể Thao', modifiers: ['Đế Êm Độn Cao 4cm Chống Trơn', 'Vải Dệt Lưới Thoáng Khí Đi Cả Ngày', 'Phong Cách Đường Phố Trẻ Trung', 'Phù Hợp Chạy Bộ Đi Học Đi Làm', 'Màu Trắng Đen Basic Dễ Phối Đồ'], priceRange: [280000, 520000], brand: 'Biti\'s' },
    { base: 'Giày Tây Nam Công Sở Oxford', modifiers: ['Da Bò Thật Dập Vân Tinh Tế', 'Đế Phíp Khâu Chắc Chắn Bền Đẹp', 'Mũi Nhọn Cổ Điển Lịch Lãm', 'Lót Da Thoáng Khử Mùi Hôi', 'Màu Nâu Đen Sang Trọng'], priceRange: [450000, 890000], brand: 'No Brand' },
    { base: 'Giày Lười Nam Loafer Da Trơn', modifiers: ['Xỏ Nhanh Tiện Lợi Không Cần Buộc Dây', 'Khóa Kim Loại Điểm Nhấn Tinh Tế', 'Đế Cao Su Chống Trượt Chống Mòn', 'Da Cao Cấp Mềm Ôm Bàn Chân', 'Đi Làm Đi Tiệc Đều Phù Hợp'], priceRange: [380000, 680000], brand: 'No Brand' },
    { base: 'Dép Quai Ngang Nam Đế Đúc', modifiers: ['Chất Liệu EVA Siêu Nhẹ Kháng Nước', 'Thiết Kế Quai Dày Chống Lún Êm Chân', 'Đế Chống Trơn Trượt An Toàn Đi Mưa', 'Chống Hôi Chân Dễ Dàng Vệ Sinh', 'Kiểu Dáng Thể Thao Thời Trang'], priceRange: [85000, 160000], brand: 'Hunter' },
    { base: 'Sandal Nam Quai Dù Chiến Binh', modifiers: ['Khóa Dán Điều Chỉnh Linh Hoạt', 'Đế Kép Chống Lún Siêu Bền', 'Đi Học Đi Mưa Thoải Mái', 'Đường May Viền Cực Kỳ Tỉ Mỉ', 'Phong Cách Năng Động Học Sinh'], priceRange: [190000, 310000], brand: 'Biti\'s' }
  ],
  'giay-dep-nu': [
    { base: 'Giày Cao Gót Nữ Mũi Nhọn 7cm', modifiers: ['Gót Nhọn Thanh Mảnh Tôn Dáng', 'Chất Liệu Da Bóng Sang Trọng', 'Lót Đệm Êm Chân Không Đau Mỏi', 'Màu Nude Đen Chuẩn Công Sở', 'Khóa Gót Chắc Chắn Không Rơi'], priceRange: [280000, 480000], brand: 'Juno' },
    { base: 'Giày Búp Bê Nữ Đế Bệt Mũi Vuông', modifiers: ['Đính Nơ Nhỏ Xinh Dễ Thương', 'Chất Da Mềm Mại Gấp Đôi Tiện Lợi', 'Đế Cao Su Dẻo Chống Trơn', 'Đi Bộ Cả Ngày Êm Ái Không Đau Gót', 'Màu Be Kem Hàn Quốc'], priceRange: [195000, 320000], brand: 'Vascara' },
    { base: 'Sandal Nữ Quai Mảnh Gót Vuông 5cm', modifiers: ['Khóa Cài Cổ Chân Duyên Dáng', 'Đế Vuông Vững Chãi Dễ Bước Đi', 'Phù Hợp Mặc Váy Đi Tiệc Đi Chơi', 'Quai Mảnh Tôn Bàn Chân Trắng Thon', 'Màu Bạc Ánh Kim Thời Thượng'], priceRange: [240000, 390000], brand: 'Juno' },
    { base: 'Giày Sneaker Nữ Độn Đế 5cm', modifiers: ['Hack Dáng Trẻ Trung Năng Động', 'Chất Da Mềm Phối Lưới Thoáng Mát', 'Trọng Lượng Nhẹ Êm Chân Khi Di Chuyển', 'Màu Trắng Phối Hồng Pastel Ngọt Ngào', 'Dễ Mix Đồ Chân Váy Quần Jean'], priceRange: [260000, 450000], brand: 'Biti\'s' },
    { base: 'Dép Bánh Mì Nữ Quai Ngang Dày', modifiers: ['Đế Cao 4cm Êm Chân Nhẹ Tênh', 'Chất Liệu Nhựa EVA Nguyên Khối Kháng Nước', 'Đi Mưa Đi Biển Siêu Bền', 'Màu Sắc Kẹo Ngọt Xinh Xắn', 'Chống Trơn Trượt Tuyệt Đối'], priceRange: [79000, 149000], brand: 'No Brand' }
  ],
  'phu-kien-nu': [
    { base: 'Dây Chuyền Nữ Bạc Ý S925', modifiers: ['Mặt Dây Hình Cỏ Bốn Lá May Mắn', 'Đính Đá Zircon Lấp Lánh Tinh Xảo', 'Không Gỉ Sét Không Dị Ứng Da', 'Mạ Vàng Trắng Sáng Bóng Lâu Phai', 'Tặng Kèm Hộp Đựng Quà Sang Trọng'], priceRange: [150000, 350000], brand: 'PNJ Silver' },
    { base: 'Khuyên Tai Nữ Nụ Đính Đá', modifiers: ['Chất Liệu Bạc Ý An Toàn Cho Tai Nhạy Cảm', 'Thiết Kế Cổ Điển Tinh Tế Dễ Đeo', 'Chốt Cài Chắc Chắn Không Rơi', 'Sáng Lấp Lánh Thu Hút Mọi Ánh Nhìn', 'Phù Hợp Đeo Hàng Ngày Đi Làm Đi Học'], priceRange: [85000, 190000], brand: 'No Brand' },
    { base: 'Kính Mát Nữ Gọng Kim Loại Thời Trang', modifiers: ['Tròng Phân Cực Chống Tia UV400', 'Gọng Thanh Mảnh Nhẹ Không Hằn Sống Mũi', 'Thiết Kế Mắt Mèo Cá Tính Tôn Khuôn Mặt', 'Chống Chói Lóa Khi Đi Nắng', 'Kèm Hộp Đựng Khăn Lau Tiện Dụng'], priceRange: [160000, 290000], brand: 'No Brand' },
    { base: 'Kẹp Tóc Càng Cua Kim Loại Đính Ngọc', modifiers: ['Họa Tiết Bướm Xinh Xắn Hàn Quốc', 'Lò Xo Thép Chắc Chắn Giữ Tóc Dày', 'Mạ Vàng Sáng Bóng Sang Chảnh', 'Không Gây Đau Đầu Khi Kẹp Lâu', 'Phụ Kiện Chụp Ảnh Sống Ảo Siêu Xinh'], priceRange: [35000, 85000], brand: 'No Brand' },
    { base: 'Khăn Choàng Cổ Lụa Vuông 70x70', modifiers: ['Họa Tiết Phong Cách Cổ Điển Pháp', 'Chất Lụa Satin Mềm Mượt Óng Ánh', 'Dùng Buộc Cổ Áo Hoặc Quấn Túi Xách', 'Màu Sắc Thanh Lịch Tinh Tế', 'Dễ Giặt Không Bay Màu'], priceRange: [55000, 125000], brand: 'No Brand' }
  ],
  'tui-vi-nu': [
    { base: 'Túi Xách Nữ Đeo Chéo Mini', modifiers: ['Chất Da PU Cao Cấp Mềm Mịn', 'Khóa Kim Loại Sáng Bóng Không Gỉ', 'Kích Thước Vừa Vặn Đựng Điện Thoại Son Phấn', 'Dây Xích Phối Da Đeo Vai Êm Ái', 'Màu Đen Trắng Pastel Nữ Tính'], priceRange: [180000, 340000], brand: 'Micocah' },
    { base: 'Túi Kẹp Nách Nữ Dáng Retro', modifiers: ['Phong Cách Y2K Thời Thượng Sành Điệu', 'Form Đứng Cứng Cáp Đẹp Mắt', 'Khóa Kéo Mượt Mà Ngăn Rộng Rãi', 'Dây Quai Vừa Vặn Ôm Vai Tôn Dáng', 'Chất Da Vân Cá Sấu Sang Trọng'], priceRange: [195000, 360000], brand: 'Vascara' },
    { base: 'Ví Nữ Cầm Tay Dài Nhiều Ngăn', modifiers: ['Đựng Vừa Điện Thoại Và Nhiều Thẻ', 'Khóa Kéo 2 Ngăn Tiện Lợi', 'Chất Da Nhân Tạo Bền Không Tróc', 'Đường May Tỉ Mỉ Kèm Quai Đeo Cổ Tay', 'Màu Sắc Nhã Nhặn Hợp Mệnh'], priceRange: [130000, 250000], brand: 'No Brand' },
    { base: 'Túi Tote Vải Canvas Cỡ Lớn', modifiers: ['Đựng Vừa Laptop 14 Inch Sách Vở', 'Có Khóa Kéo Miệng Và Túi Con Bên Trong', 'Chất Vải Bố Dày Dặn Bền Chắc', 'In Họa Tiết Tối Giản Trẻ Trung', 'Đi Học Đi Làm Đi Siêu Thị Cực Tiện'], priceRange: [89000, 169000], brand: 'No Brand' },
    { base: 'Balo Nữ Mini Da Trơn Đi Chơi', modifiers: ['Nhiều Ngăn Nhỏ Tiện Dụng Chống Trộm', 'Quai Đeo Bọc Đệm Không Mỏi Vai', 'Kháng Nước Nhẹ Dễ Vệ Sinh Lau Chùi', 'Thiết Kế Đáng Yêu Phù Hợp Học Sinh', 'Khóa Kéo Kim Loại Chắc Chắn'], priceRange: [175000, 310000], brand: 'No Brand' }
  ],
  'dong-ho': [
    { base: 'Đồng Hồ Nam Dây Da Thể Thao', modifiers: ['Mặt Kính Khoáng Chống Trầy Xước', 'Chống Nước 3ATM Rửa Tay Đi Mưa', 'Kim Dạ Quang Phát Sáng Ban Đêm', 'Thiết Kế Lộ Cơ Tinh Xảo Đẳng Cấp', 'Dây Da Mềm Không Thấm Mồ Hôi'], priceRange: [350000, 750000], brand: 'Casio' },
    { base: 'Đồng Hồ Nữ Dây Kim Loại Đính Đá', modifiers: ['Viền Khảm Pha Lê Lấp Lánh Sang Trọng', 'Mặt Số Khảm Xà Cừ Ánh Xanh Tinh Tế', 'Chống Nước Chuẩn Sinh Hoạt Hàng Ngày', 'Khóa Bấm Bướm Tiện Lợi Bền Chắc', 'Kích Thước Mặt Nhỏ 28mm Tôn Cổ Tay'], priceRange: [290000, 680000], brand: 'Citizen' },
    { base: 'Đồng Hồ Điện Tử Nam Nữ Chống Nước', modifiers: ['Đèn LED Sáng Rõ Hiển Thị Ngày Giờ', 'Chức Năng Bấm Giờ Thể Thao Báo Thức', 'Dây Cao Su Thể Thao Bền Chắc', 'Phong Cách Năng Động Trẻ Trung', 'Pin Bền Sử Dụng Lên Đến 2 Năm'], priceRange: [150000, 320000], brand: 'Casio' },
    { base: 'Đồng Hồ Đôi Nam Nữ Tình Nhân', modifiers: ['Mặt Kính Cong Chống Trầy Cao Cấp', 'Thiết Kế Tối Giản Thanh Lịch Bauhaus', 'Dây Thép Lưới Nhuyễn Ôm Sát Cổ Tay', 'Tặng Kèm Hộp Đựng Cặp Đôi Làm Quà', 'Bộ Máy Pin Quartz Nhật Bản Bền Bỉ'], priceRange: [480000, 950000], brand: 'Daniel Wellington' }
  ],
  'dien-thoai-phu-kien': [
    { base: 'Củ Sạc Nhanh Type-C 20W/30W GaN', modifiers: ['Hỗ Trợ Chuẩn Sạc Nhanh PD QC3.0', 'Kích Thước Nhỏ Gọn Không Nóng Máy', 'Bảo Vệ Quá Nhiệt Quá Dòng An Toàn', 'Tương Thích Mọi Dòng Điện Thoại', 'Vỏ Nhựa Chống Cháy Cao Cấp'], priceRange: [120000, 250000], brand: 'Baseus' },
    { base: 'Cáp Sạc Nhanh Bọc Dù Dài 1m/2m', modifiers: ['Đầu Cắm Hợp Kim Nhôm Chống Gãy Gập', 'Tốc Độ Truyền Dữ Liệu 480Mbps', 'Lõi Đồng Dày Dẫn Điện Siêu Tốc', 'Chịu Lực Uốn Cong Hơn 10000 Lần', 'Kèm Dây Dán Thu Gọn Tiện Lợi'], priceRange: [45000, 99000], brand: 'Ugreen' },
    { base: 'Pin Sạc Dự Phòng 10000mAh/20000mAh', modifiers: ['Tích Hợp Sạc Nhanh 22.5W Có Màn Hình LED', 'Sạc Cùng Lúc 3 Thiết Bị Tiện Lợi', 'Thiết Kế Mỏng Nhẹ Dễ Bỏ Túi Quần', 'Lõi Pin Li-Polymer An Toàn Trên Máy Bay', 'Vỏ Hợp Kim Nhôm Tản Nhiệt Tốt'], priceRange: [260000, 490000], brand: 'Anker' },
    { base: 'Kính Cường Lực Điện Thoại Full Màn Hình', modifiers: ['Độ Cứng 9H Chống Trầy Xước Va Đập', 'Lớp Phủ Nano Chống Bám Vân Tay', 'Độ Trong Suốt HD Giữ Nguyên Màu Màn', 'Viền Bo Cong 2.5D Cảm Ứng Mượt Mà', 'Kèm Khung Dán Tự Động Siêu Dễ'], priceRange: [35000, 75000], brand: 'No Brand' },
    { base: 'Ốp Lưng Chống Sốc Trong Suốt', modifiers: ['Góc Đệm Khí Chống Va Đập Độ Cao 2m', 'Chất Liệu TPU Cao Cấp Lâu Ố Vàng', 'Bảo Vệ Viền Camera Nhô Cao Tránh Xước', 'Nút Bấm Nhẹ Êm Tay Chính Xác', 'Hỗ Trợ Sạc Không Dây Từ Tính'], priceRange: [49000, 110000], brand: 'No Brand' },
    { base: 'Giá Đỡ Điện Thoại Để Bàn Gấp Gọn', modifiers: ['Hợp Kim Nhôm Xoay 360 Độ Linh Hoạt', 'Đệm Silicon Chống Trơn Trượt Bảo Vệ Máy', 'Điều Chỉnh Góc Nhìn Chống Mỏi Cổ', 'Gấp Phẳng Bỏ Túi Tiện Đi Làm Đi Học', 'Tải Trọng Lớn Chắc Chắn Không Rung'], priceRange: [65000, 140000], brand: 'Baseus' }
  ],
  'thiet-bi-dien-tu': [
    { base: 'Tai Nghe Bluetooth Không Dây TWS', modifiers: ['Chống Ồn Chủ Động ANC Âm Bass Trầm', 'Thời Lượng Pin 28 Giờ Kèm Hộp Sạc', 'Bluetooth 5.3 Kết Nối Ổn Định Độ Trễ Thấp', 'Cảm Ứng Vân Tay Điều Khiển Nhanh Chóng', 'Kháng Nước IPX5 Đi Mưa Tập Gym'], priceRange: [290000, 650000], brand: 'Edifier' },
    { base: 'Loa Bluetooth Mini Cầm Tay', modifiers: ['Âm Thanh Vòm 360 Độ Công Suất 10W', 'Chống Nước IPX7 Nổi Trên Mặt Nước', 'Pin 10 Giờ Phát Nhạc Liên Tục', 'Đèn LED Nhấp Nháy Theo Giai Điệu', 'Kèm Móc Treo Tiện Lợi Khi Đi Dã Ngoại'], priceRange: [250000, 580000], brand: 'JBL' },
    { base: 'Chuột Không Dây Silent Chống Ồn', modifiers: ['Nút Bấm Êm Không Phát Ra Tiếng Cách', 'Độ Phân Giải 1600DPI Lướt Mượt Trên Mọi Mặt', 'Kết Nối 2.4Ghz Cắm Là Chạy Tiết Kiệm Pin', 'Thiết Kế Công Thái Học Vừa Vặn Lòng Bàn Tay', 'Trọng Lượng Siêu Nhẹ Dễ Mang Theo'], priceRange: [110000, 240000], brand: 'Logitech' },
    { base: 'Bàn Phím Cơ Không Dây 3 Chế Độ', modifiers: ['Switch Gateron Bấm Nảy Êm Tay', 'Đèn Nền RGB Đổi Màu Đa Dạng', 'Hỗ Trợ Kết Nối Bluetooth Type-C 2.4G', 'Keycap PBT Double Shot Không Phai Ký Tự', 'Thời Lượng Pin Dùng Cả Tháng'], priceRange: [650000, 1250000], brand: 'DareU' },
    { base: 'Webcam Máy Tính Full HD 1080P', modifiers: ['Tích Hợp Micro Kép Lọc Tiếng Ồn Thông Minh', 'Tự Động Lấy Nét Và Cân Bằng Ánh Sáng', 'Có Nắp Che Bảo Vệ Quyền Riêng Tư', 'Kẹp Màn Hình Hoặc Gắn Chân Tripod Dễ Dàng', 'Cắm Cổng USB Tương Thích Mọi Phần Mềm Học Online'], priceRange: [220000, 480000], brand: 'No Brand' }
  ],
  'may-tinh-laptop': [
    { base: 'Giá Đỡ Tản Nhiệt Laptop Nhôm', modifiers: ['Điều Chỉnh 6 Mức Độ Cao Chống Mỏi Lưng', 'Hợp Kim Nhôm Cao Cấp Tản Nhiệt Cực Nhanh', 'Gấp Gọn Nhẹ Nhàng Bỏ Cặp Balo', 'Đệm Cao Su Chống Trầy Xước Máy', 'Chịu Tải Lên Đến 10kg Rất Vững'], priceRange: [95000, 185000], brand: 'Baseus' },
    { base: 'Balo Đựng Laptop 15.6 Inch Chống Nước', modifiers: ['Chất Vải Oxford Cao Cấp Chống Trầy Xước', 'Ngăn Chống Sốc Dày Bảo Vệ Máy An Toàn', 'Cổng Sạc USB Ngoài Tiện Lợi Khi Di Chuyển', 'Đệm Lưng Thoáng Khí Không Bí Lưng', 'Nhiều Ngăn Sắp Xếp Đồ Khoa Học'], priceRange: [210000, 390000], brand: 'No Brand' },
    { base: 'Miếng Lót Chuột Cỡ Lớn 80x30cm', modifiers: ['Bề Mặt Vải Speed Di Chuột Cực Mượt', 'Đế Cao Su Chống Trượt Bo Viền Chắc Chắn', 'In Họa Tiết Sắc Nét Không Phai Màu', 'Chống Thấm Nước Dễ Dàng Lau Sạch', 'Độ Dày 3mm Êm Ái Cổ Tay'], priceRange: [55000, 115000], brand: 'No Brand' },
    { base: 'Hub Chuyển Đổi Type-C Đa Năng 6 trong 1', modifiers: ['Xuất Màn Hình HDMI 4K Sắc Nét', 'Cổng Sạc Nhanh PD 100W An Toàn', 'Khe Cắm Thẻ Nhớ SD TF Tiện Dụng', '3 Cổng USB 3.0 Tốc Độ Cao 5Gbps', 'Vỏ Nhôm Tản Nhiệt Tốt Hoạt Động Bền Bỉ'], priceRange: [290000, 550000], brand: 'Ugreen' },
    { base: 'USB 3.0 Dung Lượng 32GB/64GB/128GB', modifiers: ['Tốc Độ Đọc Ghi Nhanh Chuẩn 3.0', 'Vỏ Kim Loại Nguyên Khối Chống Nước Chống Rơi', 'Thiết Kế Móc Khóa Nhỏ Gọn Tiện Lợi', 'Tương Thích Mọi Hệ Điều Hành', 'Bảo Hành Chính Hãng 5 Năm'], priceRange: [85000, 220000], brand: 'SanDisk' }
  ],
  'may-anh': [
    { base: 'Chân Máy Ảnh Tripod Điện Thoại', modifiers: ['Hợp Kim Nhôm Cứng Cáp Chiều Cao 1.5m', 'Kèm Remote Chụp Ảnh Bluetooth Tiện Lợi', 'Đầu Xoay 360 Độ Chụp Dọc Ngang Đa Năng', 'Gấp Gọn Kèm Túi Đeo Dễ Dàng Mang Theo', 'Khóa Gạt Chắc Chắn Chịu Tải 3kg'], priceRange: [180000, 350000], brand: 'Benro' },
    { base: 'Túi Đựng Máy Ảnh Chuyên Dụng Chống Sốc', modifiers: ['Vải Canvas Kháng Nước Mưa Nhẹ', 'Vách Ngăn Xốp Tháo Rời Tùy Chỉnh Tiện Lợi', 'Nhiều Ngăn Phụ Đựng Pin Thẻ Nhớ Ống Kính', 'Quai Đeo Bọc Đệm Dày Không Đau Vai', 'Khóa Kéo Kim Loại Êm Ái Bền Bỉ'], priceRange: [260000, 480000], brand: 'K&F Concept' },
    { base: 'Bộ Vệ Sinh Ống Kính Cảm Ứng Máy Ảnh', modifiers: ['Gồm Bóng Thổi Bụi Bút Lau Và Khăn Microfiber', 'Nước Rửa Kính Chuyên Dụng Không Cồn', 'Làm Sạch Bụi Bẩn Dấu Vân Tay Không Xước', 'Hộp Đựng Gọn Gàng Tiện Mang Theo', 'Dùng Được Cho Cả Kính Mắt Ống Nhòm'], priceRange: [75000, 145000], brand: 'No Brand' },
    { base: 'Thẻ Nhớ SD Tốc Độ Cao 64GB/128GB', modifiers: ['Tốc Độ Đọc 100MB/s Chuẩn U3 V30', 'Hỗ Trợ Quay Video 4K Mượt Mà Không Giật', 'Chống Nước Chống Nhiệt Độ Cao Bền Bỉ', 'Tương Thích Máy Ảnh DSLR Mirrorless', 'Bảo Hành Chính Hãng Đổi Mới'], priceRange: [190000, 380000], brand: 'SanDisk' },
    { base: 'Đèn LED Trợ Sáng Mini Gắn Máy Ảnh', modifiers: ['Độ Sáng Cao Điều Chỉnh Được Nhiệt Độ Màu', 'Pin Sạc Tích Hợp Dùng Liên Tục 3 Giờ', 'Kèm Khung Ngàm Hot Shoe Tiện Dụng', 'Ánh Sáng Dịu Mắt Không Bị Lóa', 'Nhỏ Gọn Bỏ Túi Tiện Quay Vlog'], priceRange: [160000, 310000], brand: 'Godox' }
  ],
  'gia-dung': [
    { base: 'Nồi Chiên Không Dầu Điện Tử Dung Tích Lớn', modifiers: ['Công Nghệ Rapid Air Chiên Nướng Giảm 85% Dầu Mỡ', 'Màn Hình Cảm Ứng 8 Chế Độ Nấu Tự Động', 'Lòng Nồi Chống Dính Dễ Dàng Tháo Rửa', 'Công Suất 1800W Nấu Nhanh Chín Đều', 'Cửa Kính Quan Sát Kèm Đèn Tiện Lợi'], priceRange: [850000, 1850000], brand: 'Philips' },
    { base: 'Máy Xay Sinh Tố Cầm Tay Sạc Pin Mini', modifiers: ['Lưỡi Dao Inox 304 6 Cánh Siêu Sắc Bén', 'Cối Nhựa Thủy Tinh An Toàn Cho Trẻ Nhỏ', 'Sạc Cổng Type-C Tiện Lợi Mang Đi Làm Đi Tập', 'Xay Mịn Hoa Quả Đá Bào Trong 30 Giây', 'Tự Động Ngắt Điện An Toàn Khi Tháo Cối'], priceRange: [195000, 350000], brand: 'Bear' },
    { base: 'Ấm Đun Nước Siêu Tốc Inox 304 1.8L', modifiers: ['Cách Nhiệt 2 Lớp Chống Bỏng Tay An Toàn', 'Đun Sôi Cực Nhanh Trong 5 Phút', 'Tự Động Ngắt Khi Nước Sôi Hoặc Cạn Nước', 'Đế Tiếp Điện Xoay 360 Độ Linh Hoạt', 'Ruột Thép Không Gỉ Sáng Bóng Dễ Lau Chùi'], priceRange: [135000, 260000], brand: 'Sunhouse' },
    { base: 'Bàn Là Hơi Nước Cầm Tay Gấp Gọn', modifiers: ['Công Suất 1200W Phun Hơi Nóng Diệt Khuẩn', 'Làm Phẳng Nhanh Quần Áo Treo Tiện Lợi', 'Mặt Bàn Ủi Kim Loại Chống Dính Trượt Mịn', 'Bình Chứa Nước Tháo Rời Dễ Châm Thêm', 'Thiết Kế Nhỏ Gọn Mang Đi Du Lịch'], priceRange: [230000, 450000], brand: 'Lock&Lock' },
    { base: 'Nồi Cơm Điện Cao Tần Đa Năng 1.5L', modifiers: ['Lòng Nồi Niêu Hợp Kim 5 Lớp Giữ Nhiệt Lâu', 'Công Nghệ Nấu IH Cơm Chín Đều Ngọt Dẻo', 'Nhiều Chế Độ Nấu Cháo Hầm Canh Làm Bánh', 'Hẹn Giờ Nấu Thông Minh Tiện Lợi', 'Màn Hình LED Hiển Thị Trực Quan'], priceRange: [650000, 1450000], brand: 'Tefal' }
  ],
  'nha-cua': [
    { base: 'Bình Giữ Nhiệt Lõi Inox 316 1000ml', modifiers: ['Giữ Nóng Lạnh Lên Đến 24 Giờ Liên Tục', 'Nắp Đậy Chống Tràn Có Ống Hút Tiện Lợi', 'Sơn Tĩnh Điện Nhám Chống Trầy Xước', 'Quai Xách Chắc Chắn Tiện Mang Đi Học Đi Làm', 'Chất Liệu Thép Y Tế An Toàn Cho Sức Khỏe'], priceRange: [165000, 320000], brand: 'Lock&Lock' },
    { base: 'Kệ Để Gia Vị Đồ Dùng Bếp 2 Tầng', modifiers: ['Thép Carbon Sơn Tĩnh Điện Chống Gỉ Sét', 'Kèm Ống Đựng Đũa Thìa Giá Để Dao Thớt', 'Chịu Tải Trọng Lên Đến 40kg Rất Vững', 'Chân Đế Hít Cao Su Chống Trượt Bập Bênh', 'Tiết Kiệm Không Gian Bếp Ngăn Nắp Gọn Gàng'], priceRange: [180000, 350000], brand: 'No Brand' },
    { base: 'Bộ Bát Đĩa Sứ Tráng Men Xanh Bắc Âu', modifiers: ['Gồm 12 Món Phong Cách Cổ Điển Sang Trọng', 'Men Bóng Cao Cấp Dùng Được Lò Vi Sóng', 'Chống Bám Dầu Mỡ Dễ Dàng Rửa Sạch', 'Viền Mạ Vàng Tinh Tế Nâng Tầm Bữa Cơm', 'Đóng Gói Chống Sốc An Toàn Làm Quà Tặng'], priceRange: [320000, 680000], brand: 'No Brand' },
    { base: 'Cây Lau Nhà Tự Vắt 360 Độ Thông Minh', modifiers: ['Bông Lau Sợi Microfiber Siêu Thấm Hút Bụi Bẩn', 'Thùng Chứa Nước 2 Ngăn Tách Nước Bẩn Tiện Lợi', 'Đầu Lau Gập Xoay Mọi Ngóc Ngách Gầm Giường', 'Cán Inox Dày Dặn Tùy Chỉnh Chiều Cao', 'Vắt Khô Nhanh Chóng Không Cần Dùng Tay'], priceRange: [195000, 340000], brand: 'Inochi' },
    { base: 'Đèn Ngủ Để Bàn Thân Gỗ Ánh Sáng Ấm', modifiers: ['Chao Đèn Vải Linen Tán Sáng Dịu Mắt', 'Bóng LED Tiết Kiệm Điện Không Nhấp Nháy', 'Công Tắc Điều Chỉnh Độ Sáng Linh Hoạt', 'Thiết Kế Tối Giản Phong Cách Nhật Bản', 'Trang Trí Phòng Ngủ Thêm Ấm Cúng Thư Giãn'], priceRange: [110000, 220000], brand: 'No Brand' }
  ],
  'the-thao': [
    { base: 'Thảm Tập Yoga TPE 2 Lớp Định Tuyến', modifiers: ['Độ Dày 6mm/8mm Êm Ái Bảo Vệ Khớp Khủy', 'Họa Tiết Khắc Laser Chống Trơn Trượt Tuyệt Đối', 'Chất Liệu Thân Thiện Không Mùi Độc Hại', 'Độ Đàn Hồi Cao Không Biến Dạng Sau Khi Tập', 'Tặng Kèm Túi Đựng Dây Buộc Tiện Lợi'], priceRange: [160000, 290000], brand: 'Decathlon' },
    { base: 'Bộ Đồ Tập Gym Nữ Áo Bra Quần Dài', modifiers: ['Vải Dệt Kim Co Giãn 4 Chiều Ôm Dáng', 'Cạp Cao Giấu Mỡ Bụng Nâng Mông Tự Nhiên', 'Thấm Hút Mồ Hôi Siêu Nhanh Khô Thoáng', 'Không Lộ Viền Nội Y Tự Tin Vận Động', 'Màu Sắc Năng Động Phong Cách Thể Thao'], priceRange: [220000, 390000], brand: 'No Brand' },
    { base: 'Bình Nước Thể Thao Nhựa Tritan 1500ml', modifiers: ['Chất Liệu BPA Free Chịu Nhiệt An Toàn', 'Có Vạch Đo Lượng Nước Uống Hàng Ngày', 'Nắp Bật Mở Một Chạm Kèm Khóa An Toàn', 'Quai Cầm Chắc Chắn Tiện Tập Gym Chạy Bộ', 'Kèm Ống Hút Silicon Mềm Mại Tháo Rời'], priceRange: [85000, 160000], brand: 'Lock&Lock' },
    { base: 'Dây Nhảy Thể Lực Đếm Số Tự Động', modifiers: ['Cáp Thép Bọc Nhựa Chống Rối Bền Bỉ', 'Trục Xoay Vòng Bi 360 Độ Siêu Tốc Không Vướng', 'Màn Hình Điện Tử Đếm Số Vòng Tiêu Hao Calo', 'Kèm 2 Bóng Nhảy Không Dây Tập Trong Nhà', 'Tay Cầm Bọc Xốp Chống Trơn Khi Ra Mồ Hôi'], priceRange: [75000, 145000], brand: 'No Brand' },
    { base: 'Băng Quấn Cổ Tay Tập Gym Đôi', modifiers: ['Bản Rộng 8cm Hỗ Trợ Nâng Tạ Nặng Tránh Chấn Thương', 'Dây Co Giãn Khóa Dán Chắc Chắn', 'Chất Liệu Cotton Polyester Thoáng Khí', 'Bền Bỉ Giữ Cổ Tay Ổn Định Khi Đẩy Ngực', 'Thích Hợp Cả Nam Và Nữ Đam Mê Thể Thao'], priceRange: [45000, 95000], brand: 'No Brand' }
  ],
  'me-va-be': [
    { base: 'Bình Sữa Cổ Rộng Kháng Khuẩn PPSU 240ml', modifiers: ['Chất Liệu Nhựa Y Tế Chịu Nhiệt Lên Đến 180 Độ C', 'Núm Ty Silicon Siêu Mềm Mô Phỏng Ti Mẹ', 'Van Chống Đầy Hơi Giảm Nôn Trớ Ở Trẻ Nhỏ', 'Cổ Rộng Dễ Dàng Pha Sữa Và Cọ Rửa Vệ Sinh', 'Vạch Chia Dung Tích In Sắc Nét Rõ Ràng'], priceRange: [180000, 340000], brand: 'Pigeon' },
    { base: 'Máy Hâm Sữa Tiệt Trùng Hơi Nước Đa Năng', modifiers: ['Màn Hình Cảm Ứng Cài Đặt Nhiệt Độ Chuẩn Xác', 'Dung Tích Chứa Cùng Lúc 2 Bình Sữa Lớn', 'Chức Năng Hâm Nước Pha Sữa Giữ Ấm Suốt Đêm', 'Tự Động Tắt Điện Khi Cạn Nước An Toàn', 'Vật Liệu Nhựa Cao Cấp Không Chứa BPA'], priceRange: [290000, 560000], brand: 'Farlin' },
    { base: 'Bộ Khăn Xô Sợi Tre 6 Lớp Siêu Mềm', modifiers: ['Kháng Khuẩn Tự Nhiên Không Gây Dị Ứng Da Bé', 'Thấm Hút Cực Nhanh Dùng Làm Khăn Tắm Khăn Đắp', 'Viền May Chắc Chắn Càng Giặt Càng Mềm', 'Họa Tiết Động Vật Ngộ Nghĩnh Đáng Yêu', 'Kích Thước Rộng 110x110cm Tiện Dụng'], priceRange: [95000, 175000], brand: 'No Brand' },
    { base: 'Yếm Ăn Dặm Silicon Có Máng Hứng', modifiers: ['Silicon Thực Phẩm Chống Thấm Dễ Rửa Sạch', 'Máng Hứng Sâu Đón Đồ Ăn Rơi Vãi Gọn Gàng', 'Nút Gài Nhiều Nấc Tùy Chỉnh Theo Vòng Cổ Bé', 'Cuộn Gọn Dễ Mang Đi Chơi Đi Nhà Hàng', 'Màu Sắc Pastel Kích Thích Thị Giác Trẻ'], priceRange: [45000, 89000], brand: 'No Brand' },
    { base: 'Bộ Đồ Chơi Xếp Hình Gỗ Thông Minh Cho Bé', modifiers: ['Gỗ Tự Nhiên Mài Mịn Góc Cạnh An Toàn', 'Sơn Gốc Nước Không Chì Không Mùi Độc Hại', 'Rèn Luyện Tư Duy Sáng Tạo Và Khéo Léo Của Tay', 'Nhiều Khối Màu Sắc Hình Dạng Khác Nhau', 'Kèm Thùng Đựng Gọn Gàng Tiện Lợi'], priceRange: [110000, 220000], brand: 'No Brand' }
  ],
  'sac-dep': [
    { base: 'Nước Tẩy Trang Làm Sạch Sâu Dịu Nhẹ 400ml', modifiers: ['Công Nghệ Micellar Hút Sạch Bụi Mịn Và Lớp Trang Điểm', 'Không Cồn Không Paraben An Toàn Cho Da Nhạy Cảm', 'Cung Cấp Độ Ẩm Tự Nhiên Không Làm Khô Căng Da', 'Dùng Được Cho Cả Vùng Mắt Và Môi', 'Chiết Xuất Thảo Mộc Tự Nhiên Thanh Lọc Da'], priceRange: [120000, 250000], brand: 'Cocoon' },
    { base: 'Serum Dưỡng Ẩm Phục Hồi Da B5 30ml', modifiers: ['Tổ Hợp Hyaluronic Acid Cấp Ẩm Đa Tầng Căng Bóng', 'Vitamin B5 Làm Dịu Da Kích Ứng Mẩn Đỏ', 'Kết Cấu Mỏng Nhẹ Thấm Nhanh Không Bết Dính', 'Cải Thiện Hàng Rào Bảo Vệ Da Khỏe Mạnh', 'Phù Hợp Mọi Loại Da Kể Cả Da Đang Treatment'], priceRange: [195000, 420000], brand: 'La Roche-Posay' },
    { base: 'Kem Chống Nắng Kiềm Dầu Nâng Tông 50ml', modifiers: ['Chỉ Số Chống Nắng Toàn Diện SPF50+ PA++++', 'Màng Lọc Quang Phổ Rộng Bảo Vệ Khỏi Tia UVA UVB', 'Kiềm Dầu Suốt 8 Giờ Không Gây Bí Tắc Lỗ Chân Lông', 'Nâng Tông Trắng Hồng Tự Nhiên Thay Kem Lót', 'Kháng Nước Chống Mồ Hôi Khi Hoạt Động Ngoài Trời'], priceRange: [160000, 340000], brand: 'Innisfree' },
    { base: 'Son Kem Lì Mịn Môi Lâu Trôi', modifiers: ['Chất Son Mềm Xốp Lướt Nhẹ Trên Môi Che Vân Môi', 'Độ Bám Màu Lên Đến 6 Giờ Ăn Uống Nhẹ Không Trôi', 'Bảng Màu Thời Thượng Tôn Da Phù Hợp Người Châu Á', 'Chứa Dầu Dưỡng Không Gây Khô Môi Bong Tróc', 'Hương Thơm Trái Cây Dịu Nhẹ Dễ Chịu'], priceRange: [99000, 195000], brand: 'L\'Oreal' },
    { base: 'Sữa Rửa Mặt Tạo Bọt Làm Sạch Lỗ Chân Lông', modifiers: ['Độ pH Chuẩn 5.5 Cân Bằng Độ Ẩm Tự Nhiên Cho Da', 'Bọt Mịn Li Ti Len Lỏi Cuốn Trôi Bã Nhờn', 'Chiết Xuất Tràm Trà Kháng Khuẩn Ngừa Mụn Hiệu Quả', 'Không Gây Cảm Giác Khô Căng Sau Khi Rửa', 'Dung Tích Lớn 150ml Dùng Tiết Kiệm Cả Năm'], priceRange: [85000, 180000], brand: 'Simple' }
  ],
  'suc-khoe': [
    { base: 'Máy Đo Huyết Áp Bắp Tay Tự Động', modifiers: ['Màn Hình Lớn Hiển Thị Rõ Ràng Huyết Áp Và Nhịp Tim', 'Công Nghệ Cảm Biến Intellisense Bơm Hơi Êm Ái', 'Bộ Nhớ Lưu Trữ Kết Quả Cho 2 Người Dùng', 'Cảnh Báo Nhịp Tim Bất Thường Và Sai Tư Thế Đo', 'Kèm Bao Đựng Và Bộ Đổi Nguồn Cắm Điện Trực Tiếp'], priceRange: [550000, 1150000], brand: 'Omron' },
    { base: 'Cân Điện Tử Thông Minh Đo Chỉ Số Cơ Thể', modifiers: ['Đo 12 Chỉ Số Cơ Bắp Mỡ Nội Tạng Lượng Nước', 'Kết Nối Bluetooth Với Điện Thoại Theo Dõi Sức Khỏe', 'Kính Cường Lực Chịu Tải 180kg Cảm Ứng Bật Tắt Tự Động', 'Thiết Kế Mỏng Đẹp Hiện Đại Đèn LED Sáng Rõ', 'Pin Sạc Hoặc Dùng Pin AAA Tiện Lợi'], priceRange: [140000, 290000], brand: 'Beurer' },
    { base: 'Nhiệt Kế Điện Tử Đo Trán Hồng Ngoại', modifiers: ['Đo Nhiệt Độ Tức Thì Trong 1 Giây Không Cần Chạm', 'Đèn Màn Hình Đổi Màu Báo Sốt Tiện Dụng Ban Đêm', 'Lưu 32 Lần Đo Trước Để Theo Dõi Thân Nhiệt', 'Đo Được Cả Nhiệt Độ Bình Sữa Nước Tắm Phòng Ngủ', 'Độ Chính Xác Cao Sai Số Chỉ 0.2 Độ C'], priceRange: [160000, 350000], brand: 'Omron' },
    { base: 'Viên Uống Bổ Sung Vitamin C 1000mg', modifiers: ['Tăng Cường Sức Đề Kháng Sáng Da Mờ Thâm', 'Chống Oxy Hóa Bảo Vệ Cơ Thể Khỏi Gốc Tự Do', 'Dạng Viên Nang Mềm Dễ Uống Hấp Thu Nhanh', 'Sản Xuất Theo Tiêu Chuẩn Quốc Tế An Toàn', 'Hộp 60 Viên Dùng Đủ Cho 2 Tháng'], priceRange: [120000, 240000], brand: 'DHC' },
    { base: 'Đai Chống Gù Lưng Điều Chỉnh Tư Thế', modifiers: ['Hỗ Trợ Định Hình Cột Sống Thẳng Tự Nhiên', 'Dây Đai Co Giãn Thoáng Khí Không Bí Mồ Hôi', 'Miếng Dán Chắc Chắn Tùy Chỉnh Kích Thước Vừa Vặn', 'Phù Hợp Cả Người Lớn Dân Văn Phòng Và Học Sinh', 'Mặc Lót Bên Trong Áo Không Bị Lộ'], priceRange: [85000, 175000], brand: 'No Brand' }
  ],
  'sach-vpp': [
    { base: 'Sách Đắc Nhân Tâm (Khổ Tiêu Chuẩn)', modifiers: ['Tác Phẩm Kinh Điển Về Nghệ Thuật Thu Phục Lòng Người', 'Bản Dịch Chuẩn Sát Nghĩa Đọc Rất Thấm Thía', 'Bìa Cứng Ép Kim Sang Trọng Giấy Bãi Bằng Chống Lóa', 'Bài Học Giá Trị Về Giao Tiếp Và Ứng Xử Đời Thường', 'Cuốn Sách Gối Đầu Giường Của Mọi Thế Hệ'], priceRange: [75000, 140000], brand: 'First News' },
    { base: 'Sách Tâm Lý Học Về Tiền', modifiers: ['Những Bài Học Bất Biến Về Sự Thịnh Vượng Và Hạnh Phúc', 'Góc Nhìn Sâu Sắc Về Cách Con Người Tư Duy Về Tiền', 'Lối Viết Lôi Cuốn Dễ Hiểu Với Nhiều Dẫn Chứng Thực Tế', 'Giúp Quản Lý Tài Chính Cá Nhân Khôn Ngoan Hơn', 'Bìa Đẹp Giấy In Cao Cấp Thích Hợp Làm Quà'], priceRange: [95000, 165000], brand: 'NXB Trẻ' },
    { base: 'Sổ Tay Bìa Da A5 Kẻ Ngang 200 Trang', modifiers: ['Giấy Dày 100gsm Chống Thấm Mực Mọi Loại Bút', 'Bìa Da PU Cao Cấp Mềm Mịn Chống Bám Bẩn', 'Đường Kẻ Rõ Ràng Kèm Dây Đánh Dấu Trang Tiện Lợi', 'Gáy Khâu Chỉ Chắc Chắn Mở Phẳng 180 Độ Dễ Viết', 'Màu Sắc Lịch Sự Thích Hợp Ghi Chép Công Việc Học Tập'], priceRange: [55000, 120000], brand: 'No Brand' },
    { base: 'Bộ 10 Bút Gel Mực Đen 0.5mm Nét Mượt', modifiers: ['Mực Xuống Đều Nhanh Khô Không Nhòe Vở', 'Đầu Bi Thép Không Gỉ Siêu Bền Viết Êm Tay', 'Đệm Tay Silicon Cầm Lâu Không Đau Mỏi Ngón', 'Thiết Kế Cài Bút Tiện Lợi Kẹp Vào Sổ Vở', 'Dung Lượng Mực Lớn Viết Được Hàng Ngàn Mét'], priceRange: [39000, 79000], brand: 'Deli' },
    { base: 'Hộp Đựng Bút Đa Năng Để Bàn Nhiều Ngăn', modifiers: ['Chất Liệu Nhựa Cứng Dày Dặn Bền Đẹp', 'Thiết Kế Ngăn Kéo Trong Suốt Tiện Lợi Chứa Đồ Nhỏ', 'Sắp Xếp Bút Kéo Băng Dính Thước Kẻ Ngăn Nắp', 'Màu Trắng Pastel Nhã Nhặn Tối Giản', 'Tạo Cảm Hứng Làm Việc Học Tập Hiệu Quả'], priceRange: [65000, 135000], brand: 'Thiên Long' }
  ]
};

// Từ ghép tạo tên Shop ngẫu nhiên và tự nhiên
const SHOP_PREFIXES = ['Cửa Hàng', 'Gian Hàng', 'Shop', 'Store', 'Boutique', 'Thế Giới', 'Kho Sỉ', 'Tổng Kho', 'Gia Dụng', 'Siêu Thị'];
const SHOP_SUFFIXES = ['Official', 'VN', 'Premium', 'Authentic', 'Sài Gòn', 'Hà Nội', 'Đà Nẵng', 'Xinh', 'Chính Hãng', 'Pro', 'Plus', 'Mall', 'Select'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('=== BẮT ĐẦU QUY TRÌNH MASS SEED: 1.000 SHOP & 10.000 SẢN PHẨM ===');
  const startTime = Date.now();

  const client = await pool.connect();

  try {
    // 1. Lấy danh sách 18 Category từ DB
    console.log('[*] Đang đọc danh sách Category từ DB...');
    const catRes = await client.query('SELECT id, name, slug FROM product."Category" ORDER BY slug');
    const categories = catRes.rows;
    console.log(`[+] Tìm thấy ${categories.length} ngành hàng trong DB.`);

    if (categories.length === 0) {
      throw new Error('Chưa có Category nào trong bảng product."Category"!');
    }

    // 2. Chuẩn bị password hash chung để tránh chạy bcrypt 1000 lần gây chậm
    const passwordHash = '$2b$10$wE99w/6pM0M2yD8z/5e8zeB5b0iA7rF3z2lHq5U.QcR6fQx.m9W2e'; // hash của '123456'

    const TOTAL_SHOPS = 1000;
    const PRODUCTS_PER_SHOP = 10;

    console.log(`[*] Chuẩn bị khởi tạo dữ liệu cho ${TOTAL_SHOPS} Shop và ${TOTAL_SHOPS * PRODUCTS_PER_SHOP} Sản phẩm...`);

    const usersData = [];
    const shopsData = [];
    const productsData = [];

    // Phân bổ 1.000 shop đều cho 18 ngành hàng
    for (let i = 0; i < TOTAL_SHOPS; i++) {
      const shopIdx = i + 1;
      const cat = categories[i % categories.length];
      const categorySlug = cat.slug;
      const categoryName = cat.name;
      const categoryId = cat.id;

      const userId = crypto.randomUUID();
      const shopId = crypto.randomUUID();

      const merchantNum = String(shopIdx).padStart(4, '0');
      const email = `merchant_${merchantNum}@zeromall.vn`;
      const ownerName = `Chủ Shop ${categoryName} #${shopIdx}`;

      // Tên shop tự nhiên: [Prefix] [Ngành/Từ Khóa] [Suffix]
      const prefix = getRandomElement(SHOP_PREFIXES);
      const suffix = getRandomElement(SHOP_SUFFIXES);
      const shopName = `${prefix} ${categoryName} ${suffix} #${shopIdx}`;
      const shopLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(shopName)}&background=random&color=fff&size=128&bold=true`;

      // Ngày tạo shop: rải rác tự nhiên từ 30 ngày đến 365 ngày trước
      const daysAgo = getRandomInt(10, 300);
      const shopCreatedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      usersData.push({
        id: userId,
        email,
        password: passwordHash,
        name: ownerName,
        role: 'SHOP_OWNER',
        status: 'ACTIVE',
        shopId: null, // Sẽ update sau khi tạo Shop để tránh lỗi khóa ngoại tròn
        targetShopId: shopId,
        createdAt: shopCreatedAt
      });

      shopsData.push({
        id: shopId,
        name: shopName,
        logo: shopLogo,
        description: `Gian hàng chính hãng chuyên cung cấp các sản phẩm ${categoryName} chất lượng cao, giá tốt tại ZeroMall.`,
        ownerId: userId,
        responseRate: getRandomInt(92, 100),
        responseTime: 'trong vài giờ',
        status: 'APPROVED',
        createdAt: shopCreatedAt
      });

      // Tạo 10 sản phẩm cho shop này
      const templates = CATEGORY_PRODUCTS_TEMPLATES[categorySlug] || CATEGORY_PRODUCTS_TEMPLATES['thoi-trang-nam'];
      const imgPool = CATEGORY_IMAGES[categorySlug] || CATEGORY_IMAGES['thoi-trang-nam'];

      for (let pIdx = 0; pIdx < PRODUCTS_PER_SHOP; pIdx++) {
        const prodId = crypto.randomUUID();
        const tpl = templates[pIdx % templates.length];

        const modifier = getRandomElement(tpl.modifiers);
        const prodName = `${tpl.base} ${modifier} (Mã ZM-${shopIdx}-${pIdx + 1})`;

        const basePrice = getRandomInt(tpl.priceRange[0], tpl.priceRange[1]);
        // Làm tròn giá về hàng nghìn
        const price = Math.round(basePrice / 1000) * 1000;
        // Giá gốc cao hơn 25-40% để thể hiện giảm giá thực tế
        const discountRate = getRandomInt(20, 35);
        const originalPrice = Math.round((price * (1 + discountRate / 100)) / 1000) * 1000;

        const mainImgBase = imgPool[(pIdx + shopIdx) % imgPool.length];
        const mainImg = `${mainImgBase}?w=500&q=80&auto=format`;
        
        // Thêm 2-3 ảnh phụ
        const subImg1 = `${imgPool[(pIdx + shopIdx + 1) % imgPool.length]}?w=500&q=80&auto=format`;
        const subImg2 = `${imgPool[(pIdx + shopIdx + 2) % imgPool.length]}?w=500&q=80&auto=format`;
        const imagesJson = JSON.stringify([mainImg, subImg1, subImg2]);

        const stock = getRandomInt(30, 250);
        // Sản phẩm mới: sales = 0 tuyệt đối theo yêu cầu của bạn!
        const sales = 0;

        // Ngày đăng sản phẩm: rải rác từ sau ngày tạo shop đến hiện tại
        const prodDaysAgo = getRandomInt(1, Math.max(2, daysAgo - 5));
        const prodCreatedAt = new Date(Date.now() - prodDaysAgo * 24 * 60 * 60 * 1000);

        const sku = `ZM-${categorySlug.toUpperCase().substring(0, 3)}-${shopIdx}-${pIdx + 1}`;

        productsData.push({
          id: prodId,
          shopId: shopId,
          name: prodName,
          image: mainImg,
          images: imagesJson,
          category: categoryName,
          categoryId: categoryId,
          brand: tpl.brand || 'No Brand',
          description: `${prodName}. Sản phẩm cam kết chính hãng, chất lượng cao, bảo hành đổi trả trong 7 ngày nếu có lỗi từ nhà sản xuất. Thích hợp sử dụng hàng ngày hoặc làm quà tặng ý nghĩa.`,
          price: price,
          originalPrice: originalPrice,
          stock: stock,
          sales: sales,
          status: 'active',
          sku: sku,
          weight: String(getRandomInt(150, 800)),
          condition: 'new',
          hasVariations: false,
          variationGroups: '[]',
          variationRows: '[]',
          isPreOrder: false,
          createdAt: prodCreatedAt
        });
      }
    }

    console.log(`[+] Chuẩn bị xong bộ nhớ: ${usersData.length} Users, ${shopsData.length} Shops, ${productsData.length} Products.`);

    // 3. Thực hiện BATCH INSERT vào PostgreSQL
    // Tắt kiểm tra khóa ngoại tạm thời hoặc chèn theo thứ tự: User -> Shop -> Product
    const BATCH_SIZE = 500;

    // A. Chèn Users
    console.log('[*] Đang chèn 1.000 Users vào auth."User"...');
    for (let i = 0; i < usersData.length; i += BATCH_SIZE) {
      const batch = usersData.slice(i, i + BATCH_SIZE);
      const values = [];
      const placeholders = [];
      let paramIdx = 1;

      batch.forEach((u) => {
        placeholders.push(`($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5}, $${paramIdx+6}, $${paramIdx+7}, NOW())`);
        values.push(u.id, u.email, u.password, u.name, u.role, u.status, u.shopId, u.createdAt);
        paramIdx += 8;
      });

      const query = `
        INSERT INTO auth."User" (id, email, password, name, role, status, "shopId", "createdAt", "updatedAt")
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (email) DO NOTHING;
      `;
      await client.query(query, values);
    }
    console.log('[+] Đã chèn thành công 1.000 Users!');

    // B. Chèn Shops
    console.log('[*] Đang chèn 1.000 Shops vào auth."Shop"...');
    for (let i = 0; i < shopsData.length; i += BATCH_SIZE) {
      const batch = shopsData.slice(i, i + BATCH_SIZE);
      const values = [];
      const placeholders = [];
      let paramIdx = 1;

      batch.forEach((s) => {
        placeholders.push(`($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5}, $${paramIdx+6}, $${paramIdx+7}, $${paramIdx+8}, NOW())`);
        values.push(s.id, s.name, s.logo, s.description, s.ownerId, s.responseRate, s.responseTime, s.status, s.createdAt);
        paramIdx += 9;
      });

      const query = `
        INSERT INTO auth."Shop" (id, name, logo, description, "ownerId", "responseRate", "responseTime", status, "createdAt", "updatedAt")
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO NOTHING;
      `;
      await client.query(query, values);
    }
    console.log('[+] Đã chèn thành công 1.000 Shops!');

    // B2. Cập nhật shopId cho Users
    console.log('[*] Đang liên kết shopId cho 1.000 Users...');
    for (let i = 0; i < usersData.length; i += BATCH_SIZE) {
      const batch = usersData.slice(i, i + BATCH_SIZE);
      for (const u of batch) {
        await client.query('UPDATE auth."User" SET "shopId" = $1 WHERE id = $2', [u.targetShopId, u.id]);
      }
    }
    console.log('[+] Đã liên kết shopId cho Users thành công!');

    // C. Chèn Products
    console.log('[*] Đang chèn 10.000 Products vào product."Product"...');
    for (let i = 0; i < productsData.length; i += BATCH_SIZE) {
      const batch = productsData.slice(i, i + BATCH_SIZE);
      const values = [];
      const placeholders = [];
      let paramIdx = 1;

      batch.forEach((p) => {
        placeholders.push(`($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5}, $${paramIdx+6}, $${paramIdx+7}, $${paramIdx+8}, $${paramIdx+9}, $${paramIdx+10}, $${paramIdx+11}, $${paramIdx+12}, $${paramIdx+13}, $${paramIdx+14}, $${paramIdx+15}, $${paramIdx+16}, $${paramIdx+17}, $${paramIdx+18}, $${paramIdx+19}, NOW())`);
        values.push(
          p.id, p.shopId, p.name, p.image, p.images, p.category, p.categoryId, p.brand, p.description,
          p.price, p.originalPrice, p.stock, p.sales, p.status, p.sku, p.weight, p.condition,
          p.hasVariations, p.variationGroups, p.createdAt
        );
        paramIdx += 20;
      });

      const query = `
        INSERT INTO product."Product" (
          id, "shopId", name, image, images, category, "categoryId", brand, description,
          price, "originalPrice", stock, sales, status, sku, weight, condition,
          "hasVariations", "variationGroups", "createdAt", "updatedAt"
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO NOTHING;
      `;
      await client.query(query, values);
      process.stdout.write(`... Đã chèn ${Math.min(i + BATCH_SIZE, productsData.length)} / ${productsData.length} sản phẩm\r`);
    }
    console.log('\n[+] Đã chèn thành công 10.000 Products!');

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 HOÀN THÀNH TẤT CẢ TRONG ${elapsed} GIÂY!`);

    // 4. Kiểm tra tổng số lượng trong DB hiện tại
    const finalUsers = await client.query('SELECT COUNT(*) FROM auth."User" WHERE role = \'SHOP_OWNER\'');
    const finalShops = await client.query('SELECT COUNT(*) FROM auth."Shop"');
    const finalProds = await client.query('SELECT COUNT(*) FROM product."Product"');

    console.log('=== THỐNG KÊ CSDL ZEROMALL SAU KHI SEED ===');
    console.log(`- Tổng Chủ Shop (SHOP_OWNER): ${finalUsers.rows[0].count}`);
    console.log(`- Tổng Gian Hàng (Shop): ${finalShops.rows[0].count}`);
    console.log(`- Tổng Sản Phẩm (Product): ${finalProds.rows[0].count}`);
    console.log('============================================');

  } catch (err) {
    console.error('❌ Lỗi trong quá trình seed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
