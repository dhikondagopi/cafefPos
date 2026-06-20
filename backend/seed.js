const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Floor = require('./models/Floor');
const Table = require('./models/Table');
const Coupon = require('./models/Coupon');
const PaymentMethod = require('./models/PaymentMethod');
const POSSession = require('./models/POSSession');
const Order = require('./models/Order');
const Payment = require('./models/Payment');
const Booking = require('./models/Booking');

dotenv.config();

const mongoURI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/cafeflow_pos';

const seedDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Floor.deleteMany({});
    await Table.deleteMany({});
    await Coupon.deleteMany({});
    await PaymentMethod.deleteMany({});
    await POSSession.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Booking.deleteMany({});

    console.log('Collections cleared.');

    // 1. Create Default Users
    console.log('Seeding Users...');
    const users = await User.create([
      {
        name: 'Cafe Manager (Admin)',
        email: 'admin@cafeflow.com',
        password: 'password123',
        role: 'admin'
      },
      {
        name: 'Cashier John (Employee)',
        email: 'cashier@cafeflow.com',
        password: 'password123',
        role: 'employee'
      },
      {
        name: 'Head Chef (Kitchen)',
        email: 'kitchen@cafeflow.com',
        password: 'password123',
        role: 'kitchen'
      }
    ]);
    console.log(`Successfully seeded ${users.length} users.`);

    // 2. Create Payment Methods
    console.log('Seeding Payment Methods...');
    const paymentMethods = await PaymentMethod.create([
      { name: 'Cash', isActive: true },
      { name: 'Card', isActive: true },
      { name: 'UPI', isActive: true }
    ]);
    console.log(`Successfully seeded ${paymentMethods.length} payment methods.`);

    // 3. Create Coupons
    console.log('Seeding Coupons...');
    const coupons = await Coupon.create([
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        isActive: true,
        expirationDate: new Date('2030-12-31')
      },
      {
        code: 'SAVE5',
        discountType: 'fixed',
        discountValue: 5,
        isActive: true,
        expirationDate: new Date('2030-12-31')
      }
    ]);
    console.log(`Successfully seeded ${coupons.length} coupons.`);

    // 4. Create Categories
    console.log('Seeding Categories...');
    const categories = await Category.create([
      { name: 'Hot Coffee', description: 'Freshly brewed hot caffeinated beverages', color: '#FF5722' },
      { name: 'Cold Drinks', description: 'Refreshing iced drinks, soda and shakes', color: '#06B6D4' },
      { name: 'Sandwiches & Snacks', description: 'Quick bites, wraps and freshly baked croissants', color: '#8D6E63' },
      { name: 'Desserts', description: 'Sweet treats, cakes and pastries', color: '#EC4899' }
    ]);
    console.log(`Successfully seeded ${categories.length} categories.`);

    const [hotCoffee, coldDrinks, snacks, desserts] = categories;

    // 5. Create Products
    console.log('Seeding Products...');
    const productsList = [
      {
        name: 'Espresso',
        description: 'Rich, full-bodied double shot of espresso',
        price: 2.50,
        category: hotCoffee._id,
        url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80',
        stock: 500,
        isAvailable: true
      },
      {
        name: 'Cappuccino',
        description: 'Double espresso topped with steamed milk foam',
        price: 3.80,
        category: hotCoffee._id,
        url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80',
        stock: 300,
        isAvailable: true
      },
      {
        name: 'Cafe Latte',
        description: 'Double espresso with silky steamed milk',
        price: 4.00,
        category: hotCoffee._id,
        url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80',
        stock: 400,
        isAvailable: true
      },
      {
        name: 'Iced Americano',
        description: 'Espresso shots topped with cold water and ice',
        price: 3.20,
        category: coldDrinks._id,
        url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80',
        stock: 200,
        isAvailable: true
      },
      {
        name: 'Mango Smoothie',
        description: 'Creamy blend of ripe mangoes and Greek yogurt',
        price: 4.80,
        category: coldDrinks._id,
        url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&q=80',
        stock: 100,
        isAvailable: true
      },
      {
        name: 'Fresh Lime Soda',
        description: 'Classic tangy sweet and salty lime cooler',
        price: 3.00,
        category: coldDrinks._id,
        url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80',
        stock: 150,
        isAvailable: true
      },
      {
        name: 'Chicken Club Sandwich',
        description: 'Toasted triple-decker with chicken breast, bacon, and lettuce',
        price: 6.50,
        category: snacks._id,
        url: 'https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=400&q=80',
        stock: 80,
        isAvailable: true
      },
      {
        name: 'Cheese Croissant',
        description: 'Flaky buttery croissant stuffed with melted cheddar',
        price: 3.50,
        category: snacks._id,
        url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80',
        stock: 120,
        isAvailable: true
      },
      {
        name: 'Grilled Veggie Panini',
        description: 'Italian bread pressed with zucchini, bell peppers and mozzarella',
        price: 5.80,
        category: snacks._id,
        url: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400&q=80',
        stock: 60,
        isAvailable: true
      },
      {
        name: 'Chocolate Fudge Cake',
        description: 'Indulgent triple layer chocolate fudge cake slice',
        price: 4.50,
        category: desserts._id,
        url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80',
        stock: 50,
        isAvailable: true
      },
      {
        name: 'Blueberry Cheesecake',
        description: 'Classic baked New York cheesecake slice topped with blueberry compote',
        price: 5.20,
        category: desserts._id,
        url: 'https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=400&q=80',
        stock: 40,
        isAvailable: true
      }
    ];

    const mappedProducts = productsList.map(p => ({
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      image: p.url,
      imageUrl: p.url,
      photo: p.url,
      thumbnail: p.url,
      stock: p.stock,
      isAvailable: p.isAvailable
    }));

    const products = await Product.create(mappedProducts);
    console.log(`Successfully seeded ${products.length} products.`);

    // 6. Create Floors
    console.log('Seeding Floors...');
    const floors = await Floor.create([
      { name: 'Ground Floor', color: '#e5e7eb', isActive: true },
      { name: 'Terrace', color: '#d1fae5', isActive: true }
    ]);
    console.log(`Successfully seeded ${floors.length} floors.`);

    const [groundFloor, terrace] = floors;

    // 7. Create Tables
    console.log('Seeding Tables...');
    const tables = await Table.create([
      // Ground Floor Tables
      {
        name: 'Table 1',
        capacity: 2,
        floor: groundFloor._id,
        posX: 12,
        posY: 18,
        width: 80,
        height: 80,
        shape: 'square',
        status: 'available'
      },
      {
        name: 'Table 2',
        capacity: 4,
        floor: groundFloor._id,
        posX: 45,
        posY: 18,
        width: 90,
        height: 90,
        shape: 'round',
        status: 'available'
      },
      {
        name: 'Table 3',
        capacity: 6,
        floor: groundFloor._id,
        posX: 76,
        posY: 18,
        width: 110,
        height: 110,
        shape: 'square',
        status: 'available'
      },
      {
        name: 'Table 4',
        capacity: 2,
        floor: groundFloor._id,
        posX: 12,
        posY: 55,
        width: 80,
        height: 80,
        shape: 'round',
        status: 'available'
      },
      {
        name: 'Table 5',
        capacity: 4,
        floor: groundFloor._id,
        posX: 45,
        posY: 55,
        width: 90,
        height: 90,
        shape: 'square',
        status: 'available'
      },
      
      // Terrace Tables
      {
        name: 'T-Balcony 1',
        capacity: 4,
        floor: terrace._id,
        posX: 20,
        posY: 35,
        width: 95,
        height: 95,
        shape: 'square',
        status: 'available'
      },
      {
        name: 'T-Balcony 2',
        capacity: 4,
        floor: terrace._id,
        posX: 60,
        posY: 35,
        width: 95,
        height: 95,
        shape: 'round',
        status: 'available'
      }
    ]);
    console.log(`Successfully seeded ${tables.length} tables.`);

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding Failed: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
