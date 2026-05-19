import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith("/") ? params.next : "/account";

  return (
    <section className="container-page py-16">
      <h1 className="font-display text-4xl text-[#6e4800]">Login</h1>
      <LoginForm nextPath={nextPath} />
    </section>
  );
}
