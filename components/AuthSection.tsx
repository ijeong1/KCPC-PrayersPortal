import { useSession } from 'next-auth/react';
import LoginButton from './LoginButton';
import UserMenu from './UserMenu';

export default function AuthSection() {
  const { data: session } = useSession();

  return (
    <>
      {session?.user ? <UserMenu /> : <LoginButton />}
    </>
  );
}
