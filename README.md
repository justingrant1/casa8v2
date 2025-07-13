# Casa8 - Section 8 Housing Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://casa8v2.vercel.app)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-green?style=for-the-badge&logo=supabase)](https://supabase.com)

## 🏠 Project Overview

Casa8 is a specialized rental platform connecting landlords who accept Section 8 housing vouchers with tenants seeking affordable housing. The platform streamlines the rental process with property listings, applications, messaging, and location-based search.

**Mission**: "Welcome Home with Section 8" - Making affordable housing accessible by bridging the gap between Section 8 tenants and voucher-accepting landlords.

- **Live Site**: [https://casa8v2.vercel.app](https://casa8v2.vercel.app)
- **Repository**: [https://github.com/justingrant1/casa8v2](https://github.com/justingrant1/casa8v2)

## 🛠️ Technology Stack

### Core Framework
- **Frontend**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript 5.x
- **Runtime**: React 19
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI + shadcn/ui

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **API**: Next.js API Routes

### Key Integrations
- **Google Maps API**: Property mapping
- **Google Places API**: Address autocomplete  
- **EmailJS**: Contact notifications
- **IP Geolocation**: Location detection

### Development Tools
- **Package Manager**: pnpm 10.x
- **Deployment**: Vercel
- **Version Control**: Git/GitHub

## ✨ Current Features

### 🔐 Authentication & User Management
- Role-based authentication (Tenant/Landlord)
- User profiles with preferences
- Tenant onboarding for voucher information
- Password reset functionality

### 🏘️ Property Management
- Property listing creation with image uploads
- Drag & drop image reordering
- Main image selection (star system)
- Property search and filtering
- Favorites system
- Location-based property discovery

### 📧 Communication & Applications
- Contact landlord modal with email integration
- Property application system with comprehensive forms
- EmailJS notifications to landlords
- Real-time email notifications

### 🗺️ Location Services
- Google Places autocomplete for addresses
- IP-based location detection for homepage
- Distance calculation and sorting
- Address geocoding for properties

### 📱 User Experience
- Responsive design for all devices
- Property image carousels
- Loading states and error handling
- Toast notifications

## 🚧 Development Roadmap

### ✅ COMPLETED FEATURES
- ✅ Image preview with thumbnails
- ✅ Drag and drop image upload
- ✅ Image reordering functionality
- ✅ Main image selection (star system)
- ✅ Basic property listing functionality
- ✅ User authentication (landlord/tenant)
- ✅ Address autocomplete with Google Places API
- ✅ Property search and filtering
- ✅ Favorites system
- ✅ Dashboard for landlords
- ✅ EmailJS integration for notifications
- ✅ Contact landlord functionality
- ✅ Property application system
- ✅ Tenant onboarding component
- ✅ Location-based search

### 🔄 IN PROGRESS
- 🚧 Video upload support
- 🚧 Mobile dashboard optimization
- 🚧 Enhanced property applications

### 📋 PLANNED FEATURES

#### 🚀 PHASE 1: IMAGE & MEDIA (HIGH PRIORITY)
- [ ] Upload Progress Bar (bulk uploads 10+ images)
- [ ] Video Upload Support with preview
- [ ] Image validation & error handling
- [ ] Mobile-optimized image management

#### 📱 PHASE 2: MOBILE & UX FIXES (HIGH PRIORITY)
- [ ] Mobile Landlord Dashboard optimization
- [ ] Fix dashboard blank screen after property deletion
- [ ] Responsive image grid improvements
- [ ] Touch-friendly drag & drop

#### 💬 PHASE 3: COMMUNICATION (MEDIUM PRIORITY)
- [ ] Applications Tab (tenant applications)
- [ ] Messages Tab (in-app messaging)
- [ ] Contact Landlord modal (chat/email)
- [ ] Email notifications
- [ ] Real-time messaging

#### 🔍 PHASE 4: SEARCH ENHANCEMENT (MEDIUM PRIORITY)
- [ ] Functional Google Places search bar
- [ ] Location-based results (IP detection)
- [ ] Advanced filters (price, bedrooms, amenities)
- [ ] Search result optimization
- [ ] Map view (Google Maps API)

#### 🏠 PHASE 5: APPLICATIONS & CONTACT (HIGH PRIORITY)
- [ ] Apply Now functionality
- [ ] Contact info display on property pages
- [ ] Voucher size selection for landlords
- [ ] Application status tracking

#### 🔐 PHASE 6: AUTH & PROFILES (MEDIUM PRIORITY)
- [ ] Google Login integration
- [ ] Tenant onboarding (voucher info collection)
- [ ] User profiles (landlord/tenant)
- [ ] Settings pages
- [ ] Contact preferences implementation

#### 🗺️ PHASE 7: ADVANCED FEATURES (LOW PRIORITY)
- [ ] Interactive map view
- [ ] Geolocation services
- [ ] Property analytics
- [ ] Saved searches
- [ ] AI recommendations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- Supabase account
- Google Cloud Platform account
- EmailJS account

### Installation

1. **Clone repository**
```bash
git clone https://github.com/justingrant1/casa8v2.git
cd casa8v2
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Environment Setup**

Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ylhkoromgjhapjpagvxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google APIs
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# EmailJS
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_PRIVATE_KEY=your_emailjs_private_key

# IP Geolocation
NEXT_PUBLIC_IPGEOLOCATION_API_KEY=your_ipgeolocation_key
```

4. **Run development server**
```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📊 Database Architecture

### Supabase Project
- **Project**: casa8-rental-platform
- **URL**: https://ylhkoromgjhapjpagvxg.supabase.co

### Core Tables
- `profiles` - User accounts (tenant/landlord roles)
- `properties` - Property listings with details
- `property_images` - Property photos with ordering
- `user_favorites` - Saved properties per user

### Setup Instructions
1. Access Supabase Dashboard
2. Run SQL commands from `DATABASE_SETUP.md`
3. Configure Row Level Security policies
4. Set up storage bucket for property images

## 🗂️ Project Structure

```
casa8/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage with Section 8 focus
│   ├── dashboard/         # Landlord dashboard
│   ├── search/            # Property search
│   ├── property/[id]/     # Property details
│   ├── list-property/     # Create listings
│   ├── profile/           # User profiles
│   ├── settings/          # User settings
│   ├── login/             # Authentication
│   ├── register/          # User registration
│   └── favorites/         # Saved properties
├── components/            # Reusable components
│   ├── ui/               # Base UI components (Radix)
│   ├── contact-landlord-modal.tsx
│   ├── apply-property-modal.tsx
│   ├── tenant-onboarding.tsx
│   ├── video-upload.tsx
│   ├── address-autocomplete.tsx
│   └── location-search.tsx
├── lib/                  # Utilities & services
│   ├── supabase.ts       # Database client
│   ├── auth.tsx          # Authentication context
│   ├── email.ts          # EmailJS integration
│   ├── properties.ts     # Property management
│   ├── location.ts       # Location services
│   └── utils.ts          # Utility functions
├── hooks/                # React hooks
├── public/               # Static assets
├── scripts/              # Utility scripts
│   └── geocode-properties.ts
├── DATABASE_SETUP.md     # Database setup guide
├── EMAILJS_SETUP.md      # Email setup guide
└── GAMEPLAN.md           # Development roadmap
```

## 🚨 Known Issues to Fix

1. **Dashboard Issues**
   - Dashboard shows blank screen after property deletion
   - Landlord dashboard not mobile optimized

2. **Functionality Gaps**
   - Apply now button not fully functional
   - Contact landlord shows incorrect info
   - Search bar not fully functional

3. **Missing Features**
   - No video upload capability
   - No progress indication for bulk uploads
   - Limited mobile optimization

## 🔧 Scripts

```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm lint                   # Run ESLint

# Database
# See DATABASE_SETUP.md for SQL commands

# Deployment
# Automatic deployment via Vercel on push to main
```

## 📝 Documentation

- **Database Setup**: [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- **EmailJS Setup**: [EMAILJS_SETUP.md](./EMAILJS_SETUP.md)
- **Development Plan**: [GAMEPLAN.md](./GAMEPLAN.md)

## 🎯 Success Metrics

### MVP Completion Goals
- All high priority features working
- Mobile optimized experience
- Core user flows functional
- Email notifications working
- Property search operational
- Apply now process complete

### Performance Targets
- Page load speed < 2 seconds
- Image upload < 30 seconds for 10+ images
- Search results < 1 second
- Mobile-first responsive design

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📧 Contact

**Project Owner**: Justin Grant
- **Repository**: [https://github.com/justingrant1/casa8v2](https://github.com/justingrant1/casa8v2)
- **Live Site**: [https://casa8v2.vercel.app](https://casa8v2.vercel.app)

---

**Last Updated**: January 13, 2025
**Version**: 0.1.0
**Status**: Active Development
