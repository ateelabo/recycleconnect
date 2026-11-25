
# RecycleConnect

RecycleConnect is a waste collection and recycling platform designed to connect households and residential estates with KYC-verified waste collectors.

The platform consists of a **Web Application / Progressive Web App (PWA)** for households, estate managers, and administrators, paired with a **Collector Android Mobile App (.apk)** for waste collection operations.

RecycleConnect aims to make waste collection more organised, transparent, and rewarding. It enables users to schedule waste pickups, track recyclable materials, and receive wallet rewards based on the verified weight of collected waste.

By combining verified collection processes, transparent Naira-per-kilogram rates, and digital proof of weighing, RecycleConnect helps ensure that recyclable waste is measured accurately and that users receive the correct rewards.

**Project Status:** Under Development

**Project Type:** Web Application / PWA and Android Mobile Application

---

## Table of Contents

1. [About the Project](#about-the-project)
2. [Target Users](#target-users)
3. [MVP Features](#mvp-features)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Prerequisites](#prerequisites)
7. [Installation and Setup](#installation-and-setup)
8. [Running the Application](#running-the-application)
9. [Deployment](#deployment)
10. [Project Links](#project-links)
11. [Contributing](#contributing)
12. [License](#license)
13. [Project Status and Documentation Updates](#project-status-and-documentation-updates)

---

## About the Project

RecycleConnect provides a digital platform through which households and residential estates can arrange recyclable waste collection by verified service providers.

The platform uses a reward system based on the measured weight and type of recyclable materials collected. Its rate card displays the applicable value per kilogram for different recyclable categories, helping users understand how their rewards are calculated.

The project has two application interfaces:

- **Web Application / PWA:** Designed for households, estate managers, and administrators.
- **Collector Android Mobile App:** Designed for waste collectors to manage assigned pickups, view collection locations, and complete collection and verification activities.

## Target Users

RecycleConnect supports four main user roles:

### 1. Households

Individuals and families who generate recyclable waste and use the platform to schedule collections, track their recyclable materials, and receive wallet rewards.

### 2. Estate Managers

Individuals or organisations responsible for managing residential estates. Estate Managers act as customers and waste generators on behalf of their estates. They can arrange recurring waste pickups and verify collectors' digital badges at the estate gate.

### 3. Waste Collectors

Individuals responsible for collecting recyclable waste from households and residential estates. Collectors use the Android mobile application to view scheduled pickups, navigate collection locations, weigh recyclable materials, and complete collection verification.

### 4. Administrators

Platform administrators responsible for overseeing platform operations, verifying collector KYC submissions, managing recyclable material rates, reviewing disputes, and monitoring collection totals.

## MVP Features

The Minimum Viable Product (MVP) includes the following seven core functional requirements.

### FR-01: Role-Based Onboarding and KYC Verification

The platform supports role-based registration and onboarding for:

- Households
- Estate Managers
- Waste Collectors
- Administrators

Supported sign-in methods include Google Sign-In and phone number verification through One-Time Password (OTP).

Collector onboarding includes the submission of:

- Identification document
- National Identification Number (NIN)
- Live camera-only selfie
- Guarantor details

These details support the collector verification process before access to relevant collection activities.

### FR-02: Live Naira-per-Kilogram Rate Card

The platform displays the current reward rates for supported recyclable materials.

The MVP rate card covers:

- PET bottles
- Cans
- Cartons
- Glass

Rates are displayed in Nigerian Naira per kilogram (₦/kg) so users can understand the value of the recyclable materials they submit.

### FR-03: Recurring and One-Off Pickups

Users can arrange recurring collections or schedule individual pickups.

The MVP supports:

- Recurring Saturday pickups at 9:00 AM for Estates.
- Recurring Saturday pickups at 10:00 AM for Households.
- Cancellation of the next scheduled pickup.
- Scheduling of one-off pickups, with a load photo.
- Travelling Mode, which allows users to pause and resume recurring pickups.

### FR-04: Verified Dispatch and Map Pins

The platform provides digital verification and collection-location information to support secure and organised pickups.

Key features include:

- A digital Collector Badge with the identifier **RC-XXX** for collector identification and estate gate verification.
- A map displaying scheduled pickup locations for Collectors.
- Estate Managers can use the digital badge to verify a collector's identity at the estate gate before granting access.

### FR-05: Conditional Scale Photo Proof

The platform supports photo evidence of the weighing process to improve transparency.

A live camera photo showing the scale digits is required only when the resident is absent during collection.

When the resident is present, a scale photo is not required under this MVP requirement.

### FR-06: Instant Wallet Credit and Collection Confirmation

The platform calculates wallet rewards using the verified weight of recyclable materials and the applicable material rates.

Key features include:

- Instant wallet credit following weighing and verification.
- A conversion rate of **1 Point = ₦1**.
- A Thumbs Up action for confirming a collection.
- A Thumbs Down action for disputing a collection.

This process allows users to confirm or dispute collection details and supports transparent reward calculations.

### FR-07: Admin Portal

The Admin Portal provides tools for managing and monitoring key platform activities.

Its MVP features include:

- Side-by-side verification of Collector identification documents and live selfies.
- A live recyclable material rate editor for updating ₦/kg rates.
- A dispute queue for reviewing disputed collections.
- Daily collection totals for operational monitoring.

## Technology Stack

RecycleConnect uses the following technologies and services:

| Technology | Purpose |
|---|---|
| React (Vite) | Web application development |
| Tailwind CSS | Web application styling |
| React Native Expo | Android mobile application development |
| PostgreSQL | Relational database |
| Supabase | Database services, authentication, and APIs |
| Cloudinary / Storage | Media and file storage |
| Vercel | Web application hosting |

Additional implementation details may be documented as the development team confirms them.

## Project Structure

The project repositories contain the application source code and configuration files required for development.

The following is a general description of the project structure. The exact directories may differ between the web and mobile repositories.

| Directory / File | Description |
|---|---|
| `app/` | Application screens and routing, where applicable |
| `assets/` | Images, icons, fonts, and other application assets |
| `context/` | Application context and shared state providers |
| `package.json` | Project dependencies and available scripts |
| `app.json` | Expo application configuration |
| `eas.json` | Expo Application Services build configuration |
| `tsconfig.json` | TypeScript configuration |

## Prerequisites

Before setting up the development environment, ensure that the following tools are installed:

- **Node.js** — supported version to be confirmed by the development team.
- **npm** — installed with Node.js.
- **Git** — for cloning and managing the project repository.
- **Visual Studio Code (VS Code)** — recommended code editor.

Additional platform-specific requirements may apply when building or running the Android application.

## Installation and Setup

### 1. Clone the Repository

Clone the relevant project repository using its Git URL.

For the mobile application repository:

```bash
git clone <MOBILE_APP_REPOSITORY_URL>
```

### 2. Navigate to the Project Directory

```bash
cd <PROJECT_DIRECTORY>
```

### 3. Install Dependencies

```bash
npm install
```

The frontend web and mobile applications may have separate repositories and setup instructions. Use the repository-specific instructions supplied by the development team.

### 4. Configure Environment Variables

Some application services may require environment variables, including Supabase connection details and media storage configuration.

Obtain the required environment variables and configuration instructions from the development team before running the application.

**Important:** Do not commit passwords, private API keys, access tokens, or other secret credentials to the public repository.

## Running the Application

Available commands depend on the repository being used.

For the Expo-based mobile application, the following commands are identified in the project configuration:

| Command | Description |
|---|---|
| `npm start` | Starts the Expo development server |
| `npx expo start` | Alternative command for starting the Expo development server |
| `npm run web` | Starts the web version, where configured |
| `npm run ios` | Starts the iOS development workflow, where configured |
| `npm run lint` | Runs the project's linting checks |

The iOS development workflow may require a compatible macOS and iOS development environment.

For the React (Vite) web application, use the scripts documented in its own `package.json`.

## Deployment

The RecycleConnect Web Application is hosted on Vercel. The Collector Android Mobile App is distributed as an Android application package (.apk).

The production deployment details, including the final application URLs and APK distribution link, will be maintained here once confirmed by the development team.

## Project Links

The following resources support access to the application, design references, source code, and project progress.

| Resource | Link |
|---|---|
| Live Web Application (Vercel) | [Open Web Application](https://recycleconnect-five.vercel.app/) |
| Figma Prototype (Flows 1–4) | [View Figma Prototype](https://www.figma.com/proto/2PRGdflp6DA9OZRbqTaLHN/Excel-Design?node-id=1051-81&p=f&t=PEUYAiNcOWMZjGci-1&scaling=scale-down&content-scaling=fixed&page-id=980%3A163) |
| Mobile App GitHub Repository | [View Mobile Repository](https://github.com/MYCHAEL-ODII/RecycleConnect) |
| Live Links and Daily Commits Tracker | Add confirmed Google link |
| Frontend GitHub Repository | [View Frontend Repository](https://github.com/ateelabo/recycleconnect) |
| Backend GitHub Repository | To be added |
| API Documentation | To be added |

## Contributing

Contribution guidelines, development standards, and procedures for submitting changes will be provided by the project maintainers.

Contributors should consult the relevant repository documentation and coordinate with the development team before making changes to the project.

## License

This project is for educational purposes under TechCrush Bootcamp.

## Project Status and Documentation Updates

RecycleConnect is currently under development. Features and implementation details may change as the project progresses.

This README will be updated to reflect confirmed changes to the application, its technology stack, setup instructions, deployment information, and available documentation.

For questions or clarification about the project, please contact the project maintainers.
