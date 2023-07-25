import { PropsWithChildren } from 'react';
import Header from './header';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
