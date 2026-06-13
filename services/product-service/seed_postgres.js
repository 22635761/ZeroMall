const { PrismaClient: AuthClient } = require('../auth-service/src/generated/client');
const { PrismaClient: ProductClient } = require('./src/generated/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const authPool = new Pool({ 
  connectionString: 'postgresql://postgres:postgres@localhost:5432/zeromall?schema=auth&options=-csearch_path=auth'
});
const authAdapter = new PrismaPg(authPool, { schema: 'auth' });
const auth = new AuthClient({ adapter: authAdapter });

const productPool = new Pool({ 
  connectionString: 'postgresql://postgres:postgres@localhost:5432/zeromall?schema=product&options=-csearch_path=product'
});
const productAdapter = new PrismaPg(productPool, { schema: 'product' });
const product = new ProductClient({ adapter: productAdapter });

async function main() {
  console.log('Cleaning up existing database records...');
  
  // Clean up auth service tables
  await auth.shopFollow.deleteMany({});
  await auth.shop.deleteMany({});
  await auth.user.deleteMany({});
  
  // Clean up product service tables
  await product.productLike.deleteMany({});
  await product.review.deleteMany({});
  await product.product.deleteMany({});
  
  console.log('Starting seeding database...');
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);
  
  const emails = ['seller1@zeromall.com', 'seller2@zeromall.com'];
  
  // Account 1
  let user1 = await auth.user.findUnique({ where: { email: emails[0] } });
  let shop1;
  if (!user1) {
    user1 = await auth.user.create({
      data: {
        email: emails[0],
        password: passwordHash,
        name: 'Chủ Shop Thời Trang',
        role: 'SHOP_OWNER'
      }
    });
    shop1 = await auth.shop.create({
      data: {
        name: 'ZeroMall Fashion Hub',
        ownerId: user1.id,
        responseRate: 98,
        responseTime: 'trong vài giờ',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 3), // 3 năm trước
      }
    });
    user1 = await auth.user.update({
      where: { id: user1.id },
      data: { shopId: shop1.id }
    });
    console.log(`Created user ${emails[0]} with Shop ID ${shop1.id}`);
  } else {
    shop1 = await auth.shop.findUnique({ where: { ownerId: user1.id } });
    if (shop1) {
      shop1 = await auth.shop.update({
        where: { id: shop1.id },
        data: {
          responseRate: 98,
          responseTime: 'trong vài giờ',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 3), // 3 năm trước
        }
      });
    }
    console.log(`User ${emails[0]} already exists with Shop ID ${shop1?.id}`);
  }
  
  // Account 2
  let user2 = await auth.user.findUnique({ where: { email: emails[1] } });
  let shop2;
  if (!user2) {
    user2 = await auth.user.create({
      data: {
        email: emails[1],
        password: passwordHash,
        name: 'Chủ Shop Đồ Gia Dụng',
        role: 'SHOP_OWNER'
      }
    });
    shop2 = await auth.shop.create({
      data: {
        name: 'ZeroMall Home & Kitchen',
        ownerId: user2.id,
        responseRate: 95,
        responseTime: 'trong vài phút',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180), // 6 tháng trước (180 ngày)
      }
    });
    user2 = await auth.user.update({
      where: { id: user2.id },
      data: { shopId: shop2.id }
    });
    console.log(`Created user ${emails[1]} with Shop ID ${shop2.id}`);
  } else {
    shop2 = await auth.shop.findUnique({ where: { ownerId: user2.id } });
    if (shop2) {
      shop2 = await auth.shop.update({
        where: { id: shop2.id },
        data: {
          responseRate: 95,
          responseTime: 'trong vài phút',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180), // 6 tháng trước (180 ngày)
        }
      });
    }
    console.log(`User ${emails[1]} already exists with Shop ID ${shop2?.id}`);
  }

  // Buyers for product reviews (Ensure they exist in User table)
  const buyerEmails = [
    { email: 'buyer.nh@zeromall.com', name: 'n*****h' },
    { email: 'buyer.t0@zeromall.com', name: 't*****0' },
    { email: 'buyer.ma@zeromall.com', name: 'm*****a' }
  ];

  for (const b of buyerEmails) {
    const exists = await auth.user.findUnique({ where: { email: b.email } });
    if (!exists) {
      await auth.user.create({
        data: {
          email: b.email,
          password: passwordHash,
          name: b.name,
          role: 'BUYER'
        }
      });
      console.log(`Created buyer user: ${b.email} (${b.name})`);
    } else {
      console.log(`Buyer user already exists: ${b.email}`);
    }
  }
  
  // Products for Shop 1
  const productsShop1 = [
    {
      shopId: shop1.id,
      name: 'Áo Khoác Bomber Unisex Cực Ngầu Nỉ Ngoại Dày Dặn',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
      category: 'Thời Trang Nam',
      brand: 'No Brand',
      description: 'Áo khoác bomber phong cách đường phố năng động, chất liệu nỉ ngoại cao cấp dày dặn ấm áp, thích hợp đi chơi hay đi học.',
      price: '250000',
      stock: 100,
      sales: 32,
      status: 'active',
      sku: 'BMB-BLK-01',
      hasVariations: false,
      variationGroups: JSON.stringify([]),
      variationRows: JSON.stringify([]),
      weight: '500',
      condition: 'new',
      isPreOrder: false,
      preOrderDays: '7'
    },
    {
      shopId: shop1.id,
      name: 'Váy Tay Bồng Dáng Xòe Công Chúa Cực Xinh',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80',
      category: 'Thời Trang Nữ',
      brand: 'No Brand',
      description: 'Váy xòe phong cách tiểu thư cổ điển điệu đà, tay bồng thanh lịch, chất vải voan hàn cao cấp mềm mại hai lớp cực chuẩn phom dáng.',
      price: '320000',
      stock: 45,
      sales: 18,
      status: 'active',
      sku: 'DRS-PNK-02',
      hasVariations: false,
      variationGroups: JSON.stringify([]),
      variationRows: JSON.stringify([]),
      weight: '300',
      condition: 'new',
      isPreOrder: false,
      preOrderDays: '7'
    },
    {
      shopId: shop1.id,
      name: 'Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      category: 'Giày Dép Nam/Nữ',
      brand: 'Adidas',
      description: 'Giày sneaker thể thao phong cách Hàn Quốc trẻ trung năng động, đế cao su chống trơn trượt êm chân, phù hợp đi học, đi làm, dạo phố.',
      price: '450000',
      stock: 60,
      sales: 54,
      status: 'active',
      sku: 'SNK-WHT-03',
      hasVariations: false,
      variationGroups: JSON.stringify([]),
      variationRows: JSON.stringify([]),
      weight: '700',
      condition: 'new',
      isPreOrder: false,
      preOrderDays: '7'
    },
    {
      shopId: shop1.id,
      name: 'Nón Lưỡi Trai Kaki Trơn Phong Cách Hàn Quốc',
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80',
      category: 'Phụ Kiện Thời Trang',
      brand: 'No Brand',
      description: 'Mũ lưỡi trai kaki basic unisex nam nữ đội đều đẹp, phom dáng cứng cáp ôm đầu thoải mái, điều chỉnh size dễ dàng.',
      price: '75000',
      stock: 150,
      sales: 110,
      status: 'active',
      sku: 'CAP-BLK-04',
      hasVariations: false,
      variationGroups: JSON.stringify([]),
      variationRows: JSON.stringify([]),
      weight: '100',
      condition: 'new',
      isPreOrder: false,
      preOrderDays: '7'
    },
    {
      shopId: shop1.id,
      name: 'Balo Thời Trang Học Sinh Sinh Viên Chống Nước',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80',
      category: 'Túi Ví & Balo',
      brand: 'No Brand',
      description: 'Balo thời trang đựng vừa laptop 15.6 inch, chất vải oxford chống thấm nước tốt, nhiều ngăn tiện lợi đi học hay du lịch ngắn ngày.',
      price: '199000',
      stock: 80,
      sales: 42,
      status: 'active',
      sku: 'BP-GRY-05',
      hasVariations: false,
      variationGroups: JSON.stringify([]),
      variationRows: JSON.stringify([]),
      weight: '600',
      condition: 'new',
      isPreOrder: false,
      preOrderDays: '7'
    }
  ];
  
  // Products for Shop 2
  const productsShop2 = [
    {
      shopId: shop2.id,
      name: 'Nồi Chiên Không Dầu Điện Tử 6.5L Đa Năng Tiện Lợi',
      image: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=400&q=80',
      category: 'Thiết Bị Điện Gia Dụng',
      brand: 'Philips',
      description: 'Nồi chiên không dầu dung tích lớn 6.5L, điều khiển điện tử cảm ứng nhạy bén, công nghệ chiên xoáy nhiệt 360 độ hạn chế dầu mỡ bảo vệ sức khỏe.',
      price: '1850000',
      stock: 20,
      sales: 12,
      status: 'active',
      sku: 'AF-PLP-01',
      hasVariations: false,
      variationGroups: JSON.stringify([]),
      variationRows: JSON.stringify([]),
      weight: '5500',
      condition: 'new',
      isPreOrder: false,
      preOrderDays: '7'
    },
    {
      shopId: shop2.id,
      name: 'Máy Xay Sinh Tố Cầm Tay Sạc Pin Mini Không Dây',
      image: 'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=400&q=80',
      category: 'Thiết Bị Điện Gia Dụng',
      brand: 'Bear',
      description: 'Máy xay sinh tố đa năng sạc pin tiện lợi mang đi làm, đi du lịch. Lưỡi dao inox 304 sắc bén, chất liệu nhựa cao cấp an toàn cho bé.',
      price: '290000',
      stock: 40,
      sales: 25,
      status: 'active',
      sku: 'BL-BEAR-02',
      hasVariations: false,
      variationGroups: JSON.stringify([]),
      variationRows: JSON.stringify([]),
      weight: '800',
      condition: 'new',
      isPreOrder: false,
      preOrderDays: '7'
    },
    {
      shopId: shop2.id,
      name: 'Bộ Bát Đĩa Sứ Tráng Men Xanh Cổ Điển Sang Trọng',
      image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&q=80',
      category: 'Nhà Cửa & Đời Sống',
      brand: 'No Brand',
      description: 'Bộ bát đĩa sứ cao cấp gồm 12 chi tiết tráng men bóng cao cấp, phong cách Bắc Âu sang trọng, chịu nhiệt tốt dùng được trong lò vi sóng.',
      price: '580000',
      stock: 15,
      sales: 4,
      status: 'active',
      sku: 'CER-BLU-03',
      hasVariations: false,
      variationGroups: JSON.stringify([]),
      variationRows: JSON.stringify([]),
      weight: '4000',
      condition: 'new',
      isPreOrder: false,
      preOrderDays: '7'
    },
    {
      shopId: shop2.id,
      name: 'Bình Giữ Nhiệt Lõi Inox 316 Cao Cấp 1000ml',
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80',
      category: 'Nhà Cửa & Đời Sống',
      brand: 'Lock&Lock',
      description: 'Bình giữ nhiệt dung tích lớn giữ nóng/lạnh lên đến 24 giờ, chất liệu thép không gỉ 316 y tế siêu an toàn, có quai xách tiện lợi.',
      price: '350000',
      stock: 70,
      sales: 38,
      status: 'active',
      sku: 'THM-LOCK-04',
      hasVariations: false,
      variationGroups: JSON.stringify([]),
      variationRows: JSON.stringify([]),
      weight: '600',
      condition: 'new',
      isPreOrder: false,
      preOrderDays: '7'
    },
    {
      shopId: shop2.id,
      name: 'Kệ Đồ Nhà Bếp Thông Minh Sơn Tĩnh Điện 3 Tầng',
      image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=400&q=80',
      category: 'Nhà Cửa & Đời Sống',
      brand: 'No Brand',
      description: 'Kệ để gia vị, lò vi sóng bằng thép carbon sơn tĩnh điện chống gỉ sét, chịu lực lên đến 50kg, giúp căn bếp luôn ngăn nắp gọn gàng.',
      price: '420000',
      stock: 30,
      sales: 9,
      status: 'active',
      sku: 'SHF-KIT-05',
      hasVariations: false,
      variationGroups: JSON.stringify([]),
      variationRows: JSON.stringify([]),
      weight: '3500',
      condition: 'new',
      isPreOrder: false,
      preOrderDays: '7'
    }
  ];
  
  // Insert products
  for (const p of productsShop1) {
    const exists = await product.product.findFirst({ where: { shopId: p.shopId, name: p.name } });
    if (!exists) {
      await product.product.create({ data: p });
      console.log(`Created product for Shop 1: ${p.name}`);
    }
  }
  
  for (const p of productsShop2) {
    const exists = await product.product.findFirst({ where: { shopId: p.shopId, name: p.name } });
    if (!exists) {
      await product.product.create({ data: p });
      console.log(`Created product for Shop 2: ${p.name}`);
    }
  }

  // Insert sample reviews linked to the generated product IDs
  const allProducts = await product.product.findMany();
  console.log('Inserting sample reviews...');
  for (const prod of allProducts) {
    const reviewsExist = await product.review.findFirst({ where: { productId: prod.id } });
    if (!reviewsExist) {
      await product.review.createMany({
        data: [
          {
            productId: prod.id,
            username: 'n*****h',
            rating: 5,
            comment: `Sản phẩm ${prod.name} xài cực kỳ tốt nha mọi người, shop giao hàng rất nhanh và đóng gói cẩn thận. Mình đã test thử và rất hài lòng!`,
            variant: 'Mặc định',
            createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
          },
          {
            productId: prod.id,
            username: 't*****0',
            rating: 5,
            comment: `Mua đúng đợt sale được giá hời quá trời. Sản phẩm chất lượng cao, đúng mô tả, nhân viên hỗ trợ nhiệt tình. Sẽ ủng hộ lần sau!`,
            variant: 'Mặc định',
            createdAt: new Date(Date.now() - 3600000 * 24), // 1 day ago
          },
          {
            productId: prod.id,
            username: 'm*****a',
            rating: 4,
            comment: `Hàng đẹp, chất lượng ổn áp. Giao hàng hơi lâu chút xíu nhưng bù lại đóng gói cẩn thận, sản phẩm nguyên vẹn, dùng rất tốt.`,
            variant: 'Mặc định',
            createdAt: new Date(Date.now() - 3600000 * 48), // 2 days ago
          }
        ]
      });
      console.log(`Seeded reviews for product: ${prod.name}`);
    }
  }
  
  // Seed shop follows
  console.log('Inserting sample shop follows...');
  const nhUser = await auth.user.findUnique({ where: { email: 'buyer.nh@zeromall.com' } });
  const t0User = await auth.user.findUnique({ where: { email: 'buyer.t0@zeromall.com' } });
  const maUser = await auth.user.findUnique({ where: { email: 'buyer.ma@zeromall.com' } });

  if (nhUser && t0User && maUser) {
    const follows = [
      { userId: nhUser.id, shopId: shop1.id },
      { userId: t0User.id, shopId: shop1.id },
      { userId: maUser.id, shopId: shop1.id },
      { userId: nhUser.id, shopId: shop2.id }
    ];
    for (const f of follows) {
      const exists = await auth.shopFollow.findUnique({
        where: { userId_shopId: { userId: f.userId, shopId: f.shopId } }
      });
      if (!exists) {
        await auth.shopFollow.create({ data: f });
      }
    }
    console.log('Seeded shop follows successfully.');

    // Seed product likes
    console.log('Inserting sample product likes...');
    for (const prod of allProducts) {
      const likesExist = await product.productLike.findFirst({ where: { productId: prod.id } });
      if (!likesExist) {
        await product.productLike.createMany({
          data: [
            { productId: prod.id, userId: nhUser.id },
            { productId: prod.id, userId: t0User.id }
          ]
        });
        console.log(`Seeded likes for product: ${prod.name}`);
      }
    }
  }

  console.log('Seeding completed successfully!');
  await auth.$disconnect();
  await product.$disconnect();
  
  authPool.end();
  productPool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
