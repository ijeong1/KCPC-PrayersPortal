import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import Providers from '@components/Providers'; // Providers가 SessionProvider 포함
import NavigationBar from '@components/NavigationBar';
import "../globals.css";
import Footer from '@/components/Footer';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params:any
}) {
  const { locale } = await params;

  setRequestLocale(locale);
  const messages = await getMessages(locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <div className="flex flex-col min-h-screen ">
              { /* 상단 네비게이션 바 */ }
              <NavigationBar />
              { /* 메인 컨텐츠 영역 */ }
                <main className="flex-grow bg-white">{children}</main>
              { /* 하단 푸터 */ }
              <Footer/>
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}