"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import randomBgData from "@/constants/randomBgData";
import { AlertCircle, Loader2, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [randomBg, setRandomBg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setMessage("Password reset link sent to your email.");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let random = Math.floor(Math.random() * randomBgData.length);
    setRandomBg(randomBgData[random]);
  }, []);

  return (
    <>
      <main
        className={`relative w-full h-screen flex flex-col items-center justify-center`}
      >
        <div className="w-full h-[90%] lg:max-w-7xl flex items-center justify-around sm:px-3">
          <div className="hidden sm:block">
            <div className="relative w-80 h-20">
              <Image
                src={"/images/horizontal_logo_white.png"}
                alt="logo"
                fill
                className="object-contain w-full"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center sm:gap-3">
            {error && (
              <Alert
                className="w-[90%] mt-4 bg-destructive text-white"
                variant="destructive"
              >
                <AlertCircle className="h-4 w-4" style={{ color: "white" }} />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>error</AlertDescription>
              </Alert>
            )}

            <Card className="w-full sm:max-w-md border-none shadow-none sm:border sm:shadow-sm transition-all duration-300 ease-in-out">
              <CardHeader>
                <Image
                  src={"/images/horizontal_logo.png"}
                  alt="logo"
                  width={200}
                  height={80}
                  className="ml-[-12px] mb-2 sm:hidden"
                />
                <CardTitle>Reset password</CardTitle>
                <CardDescription>
                  Enter your email to receive a password reset link
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center justify-start"><Mail className="mr-2 w-4 h-4"/>Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>

                  <Button type="submit" className="w-full transition-all duration-300 ease-in-out" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                  </Button>
                </form>

                {message && (
                  <Alert
                    className="mt-4 bg-green-500 text-white border-green-500"
                    variant="default"
                  >
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="text-sm text-center text-primary hover:text-main w-full transition-all duration-300 ease-in-out"
                >
                  Back to login
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>

        <div className="w-full h-[10%] flex items-center justify-center">
          <div className="w-full lg:max-w-7xl text-center text-sm text-gray-500 sm:text-white">
            Having trouble? please contact us at{" "}
            <a
              className="text-main hover:text-mainSoft transition-colors duration-300 ease-in-out"
              href="mailto:support@adynamics.in"
            >
              support@adynamics.in
            </a>
          </div>
        </div>

        <div className="absolute w-full h-full top-0 left-0 -z-10 hidden sm:block">
          <Image
            src={randomBg}
            alt="bg"
            fill
            className="object-cover w-full h-full"
          />
        </div>
      </main>
    </>
  );
}
