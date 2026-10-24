import { AuthLayout } from '../components/AuthLayout';

export default function WardenLogin() {
  return (
    <AuthLayout
      sceneType="warden"
      eyebrow="Warden portal"
      title="Your queue is waiting."
      subtitle="Sign in to manage complaints, update statuses, and track your performance."
      switchLink={{
        text: 'Student? Sign in here',
        href: '#/student/login',
      }}
    />
  );
}
