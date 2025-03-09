import './widget.css';

export const metadata = {
  title: 'Widget AI Chat',
  description: 'Chat with an AI assistant',
};

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
} 