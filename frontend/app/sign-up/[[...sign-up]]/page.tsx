import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="flex max-h-screen items-center justify-center py-12">
      <SignUp
      path="/sign-up"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg rounded-lg border border-gray-200 dark:border-gray-800",
            formButtonPrimary: "bg-primary hover:bg-primary/90",
          },
        }}
        routing="path"
        signInUrl="/sign-in"
        redirectUrl="/dashboard"
      />
    </div>
  )
}

