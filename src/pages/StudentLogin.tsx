import { AuthLayout } from '../components/AuthLayout';

export default function StudentLogin() {
  return (
    <AuthLayout
      sceneType="student"
      eyebrow="Student portal"
      title="Welcome back."
      subtitle="Sign in to report issues, track your complaints, and confirm resolutions."
      switchLink={{
        text: 'Warden? Sign in here',
        href: '#/warden/login',
      }}
    />
  );
}
