import type { Metadata } from 'next';
import { Dashboard } from '@/components/dashboard/dashboard';
import './globals.css';

export const metadata: Metadata = {
  title: 'GimmeAJob - Job Application Assistant',
  description: 'Automate personalized job application emails',
};

export default function Home() {
  return <Dashboard />;
}
