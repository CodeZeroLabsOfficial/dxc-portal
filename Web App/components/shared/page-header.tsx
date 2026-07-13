import { cn } from "@/lib/utils";
import { PageDescription, PageTitle } from "@/components/shared/typography";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-4 flex flex-row items-center justify-between gap-4", className)}>
      <div className="space-y-1">
        <PageTitle>{title}</PageTitle>
        {description ? <PageDescription>{description}</PageDescription> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
