import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

function Poll({ className }: Props) {
  return (
    <Card className={cn("", className)}>
      <CardContent></CardContent>
    </Card>
  );
}

export default Poll;
