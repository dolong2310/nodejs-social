import { MongoClient } from 'mongodb';

async function main() {
  const client = new MongoClient(
    'mongodb+srv://longdo_user:f0x4lfmYKpDm0kdM@nodejs-social.vy5jesg.mongodb.net/?appName=Nodejs-Social'
  );
  await client.connect();
  const db = client.db('test');
  const users = db.collection('users');

  // for (let i = 0; i < 10000; i++) {
  //   await users.insertOne({
  //     name: `user-${i}`,
  //     age: Math.floor(Math.random() * 100) + 1,
  //     gender: Math.random() > 0.5 ? 'male' : 'female'
  //   });
  // }

  // thêm trường address [Hồ Chí Minh, Hà Nội, Đà Nẵng,...] và random 1 trong số đó cho từng document
  const addresses = [
    'Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Hải Phòng',
    'Cần Thơ',
    'Đà Lạt',
    'Nha Trang',
    'Phú Quốc',
    'Huế',
    'Thái Nguyên',
    'Bắc Ninh',
    'Hải Dương',
    'Quảng Ninh',
    'Buôn Ma Thuột',
    'Vũng Tàu',
    'Quy Nhơn',
    'Thanh Hóa',
    'Nam Định',
    'Ninh Bình',
    'Lào Cai',
    'Lạng Sơn',
    'Vinh',
    'Hà Tĩnh',
    'Nghệ An',
    'Phan Thiết',
    'Tây Ninh',
    'Sóc Trăng',
    'Bạc Liêu',
    'Bến Tre',
    'Long An',
    'Tiền Giang',
    'Trà Vinh',
    'Vĩnh Long',
    'Cà Mau',
    'Đồng Tháp',
    'An Giang',
    'Hậu Giang',
    'Kiên Giang',
    'Kon Tum',
    'Gia Lai',
    'Bình Dương',
    'Bình Phước',
    'Bình Thuận',
    'Tuyên Quang',
    'Yên Bái',
    'Sơn La',
    'Hòa Bình',
    'Phú Thọ',
    'Bắc Giang',
    'Bắc Kạn'
  ];

  await Promise.all(
    Array.from({ length: 10000 }).map((_, index) => {
      return users.insertOne({
        name: `user-${index}`,
        age: Math.floor(Math.random() * 100) + 1,
        gender: Math.random() > 0.5 ? 'male' : 'female',
        address: addresses[Math.floor(Math.random() * addresses.length)]
      });
    })
  );

  await client.close();
  process.exit(0);
}

main();
