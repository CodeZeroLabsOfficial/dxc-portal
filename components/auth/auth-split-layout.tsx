import type { ReactNode } from "react";

export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex pb-8 lg:h-screen lg:pb-0">
      <div className="hidden w-1/2 bg-gray-100 lg:block dark:bg-zinc-900">
        <img
          width={1000}
          height={1000}
          src="/images/extra/image4.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex w-full items-center justify-center lg:w-1/2">
        <div className="w-full max-w-md space-y-8 px-4">{children}</div>
      </div>
    </div>
  );
}
