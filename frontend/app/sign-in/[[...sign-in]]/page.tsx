import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex max-h-screen items-center justify-center py-12">
      <SignIn
        path="/sign-in"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg rounded-lg border border-gray-200 dark:border-gray-800",
            formButtonPrimary: "bg-primary hover:bg-primary/90",
          },
        }}
        routing="path"
        signUpUrl="/sign-up"
        redirectUrl="/dashboard"
      />
    </div>
  )
}

