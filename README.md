# 🍕 Devdeep Dhariwal Food App

A comprehensive food delivery platform built with **Next.js 15** featuring multi-role authentication, real-time order management, and seamless payment integration. This full-stack application supports **Customers**, **Vendors (Restaurants)**, and **Delivery Partners** with dedicated dashboards and features.

## 🚀 Features

### 🔐 Authentication System
- **Multi-role Authentication** (Customer, Vendor, Delivery Partner)
- **OTP-based Verification** via email
- **JWT Token-based Sessions**
- **Role-based Access Control**
- **Password Reset & Account Recovery**

### 👥 Customer Features
- **Browse Restaurants** by category and location
- **Advanced Search & Filters** (cuisine, rating, price range)
- **Real-time Menu Browsing** with dynamic pricing
- **Shopping Cart Management** with item customization
- **Multiple Address Management**
- **Secure Checkout Process**
- **Order Tracking** with real-time status updates
- **Order History** with reorder functionality
- **Profile Management**

### 🏪 Vendor/Restaurant Features
- **Restaurant Profile Management**
- **Menu Management** (Add, Edit, Delete items)
- **Order Management Dashboard**
- **Real-time Order Notifications**
- **Order Status Updates**
- **Delivery Partner Assignment**
- **Sales Analytics & Statistics**
- **Business Status Toggle** (Open/Closed)

### 🚚 Delivery Partner Features
- **Profile & Vehicle Information Management**
- **Availability Status Toggle**
- **Order Assignment System**
- **Real-time Order Tracking**
- **Delivery Status Updates**
- **Earnings Dashboard**

### 💳 Payment Integration
- **Razorpay Payment Gateway**
- **Cash on Delivery (COD)**
- **Secure Payment Processing**
- **Payment Status Tracking**

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, bcryptjs
- **File Upload**: Cloudinary
- **Email Service**: Custom email service
- **Icons**: Lucide React
- **Payments**: Razorpay

## 📂 Project Structure

```
devdeepdhariwal-food-app/
├── 📁 app/                          # Next.js App Router
│   ├── 🌐 api/                      # API Routes
│   │   ├── auth/                    # Authentication endpoints
│   │   ├── customer/                # Customer-specific APIs
│   │   ├── vendor/                  # Vendor-specific APIs
│   │   ├── delivery-partner/        # Delivery partner APIs
│   │   ├── profile/                 # Profile management
│   │   └── upload/                  # File upload endpoints
│   ├── 🎯 dashboard/                # Role-based dashboards
│   │   ├── customer/                # Customer dashboard pages
│   │   ├── vendor/                  # Vendor dashboard pages
│   │   └── delivery-partner/        # Delivery partner pages
│   ├── 🔑 login/                    # Login page
│   └── 📝 register/                 # Registration page
├── 🧩 components/                   # Reusable Components
│   ├── auth/                        # Authentication components
│   ├── common/                      # Shared components
│   ├── customer/                    # Customer-specific components
│   └── vendor/                      # Vendor-specific components
├── 📚 lib/                          # Utility libraries
├── 🗂️ models/                       # MongoDB Models
├── 🔧 utils/                        # Helper functions
└── 📖 README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB Database
- Cloudinary Account (for image uploads)
- Email Service Configuration
- Razorpay Account (for payments)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/devdeepdhariwal/food-app.git
cd devdeepdhariwal-food-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env.local` file in the root directory:
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration
EMAIL_SERVICE_CONFIG=your_email_config

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_SECRET=your_razorpay_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:3000`

## 📱 User Roles & Access

### 🛍️ Customer Dashboard
- **Home**: Browse restaurants and categories
- **Restaurant**: View menus and place orders
- **Cart**: Manage order items
- **Checkout**: Complete payment process
- **Orders**: Track current and past orders
- **Profile**: Manage personal information
- **Addresses**: Manage delivery addresses

### 🏪 Vendor Dashboard
- **Overview**: Business analytics and statistics
- **Menu Management**: Add/edit/delete menu items
- **Orders**: Manage incoming orders
- **Delivery Partners**: View and assign delivery partners
- **Profile**: Manage restaurant information

### 🚚 Delivery Partner Dashboard
- **Overview**: Earnings and delivery statistics
- **Available Orders**: View and accept delivery requests
- **Active Deliveries**: Manage ongoing deliveries
- **Profile**: Manage personal and vehicle information

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/resend-otp` - Resend OTP
- `GET /api/auth/me` - Get current user

### Customer APIs
- `GET /api/customer/restaurants` - Get restaurants
- `GET /api/customer/restaurants/[id]` - Get restaurant details
- `GET /api/customer/restaurants/[id]/menu` - Get restaurant menu
- `POST /api/customer/orders` - Place order
- `GET /api/customer/orders` - Get customer orders

### Vendor APIs
- `GET /api/vendor/orders` - Get vendor orders
- `PUT /api/vendor/orders/[orderId]` - Update order status
- `GET /api/vendor/menu` - Get menu items
- `POST /api/vendor/menu` - Add menu item
- `PUT /api/vendor/menu/[itemId]` - Update menu item

### Delivery Partner APIs
- `GET /api/delivery-partner/orders` - Get available orders
- `PUT /api/delivery-partner/orders/[action]` - Accept/complete orders
- `GET /api/delivery-partner/dashboard` - Get dashboard data

## 🎨 Key Features Implementation

### 🔐 Multi-Role Authentication
- Custom JWT implementation with role-based access
- OTP verification system for secure registration
- Protected routes with middleware validation

### 📱 Responsive Design
- Mobile-first approach with Tailwind CSS
- Optimized for all device sizes
- Smooth animations and transitions

### 🛒 Shopping Cart
- Persistent cart state management
- Real-time price calculations
- Item customization options

### 📍 Location Services
- Pincode-based delivery validation
- Address management system
- Location-based restaurant filtering

### 💰 Payment Processing
- Razorpay integration for online payments
- COD support with validation
- Secure transaction handling

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Developer

**Devdeep Dhariwal**
- GitHub: [@devdeepdhariwal](https://github.com/devdeepdhariwal)
- Email: devdeepdhariwal@gmail.com

## 🎯 Future Enhancements

- [ ] Real-time chat support
- [ ] Advanced analytics dashboard
- [ ] Push notifications
- [ ] Multi-language support
- [ ] Advanced search filters
- [ ] Loyalty program integration
- [ ] Social media integration
- [ ] Advanced reporting system
