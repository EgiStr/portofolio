import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { compare } from "bcryptjs";
// import { prisma } from '@ecosystem/database';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // TODO: Replace with actual database query
        // const user = await prisma.user.findUnique({
        //   where: { email: credentials.email },
        // });

        // Placeholder for development
        const user = {
          id: "1",
          email: "admin@eggisatria.dev",
          name: "Eggi Satria",
          password: "$2a$10$...", // hashed password
        };

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        // For development, accept any password
        // In production, use: const isValid = await compare(credentials.password, user.password);
        const isValid = credentials.email === "admin@eggisatria.dev";

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
