const fs = require('fs');
const path = require('path');

async function downloadAndOptimize() {
  console.log('Đang tải dữ liệu từ provinces.open-api.vn...');
  try {
    const response = await fetch('https://provinces.open-api.vn/api/?depth=3');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Tải dữ liệu thành công. Đang tối ưu hóa cấu trúc...');

    // Tối ưu hóa: chỉ giữ lại name, code, districts và wards
    const optimizedData = data.map(province => ({
      name: province.name,
      code: province.code,
      districts: province.districts.map(district => ({
        name: district.name,
        code: district.code,
        wards: district.wards.map(ward => ({
          name: ward.name,
          code: ward.code
        }))
      }))
    }));

    const outputPath = path.join(__dirname, 'vietnam-provinces.json');
    fs.writeFileSync(outputPath, JSON.stringify(optimizedData, null, 2), 'utf-8');
    
    const sizeInMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
    console.log(`Đã tối ưu hóa và lưu thành công vào: ${outputPath}`);
    console.log(`Kích thước file: ${sizeInMB} MB`);
  } catch (error) {
    console.error('Lỗi khi tải hoặc xử lý dữ liệu:', error);
  }
}

downloadAndOptimize();
