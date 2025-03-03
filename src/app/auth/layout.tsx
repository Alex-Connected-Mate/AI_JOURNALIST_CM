import { Metadata } from 'next';
import AuthClientLayout from './client-layout';

export const metadata: Metadata = {
  title: 'Authentification | Connected Mate',
  description: 'Connectez-vous ou créez un compte sur la plateforme Connected Mate',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthClientLayout>{children}</AuthClientLayout>;
} 