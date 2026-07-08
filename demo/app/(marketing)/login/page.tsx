/**
 * Login page — redirects to the app.
 * In production this would have auth. For the capstone, it goes straight to the queue.
 */
import { redirect } from 'next/navigation';

export default function LoginPage() {
  redirect('/app/queue');
}
