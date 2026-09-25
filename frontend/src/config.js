/**
 * Central API URL configuration.
 *
 * In local development: reads from frontend/.env → VITE_API_URL=http://127.0.0.1:8000
 * In Vercel production: reads from the VITE_API_URL environment variable set in the
 *   Vercel project dashboard (set it to your Render backend URL).
 *
 * Falls back to localhost if the variable is not set (e.g. running `npm run dev`
 * without a .env file).
 */
const rawUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
export const API_URL = rawUrl.replace(/\/+$/, '');
