# Petopia Petcare - Pet Management App 🐾

Petopia Petcare is a modern pet management application built with React Native and Expo, designed to help pet owners track their pets' health records, events, and daily activities with a beautiful and intuitive interface.

**🔥 MongoDB Backend Integration**: The app now uses MongoDB as the backend database with ObjectId-based ID format for improved performance and scalability.

[![Expo Version](https://img.shields.io/badge/Expo-~54.0.20-blue.svg)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-green.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-green.svg)](https://www.mongodb.com/)

## 📱 Features

- 🐕 **Pet Profile Management** - Create and manage profiles for all your pets
- 🏥 **Health Records** - Track vaccinations, medications, and vet visits
- 📅 **Event Tracking** - Schedule and remember important pet events
- 💰 **Simplified Budget Management** - Single user-level monthly budget with pet spending breakdown
- 💳 **Expense Tracking** - Monitor and categorize pet-related expenses with multi-currency support
- 🌍 **Multi-language Support** - English and Turkish languages
- 🌙 **Dark Mode** - Beautiful light and dark theme support
- 🔐 **Secure Authentication** - Better Auth integration for secure login
- 💳 **Premium Features** - RevenueCat integration for subscription management

## 🗄️ Database Migration

The app has been migrated from SQLite to MongoDB:
- **ID Format**: Now uses MongoDB ObjectId format (24-character hexadecimal string)
- **Data Validation**: Enhanced validation with ObjectId format checking
- **Migration**: Automatic local storage cleanup on first launch after update
- **Clean Slate**: All existing local data is cleared for fresh start

## 🧪 Testing the App

### New User Flow (Recommended)
Since the app was migrated to MongoDB, users will start with a clean slate:

1. Install and launch the app
2. Create a new account
3. Add your first pet profile
4. Start adding health records, events, and expenses
5. All data will be properly stored with ObjectId format

### Testing Features
Test all CRUD operations to ensure proper ObjectId handling:

1. **Pet Management**
   - Create new pets ✅
   - Edit pet profiles ✅
   - Delete pets ✅

2. **Health Records**
   - Add vaccinations ✅
   - Schedule vet visits ✅
   - Track medications ✅

3. **Events & Schedules**
   - Create events ✅
   - Set feeding schedules ✅
   - Manage calendars ✅

4. **Budget & Expenses**
   - Set budget limits ✅
   - Track expenses ✅
   - View analytics ✅

### Data Consistency
All IDs are now validated as:
```regex
^[0-9a-fA-F]{24}$
```
Example valid ID: `507f1f77bcf86cd799439011`

## 🛠 Tech Stack

### Core Technologies

- **React Native 0.81.5** with Expo SDK ~54.0.20
- **TypeScript** with strict mode for type safety
- **Expo Router** for file-based navigation

### State Management

- **Zustand** for client state management
- **TanStack Query** for server state with mobile-optimized caching

### Development & Build

- **ESLint** for code quality
- **EAS Build** for deployment
- **TypeScript Path Aliases** for clean imports

### Third-party Integrations

- **Better Auth** for authentication
- **RevenueCat** for subscription management
- **i18next** for internationalization

## 📁 Project Structure

```
petopia-petcare/
├── app/                    # Expo Router file-based routing
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   ├── index.tsx          # Landing page
│   ├── subscription.tsx   # Subscription modal
│   └── _layout.tsx        # Root layout with providers
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── subscription/     # Subscription components
│   └── [feature]/        # Feature-specific components
├── lib/                   # Core library code
│   ├── api/              # API client and endpoints
│   ├── auth/             # Authentication utilities
│   ├── hooks/            # Custom React hooks
│   │   ├── useUserBudget.ts    # Simplified budget management hooks
│   │   └── ...                  # Other feature hooks
│   ├── services/         # Business logic services
│   │   ├── userBudgetService.ts # Simplified budget API service
│   │   └── ...                  # Other feature services
│   ├── schemas/          # Zod validation schemas
│   │   ├── userBudgetSchema.ts  # Budget validation schemas
│   │   └── ...                  # Other feature schemas
│   ├── theme/            # Theme system
│   ├── types.ts          # Central TypeScript definitions
│   └── i18n.ts           # Internationalization setup
├── stores/               # Zustand state management
├── providers/            # React context providers
├── locales/              # Translation files (en.json, tr.json)
├── constants/            # App constants
├── eas.json              # EAS Build configuration
└── package.json          # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/petopia-petcare.git
   cd petopia-petcare
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Development

Start the development server:

```bash
npm start
```

This will open Expo Go in your default browser where you can:

- Scan the QR code with your mobile device using the Expo Go app
- Run on iOS Simulator or Android Emulator
- Open in web browser

### Platform-Specific Development

```bash
# Run on Android device/emulator
npm run android

# Run on iOS simulator/device
npm run ios

# Run in web browser
npm run web

# Run linting
npm run lint

# Reset project to clean state (custom script)
npm run reset-project
```

### Tests

```bash
# Run all unit tests (Vitest)
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Vitest UI
npm run test:ui

# Expo CLI tests (UI/native modules)
npm run test:expo
```

## 🌐 Features Overview

### Navigation

- File-based routing with Expo Router
- Route groups for authentication (`(auth)`) and main app (`(tabs)`)
- Modal presentation for subscription screen
- Deep linking with `petopia-petcare://` scheme

### Internationalization

- Support for English and Turkish languages
- Namespace-based translations in `locales/`
- Dynamic language switching via Zustand store

### Theme System

- Custom light/dark theme implementation
- System-responsive theme switching
- Zustand store for theme state

### API Integration

- Axios-based client with interceptors
- Mobile-optimized TanStack Query configuration
- Intelligent caching and retry logic for mobile networks

### Budget System (New Simplified Architecture)

- **User-Level Budgets**: Single monthly budget per user covering all pets
- **Pet Spending Breakdown**: Detailed expense analysis per pet within the unified budget
- **Real-Time Alerts**: Configurable alert thresholds with automatic notifications
- **Multi-Currency Support**: Track expenses in multiple currencies with proper conversion
- **Simplified Setup**: 2-step budget creation process (amount + alert threshold)
- **Progress Tracking**: Visual progress bars with color-coded spending indicators

## 📱 Screenshots

_[Add screenshots here when available]_

## 💰 Budget System

The Petopia Petcare app features a newly simplified budget management system designed for ease of use and comprehensive expense tracking.

### Key Features

- **Unified Budget Management**: Single budget per user instead of complex per-pet budgets
- **Pet Expense Breakdown**: See which pets contribute most to your spending
- **Smart Alerts**: Get notified when approaching or exceeding budget limits
- **Multi-Currency Support**: Track expenses in TRY, USD, EUR, GBP, and more
- **Visual Progress Tracking**: Intuitive progress bars and spending indicators
- **Quick Setup**: Set up your monthly budget in under 60 seconds

### Budget Components

- **SimpleBudgetOverview**: Home screen widget for quick budget overview
- **UserBudgetCard**: Detailed budget display with progress tracking
- **UserBudgetForm**: Intuitive budget setup and editing interface

### API Endpoints

```
GET /api/budget          # Get user's budget
PUT /api/budget          # Set/update budget
DELETE /api/budget       # Remove budget
GET /api/budget/status   # Get spending status with pet breakdown
GET /api/budget/alerts   # Check budget alerts
```

For detailed technical documentation, see [Budget Simplification Implementation Summary](docs/budget-simplification-implementation-summary.md).

## � Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
EXPO_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.app  # For local dev, replace with your actual ngrok URL
EXPO_PUBLIC_REVENUECAT_API_KEY=your-revenuecat-key
# Add other environment variables as needed
```

**Note**: For local development with ngrok, replace `https://your-ngrok-url.ngrok-free.app` with your actual ngrok tunnel URL (e.g., `https://abc123.ngrok-free.app`). For production, use your actual production API endpoint.

### Build Configuration

The app is configured with EAS Build. See `eas.json` for build profiles.

## 📦 Build & Deploy

### EAS Build

```bash
# Build for all platforms
eas build --platform all

# Build for specific platform
eas build --platform ios
eas build --platform android
```

### Submit to App Stores

```bash
# Submit to Apple App Store
eas submit --platform ios

# Submit to Google Play Store
eas submit --platform android
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode guidelines
- Use existing components and patterns from `components/ui/`
- Maintain consistent code style with ESLint
- Add proper internationalization for new features
- Follow the established file-based routing structure

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Expo Team** for the amazing React Native framework
- **React Navigation** for routing solutions
- **RevenueCat** for subscription management
- **Better Auth** for authentication framework

## 📞 Contact

If you have any questions or suggestions, feel free to:

- Open an [Issue](https://github.com/asugan/petopia-petcare/issues)
- Create a [Pull Request](https://github.com/asugan/petopia-petcare/pulls)
- Contact us at [cagatayeren1898@gmail.com]

---

Made with ❤️ for pet lovers everywhere 🐕🐈🐾
