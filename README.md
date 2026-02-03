# Prayer Tracker App

## 🚀 Overview
A mobile application designed to help users track their daily prayers and maintain spiritual consistency. This project demonstrates the integration of a mobile frontend with a robust backend using **Supabase** for authentication and real-time data storage.

## 🛠 Tech Stack
* **Frontend:** React Native (TypeScript)
* **Backend:** Supabase (PostgreSQL)
* **Authentication:** Supabase Auth
* **Security:** PostgreSQL Row Level Security (RLS)

## ✨ Features
* **Secure Authentication:** Users can sign up and log in securely.
* **Daily Tracking:** Log prayers (Fajr, Dhuhr, Asr, Maghrib, Isha).
* **Cloud Sync:** Data is stored in the cloud, allowing access across devices.
* **Data Privacy:** Implements Row Level Security (RLS) so users can only view and edit their own records.

## ⚙️ Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/YourUsername/your-repo-name.git](https://github.com/YourUsername/your-repo-name.git)
    cd your-repo-name
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Variables**
    This project relies on environment variables for database connections. Create a file named `.env` in the root directory (this file is ignored by Git for security).
    
    Add your specific keys:
    ```text
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
    ```

4.  **Run the App**
    ```bash
    npm start
    ```

## 🔒 Security Note
This repository does not include the `.env` file containing sensitive API keys. The database is further secured using RLS policies to prevent unauthorized data access.

## 👤 Author
**Nouman Naeem**
* CS Student | AI Enthusiast
