# tAAkip

This is a React Native mobile application built with Expo. The project uses TypeScript and integrates with Supabase for backend services. Styling is handled with Tailwind via `twrnc`, and application state is managed by Zustand.

## Project Structure

- **App.tsx** – Entry point that sets up providers and navigation.
- **index.ts** – Registers the app with Expo.
- **src/** – Main source directory.
  - **components/** – Reusable UI components.
  - **navigation/** – React Navigation stacks and tab navigators.
  - **screens/** – Individual screens for the app (feed, login, calorie tracker, etc.).
  - **services/** – External service helpers (e.g. Supabase client in `lib/`).
  - **store/** – Zustand store for global state.
  - **theme/** – Tailwind configuration and theme helpers.
  - **__tests__/** – Jest tests.
- **assets/** – Icons and images used in the app.

## Getting Started

1. Install dependencies (requires Node.js and npm):
   ```bash
   npm install
   ```
2. Start the development server with Expo:
   ```bash
   npm start
   ```
3. Run the tests:
   ```bash
   npm test
   ```

Environment variables such as your Supabase URL and key are stored in `.env` and loaded automatically by Expo.

## Learning Next

- [Expo Documentation](https://docs.expo.dev/) – details on running and building React Native apps.
- [React Navigation](https://reactnavigation.org/) – navigation library used in this project.
- [Zustand](https://github.com/pmndrs/zustand) – for state management.
- [Supabase](https://supabase.com/docs) – backend API and database used by the app.
- [Tailwind CSS](https://tailwindcss.com/docs/guides/react-native) with `twrnc` – styling solution.

This repository provides a small example application with authentication, social feed, and calorie tracking features. Explore the `screens` directory to see how each feature is implemented.
