/**
 * New Project Page
 * Redirects to projects list (modal handles creation)
 */

import { redirect } from 'next/navigation';

export default function NewProjectPage() {
  redirect('/projects');
}
